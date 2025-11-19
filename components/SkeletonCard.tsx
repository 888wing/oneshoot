import React from 'react';

export const SkeletonCard: React.FC = () => {
  return (
    <div className="bg-dark-800 rounded-xl overflow-hidden border border-slate-800 h-full flex flex-col">
      {/* Image Skeleton */}
      <div className="h-48 w-full bg-slate-800 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 animate-[shimmer_2s_infinite]"></div>
        <div className="absolute top-2 right-2 h-6 w-16 bg-slate-700 rounded z-10"></div>
      </div>

      {/* Content Skeleton */}
      <div className="p-5 flex-1 flex flex-col">
        {/* Title */}
        <div className="h-6 bg-slate-800 rounded w-3/4 mb-4 animate-pulse"></div>

        {/* Stars */}
        <div className="flex space-x-1 mb-4">
          {[1,2,3,4,5].map(i => (
            <div key={i} className="w-4 h-4 bg-slate-800 rounded-full animate-pulse"></div>
          ))}
        </div>

        {/* Description */}
        <div className="space-y-2 mb-4 flex-1">
          <div className="h-3 bg-slate-800 rounded w-full animate-pulse"></div>
          <div className="h-3 bg-slate-800 rounded w-5/6 animate-pulse"></div>
          <div className="h-3 bg-slate-800 rounded w-4/6 animate-pulse"></div>
        </div>

        {/* Tags */}
        <div className="flex gap-2 mb-4">
          <div className="h-5 w-12 bg-slate-800 rounded animate-pulse"></div>
          <div className="h-5 w-16 bg-slate-800 rounded animate-pulse"></div>
          <div className="h-5 w-10 bg-slate-800 rounded animate-pulse"></div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-full bg-slate-800 animate-pulse"></div>
            <div className="h-3 w-20 bg-slate-800 rounded animate-pulse"></div>
          </div>
          <div className="h-3 w-8 bg-slate-800 rounded animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};