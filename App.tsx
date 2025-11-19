
import React, { useState, useMemo, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GameCard } from './components/GameCard';
import { CodeEditor } from './components/CodeEditor';
import { Button } from './components/Button';
import { Game, ViewMode, Comment, User } from './types';
import { generateGameMetadata, getAiCodeReview } from './services/geminiService';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  subscribeToGames, 
  publishGame, 
  addGameComment, 
  updateGameRating,
  updateGamePlays 
} from './services/dbService';

const CATEGORIES = ['All', 'Arcade', 'RPG', 'Puzzle', 'Action', 'Simulation', 'Strategy', 'Other'];

// --- Components ---

const FeedbackItem: React.FC<{ comment: Comment }> = ({ comment }) => (
  <div className="flex space-x-3 p-4 bg-dark-800 rounded-lg border border-slate-800">
    <img src={comment.user.avatar} alt={comment.user.name} className="w-10 h-10 rounded-full" />
    <div className="flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold text-sm text-white">{comment.user.name}</span>
        <span className="text-xs text-slate-500">
          {new Date(comment.timestamp).toLocaleDateString()}
        </span>
      </div>
      <p className="text-slate-300 text-sm mb-2">{comment.text}</p>
      <div className="flex justify-between items-center">
        <span className={`text-xs px-2 py-0.5 rounded border ${
            comment.type === 'bug' ? 'bg-red-900/30 border-red-800 text-red-400' :
            comment.type === 'suggestion' ? 'bg-blue-900/30 border-blue-800 text-blue-400' :
            'bg-green-900/30 border-green-800 text-green-400'
        }`}>
            {comment.type.toUpperCase()}
        </span>
        {comment.gameTitle && <span className="text-xs text-slate-600">on {comment.gameTitle}</span>}
      </div>
    </div>
  </div>
);

