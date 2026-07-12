import React from 'react';

export const PageLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-6 animate-fade-in">
        {/* Optional Spinner */}
        <div className="relative flex h-12 w-12 items-center justify-center">
          <div className="absolute h-full w-full rounded-full border-4 border-border"></div>
          <div className="absolute h-full w-full rounded-full border-4 border-accent border-t-transparent animate-spin"></div>
        </div>
        
        {/* Shimmering Text */}
        <h2 className="text-2xl font-bold tracking-wider animate-shimmer">
          Context relay
        </h2>
      </div>
    </div>
  );
};
