import React from 'react';

interface LoadingProgressProps {
  progress: number;
  message: string;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({ progress, message }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="w-full max-w-md p-6 bg-white/10 dark:bg-slate-800/10 rounded-xl backdrop-blur-lg border border-white/20 dark:border-slate-700/20 shadow-2xl">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              {message}
            </h3>
            <span className="text-sm font-medium text-sky-600 dark:text-sky-400">
              {progress}%
            </span>
          </div>
          
          <div className="relative h-2 bg-slate-200/50 dark:bg-slate-700/50 rounded-full overflow-hidden">
            <div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-sky-600 dark:from-sky-500 dark:to-sky-700 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
            </div>
          </div>

          <div className="flex items-center justify-center space-x-2 text-sm text-slate-600 dark:text-slate-400">
            <span className="animate-pulse">●</span>
            <span>Initializing MeteoSran</span>
            <span className="animate-pulse">●</span>
          </div>
        </div>
      </div>
    </div>
  );
}; 