function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  // View State
  const [view, setView] = useState<ViewMode>(ViewMode.BROWSE);
  
  // Data State
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  
  // Use ID for selection to ensure data is always fresh from 'games' array
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const selectedGame = useMemo(() => 
    games.find(g => g.id === selectedGameId) || null
  , [games, selectedGameId]);

  const [selectedProfileUser, setSelectedProfileUser] = useState<User | null>(null);

  // Filtering & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState<'newest' | 'rating' | 'popular'>('newest');
  
  // Upload State
  const [uploadCode, setUploadCode] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Game Details State
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [iframeKey, setIframeKey] = useState(0);

  // 1. Listen for Auth Changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setCurrentUser({
          id: user.uid,
          name: user.displayName || 'Anonymous',
          avatar: user.photoURL || 'https://picsum.photos/100',
          bio: 'Member'
        });
      } else {
        setCurrentUser(null);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Listen for Real-time Game Updates
  useEffect(() => {
    const unsubscribe = subscribeToGames((data) => {
      setGames(data);
      setLoadingGames(false);
    });
    return () => unsubscribe();
  }, []);

  const handleGameClick = (game: Game) => {
    setSelectedGameId(game.id);
    setAiReview(null);
    setIframeKey(0);
    setView(ViewMode.PLAY);
    
    // Increment play count
    updateGamePlays(game.id, game.plays);
  };

  const handleProfileClick = (user: User) => {
    setSelectedProfileUser(user);
    setView(ViewMode.PROFILE);
  }

  const handlePublish = async () => {
    if (!uploadCode.trim() || !currentUser) return;
    setIsAnalyzing(true);
    
    const metadata = await generateGameMetadata(uploadCode);
    
    const newGameData: Omit<Game, "id"> = {
      title: metadata?.title || 'Untitled Prototype',
      description: metadata?.description || 'No description provided.',
      tags: metadata?.tags || ['Prototype'],
      category: metadata?.category || 'Other',
      code: uploadCode,
      author: currentUser,
      thumbnail: `https://picsum.photos/seed/${Date.now()}/400/300`,
      plays: 0,
      comments: [],
      ratings: {},
      averageRating: 0,
      createdAt: Date.now()
    };

    try {
      await publishGame(newGameData);
      setUploadCode('');
      setView(ViewMode.BROWSE);
    } catch (e) {
      console.error("Failed to publish", e);
      alert("Failed to publish game. See console.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleGenerateReview = async () => {
    if (!selectedGame) return;
    setIsReviewing(true);
    const review = await getAiCodeReview(selectedGame.code);
    setAiReview(review);
    setIsReviewing(false);
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !selectedGame || !currentUser) return;
    
    const comment: Comment = {
      id: Date.now().toString(),
      user: currentUser,
      text: newComment,
      timestamp: Date.now(),
      type: 'suggestion',
      gameId: selectedGame.id,
      gameTitle: selectedGame.title
    };
    
    try {
      await addGameComment(selectedGame.id, comment);
      setNewComment('');
    } catch (e) {
      console.error("Error posting comment", e);
    }
  };

  const handleRateGame = async (rating: number) => {
    if (!selectedGame || !currentUser) {
      alert("Please sign in to rate games.");
      return;
    }
    
    await updateGameRating(selectedGame.id, currentUser.id, rating, selectedGame.ratings);
  };

  // Filter Logic
  const filteredGames = useMemo(() => {
    let result = games;

    // Search
    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(g => 
        g.title.toLowerCase().includes(lower) || 
        g.tags.some(t => t.toLowerCase().includes(lower))
      );
    }

    // Category
    if (selectedCategory !== 'All') {
      result = result.filter(g => g.category === selectedCategory);
    }

    // Sort
    return result.sort((a, b) => {
      if (sortBy === 'newest') return b.createdAt - a.createdAt;
      if (sortBy === 'rating') return b.averageRating - a.averageRating;
      if (sortBy === 'popular') return b.plays - a.plays;
      return 0;
    });
  }, [games, searchTerm, selectedCategory, sortBy]);


  // --- Pages ---

  const renderBrowse = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-4">Discover Prototypes</h1>
        <p className="text-slate-400 max-w-2xl mb-6">
          Play, test, and give feedback on the latest HTML5 game prototypes.
        </p>
        
        <div className="bg-dark-800 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-4 items-center">
           <div className="relative flex-1 w-full">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              <input 
                type="text"
                placeholder="Search games or tags..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-dark-900 text-slate-200 pl-10 pr-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
              />
           </div>
           <div className="flex gap-4 w-full md:w-auto">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-dark-900 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
              >
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'rating' | 'popular')}
                className="bg-dark-900 text-slate-200 px-4 py-2 rounded-lg border border-slate-700 focus:outline-none focus:border-brand-500"
              >
                 <option value="newest">Newest</option>
                 <option value="rating">Highest Rated</option>
                 <option value="popular">Most Popular</option>
              </select>
           </div>
        </div>
      </div>
      
      {loadingGames ? (
        <div className="flex justify-center py-20">
           <svg className="animate-spin h-10 w-10 text-brand-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredGames.length > 0 ? (
            filteredGames.map(game => (
              <GameCard 
                key={game.id} 
                game={game} 
                onClick={() => handleGameClick(game)} 
              />
            ))
          ) : (
            <div className="col-span-full text-center py-20 text-slate-500">
              No games found. Be the first to upload!
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderProfile = () => {
    const user = selectedProfileUser || currentUser;
    
    if (!user) return (
      <div className="flex justify-center items-center h-64 text-slate-500">Please sign in to view profile.</div>
    );

    const userGames = games.filter(g => g.author.id === user.id);
    
    const userComments = games.reduce<Comment[]>((acc, g) => {
      const usersComments = (g.comments || []).filter(c => c.user.id === user.id);
      return [...acc, ...usersComments];
    }, []).sort((a,b) => b.timestamp - a.timestamp);

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-dark-800 rounded-xl border border-slate-800 p-8 mb-8 flex flex-col md:flex-row items-center md:items-start gap-6">
           <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-4 border-brand-600" />
           <div className="text-center md:text-left flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
              <p className="text-slate-400 mb-4">{user.bio || "No bio provided."}</p>
              <div className="flex items-center justify-center md:justify-start gap-6 text-sm">
                 <div className="bg-dark-900 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="block font-bold text-white text-lg">{userGames.length}</span>
                    <span className="text-slate-500">Prototypes</span>
                 </div>
                 <div className="bg-dark-900 px-4 py-2 rounded-lg border border-slate-700">
                    <span className="block font-bold text-white text-lg">{userComments.length}</span>
                    <span className="text-slate-500">Comments</span>
                 </div>
              </div>
           </div>
           {currentUser && user.id === currentUser.id && (
              <Button variant="secondary" onClick={() => setView(ViewMode.UPLOAD)}>Upload New</Button>
           )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           <div className="lg:col-span-2">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                 <svg className="w-5 h-5 mr-2 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                 Published Prototypes
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 {userGames.length > 0 ? userGames.map(g => (
                    <GameCard key={g.id} game={g} onClick={() => handleGameClick(g)} />
                 )) : (
                    <p className="text-slate-500 italic">No prototypes published yet.</p>
                 )}
              </div>
           </div>

           <div>
              <h2 className="text-xl font-bold text-white mb-6 flex items-center">
                 <svg className="w-5 h-5 mr-2 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                 Recent Activity
              </h2>
              <div className="space-y-4">
                 {userComments.length > 0 ? userComments.map(c => (
                    <div key={c.id} className="bg-dark-800 p-4 rounded-lg border border-slate-800 text-sm">
                       <div className="flex justify-between text-xs text-slate-500 mb-2">
                          <span>on <span className="text-brand-400 cursor-pointer hover:underline" onClick={() => {
                             const g = games.find(game => game.id === c.gameId);
                             if (g) handleGameClick(g);
                          }}>{c.gameTitle || 'Unknown Game'}</span></span>
                          <span>{new Date(c.timestamp).toLocaleDateString()}</span>
                       </div>
                       <p className="text-slate-300">"{c.text}"</p>
                    </div>
                 )) : (
                    <p className="text-slate-500 italic">No recent activity.</p>
                 )}
              </div>
           </div>
        </div>
      </div>
    );
  };

  const renderUpload = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 h-[calc(100vh-64px)] flex flex-col">
       <div className="flex justify-between items-end mb-6">
          <div>
             <h2 className="text-3xl font-bold text-white">Upload Prototype</h2>
             <p className="text-slate-400">Paste your single-file HTML/JS code below.</p>
          </div>
          <Button 
            size="lg" 
            onClick={handlePublish} 
            loading={isAnalyzing}
            disabled={!uploadCode || !currentUser}
          >
            {isAnalyzing ? 'AI is Analyzing...' : 'Publish Prototype'}
          </Button>
       </div>

       <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 min-h-0">
          <CodeEditor 
            value={uploadCode} 
            onChange={setUploadCode} 
            placeholder="Paste your standard HTML5 game code here..."
          />
          <div className="hidden lg:flex flex-col bg-dark-900 rounded-lg border border-slate-800 overflow-hidden">
             <div className="bg-dark-800 px-4 py-2 border-b border-slate-700">
                <span className="text-xs text-slate-400 font-mono">Live Preview</span>
             </div>
             <div className="flex-1 bg-black relative">
                {uploadCode ? (
                   <iframe 
                     title="preview"
                     srcDoc={uploadCode} 
                     className="w-full h-full absolute inset-0"
                     sandbox="allow-scripts allow-pointer-lock"
                   />
                ) : (
                   <div className="flex items-center justify-center h-full text-slate-600">
                      Preview appears here
                   </div>
                )}
             </div>
          </div>
       </div>
    </div>
  );

  const renderPlay = () => {
    if (!selectedGame) return null;
    
    const userRating = currentUser ? (selectedGame.ratings[currentUser.id] || 0) : 0;

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex items-center text-sm text-slate-400">
          <button onClick={() => setView(ViewMode.BROWSE)} className="hover:text-brand-400 transition-colors">Browse</button>
          <span className="mx-2">/</span>
          <span className="text-white">{selectedGame.title}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           {/* Left: Game & Info */}
           <div className="lg:col-span-2 space-y-6">
              <div className="aspect-video bg-black rounded-xl overflow-hidden border border-slate-700 shadow-2xl shadow-black/50 relative group">
                 <iframe 
                    key={`${selectedGame.id}-${iframeKey}`}
                    srcDoc={selectedGame.code}
                    className="w-full h-full"
                    title={selectedGame.title}
                    sandbox="allow-scripts allow-pointer-lock allow-same-origin"
                 />
                 
                 <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                    <Button 
                      size="sm" 
                      variant="secondary" 
                      onClick={() => setIframeKey(k => k + 1)}
                      className="bg-dark-900/80 backdrop-blur border-slate-600 hover:bg-brand-600 hover:border-brand-500 shadow-lg"
                      icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
                    >
                      Play Again
                    </Button>
                 </div>
              </div>

              <div className="bg-dark-800 rounded-xl p-6 border border-slate-800">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <h1 className="text-2xl font-bold text-white mb-1">{selectedGame.title}</h1>
                       <div 
                          className="flex items-center space-x-4 text-sm text-slate-400 cursor-pointer hover:text-brand-400 transition-colors"
                          onClick={() => handleProfileClick(selectedGame.author)}
                        >
                          <span className="flex items-center">
                             <img src={selectedGame.author.avatar} alt="" className="w-5 h-5 rounded-full mr-2"/>
                             {selectedGame.author.name}
                          </span>
                          <span>•</span>
                          <span>{new Date(selectedGame.createdAt).toLocaleDateString()}</span>
                       </div>
                    </div>
                    <div className="flex flex-col items-end">
                       <div className="flex items-center mb-2">
                          {[1,2,3,4,5].map(star => (
                            <button 
                              key={star}
                              onClick={() => handleRateGame(star)}
                              disabled={!currentUser}
                              className={`focus:outline-none transition-transform hover:scale-110 ${star <= userRating ? 'text-yellow-400' : 'text-slate-600 hover:text-yellow-500'} ${!currentUser ? 'cursor-not-allowed opacity-50' : ''}`}
                            >
                               <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                            </button>
                          ))}
                       </div>
                       <span className="text-xs text-slate-500">{Object.keys(selectedGame.ratings || {}).length} ratings (Avg: {(selectedGame.averageRating || 0).toFixed(1)})</span>
                    </div>
                 </div>
                 <p className="text-slate-300 leading-relaxed">{selectedGame.description}</p>
                 <div className="mt-4 flex flex-wrap gap-2">
                    <span className="px-3 py-1 rounded-full text-sm bg-brand-900/30 text-brand-300 border border-brand-800">
                        {selectedGame.category}
                    </span>
                    {selectedGame.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 rounded-full text-sm bg-slate-700/50 text-slate-300 border border-slate-700">
                          #{tag}
                       </span>
                    ))}
                 </div>
              </div>

              <div className="bg-dark-800 rounded-xl p-6 border border-slate-800">
                 <h3 className="text-xl font-bold text-white mb-4">Community Feedback ({(selectedGame.comments || []).length})</h3>
                 
                 {currentUser ? (
                   <div className="mb-6 flex gap-3">
                      <input 
                        type="text" 
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 bg-dark-900 border border-slate-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-brand-500"
                        placeholder="Found a bug? Have an idea?"
                      />
                      <Button onClick={handlePostComment}>Post</Button>
                   </div>
                 ) : (
                   <div className="mb-6 p-4 bg-dark-900/50 rounded text-center text-slate-400 text-sm">
                      Please <button onClick={() => (document.getElementById('global-signin-btn') as HTMLElement | null)?.click()} className="text-brand-400 hover:underline">sign in</button> to post comments.
                   </div>
                 )}

                 <div className="space-y-4">
                    {selectedGame.comments && selectedGame.comments.length > 0 ? (
                      selectedGame.comments.map(comment => (
                        <FeedbackItem key={comment.id} comment={comment} />
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-4">No comments yet. Be the first!</p>
                    )}
                 </div>
              </div>
           </div>

           {/* Right: AI & Metadata */}
           <div className="space-y-6">
              <div className="bg-gradient-to-b from-indigo-900/30 to-dark-800 rounded-xl border border-indigo-500/30 p-6">
                 <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded bg-indigo-500 flex items-center justify-center mr-3">
                       <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                    </div>
                    <h3 className="text-lg font-bold text-white">AI Playtest Agent</h3>
                 </div>
                 
                 {!aiReview ? (
                   <div className="text-center py-6">
                      <p className="text-slate-400 text-sm mb-4">
                        Get instant feedback on code quality, potential bugs, and gameplay improvements.
                      </p>
                      <Button 
                        variant="primary" 
                        onClick={handleGenerateReview}
                        loading={isReviewing}
                        className="w-full"
                      >
                        Run AI Analysis
                      </Button>
                   </div>
                 ) : (
                   <div className="prose prose-invert prose-sm max-h-[500px] overflow-y-auto">
                      <div className="whitespace-pre-wrap text-slate-300 text-sm">
                        {aiReview}
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setAiReview(null)}
                        className="mt-4 w-full"
                      >
                        Clear Analysis
                      </Button>
                   </div>
                 )}
              </div>

              <div className="bg-dark-800 rounded-xl border border-slate-800 p-5">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Tech Specs</h4>
                <ul className="space-y-2 text-sm text-slate-300">
                  <li className="flex justify-between">
                    <span>Engine</span>
                    <span className="text-white">Raw HTML5 Canvas</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Size</span>
                    <span className="text-white">{(selectedGame.code.length / 1024).toFixed(2)} KB</span>
                  </li>
                  <li className="flex justify-between">
                    <span>Resolution</span>
                    <span className="text-white">Responsive</span>
                  </li>
                </ul>
              </div>
           </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
      return <div className="min-h-screen bg-dark-950 text-slate-200 flex items-center justify-center">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-dark-950 text-slate-200 font-sans selection:bg-brand-500/30">
      <Navbar currentView={view} onNavigate={(v) => {
        if(v === ViewMode.PROFILE) setSelectedProfileUser(null); // Reset to current user
        setView(v);
      }} currentUser={currentUser} />
      
      <main>
        {view === ViewMode.BROWSE && renderBrowse()}
        {view === ViewMode.UPLOAD && (currentUser ? renderUpload() : <div className="p-10 text-center">Please sign in to upload.</div>)}
        {view === ViewMode.PLAY && renderPlay()}
        {view === ViewMode.PROFILE && renderProfile()}
      </main>
    </div>
  );
}

export default App;
