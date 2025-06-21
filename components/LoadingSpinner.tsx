
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-5 h-5 border-2',
    md: 'w-8 h-8 border-t-2 border-r-2 border-b-2 border-l-0', // Adjusted for common spinner style
    lg: 'w-12 h-12 border-t-4 border-r-4 border-b-4 border-l-0',
  };
  // Tailwind's JIT compiler will pick these up:
  const colorClasses = "border-blue-500 dark:border-sky-400";


  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-t-transparent ${colorClasses}`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};
