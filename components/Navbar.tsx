
import React from 'react';
import { ViewMode, User } from '../types';
import { Button } from './Button';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut } from 'firebase/auth';
import { syncUserProfile } from '../services/dbService';

interface NavbarProps {
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  currentUser: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onNavigate, currentUser }) => {

  const handleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      // Sync with our database
      await syncUserProfile({
        id: user.uid,
        name: user.displayName || 'Anonymous',
        avatar: user.photoURL || 'https://picsum.photos/100',
        bio: 'New Member'
      });
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => {
    signOut(auth);
    onNavigate(ViewMode.BROWSE);
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-dark-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div 
            className="flex items-center cursor-pointer group"
            onClick={() => onNavigate(ViewMode.BROWSE)}
          >
            <div className="w-8 h-8 rounded bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center mr-3 group-hover:shadow-[0_0_15px_rgba(14,165,233,0.5)] transition-all">
              <span className="text-white font-bold text-lg">P</span>
            </div>
            <span className="text-xl font-bold text-white tracking-tight">
              Proto<span className="text-brand-500">Play</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <Button 
              variant="ghost" 
              onClick={() => onNavigate(ViewMode.BROWSE)}
              className={currentView === ViewMode.BROWSE ? 'text-brand-400 bg-white/5' : ''}
            >
              Explore
            </Button>
            
            <Button 
              variant="primary" 
              onClick={() => {
                if (!currentUser) {
                  handleLogin();
                } else {
                  onNavigate(ViewMode.UPLOAD);
                }
              }}
              icon={
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                  <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
                </svg>
              }
            >
              Upload
            </Button>

            {currentUser ? (
              <div className="flex items-center gap-3">
                <div 
                  className="h-8 w-8 rounded-full bg-slate-700 overflow-hidden border border-slate-600 cursor-pointer hover:border-brand-500 transition-colors"
                  onClick={() => onNavigate(ViewMode.PROFILE)}
                  title="My Profile"
                >
                  <img src={currentUser.avatar} alt="User" className="h-full w-full object-cover" />
                </div>
                <Button variant="ghost" size="sm" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            ) : (
              <Button variant="secondary" onClick={handleLogin} id="global-signin-btn">
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
