
import React from 'react';
import { Game } from '../types';

interface GameCardProps {
  game: Game;
  onClick: () => void;
}

export const GameCard: React.FC<GameCardProps> = ({ game, onClick }) => {
  return (
    <div 
      className="group bg-dark-800 rounded-xl overflow-hidden border border-slate-800 hover:border-brand-500/50 hover:shadow-[0_0_20px_rgba(14,165,233,0.15)] transition-all duration-300 cursor-pointer flex flex-col h-full"
      onClick={onClick}
    >
      {/* Thumbnail */}
      <div className="relative h-48 w-full overflow-hidden bg-slate-900">
        <img 
          src={game.thumbnail} 
          alt={game.title} 
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
        />
        <div className="absolute top-2 right-2 flex gap-2">
          <div className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded text-xs font-mono text-white border border-white/10">
            {game.category}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold text-white group-hover:text-brand-400 transition-colors line-clamp-1">
            {game.title}
          </h3>
        </div>
        
        {/* Rating Stars */}
        <div className="flex items-center mb-3 space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <svg 
              key={star}
              className={`w-4 h-4 ${star <= Math.round(game.averageRating) ? 'text-yellow-400' : 'text-slate-600'}`} 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          ))}
          <span className="text-xs text-slate-500 ml-1">({Object.keys(game.ratings).length})</span>
        </div>

        <p className="text-slate-400 text-sm mb-4 line-clamp-2 flex-1">
          {game.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {game.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-300 border border-slate-600">
              #{tag}
            </span>
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-700">
          <div className="flex items-center">
            <img src={game.author.avatar} alt={game.author.name} className="w-5 h-5 rounded-full mr-2" />
            <span>{game.author.name}</span>
          </div>
          <div className="flex items-center space-x-3">
            <span className="flex items-center">
              <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
              {game.plays}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
