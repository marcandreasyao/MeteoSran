
import React from 'react';

interface ErrorMessageProps {
  message: string;
  isCritical?: boolean; 
}

const ErrorIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`material-symbols-outlined mr-2 text-xl ${className}`}>error</span>
);

export const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, isCritical = false }) => {
  if (!message) return null;

  if (isCritical) {
    return (
      <div 
        className="bg-red-400/30 dark:bg-red-700/40 backdrop-blur-md 
                   border-l-4 border-red-600 dark:border-red-400 
                   text-red-800 dark:text-red-100 
                   p-4 rounded-md shadow-lg m-4 w-full max-w-lg text-center" 
        role="alert"
      >
        <div className="flex items-center justify-center mb-2">
          <ErrorIcon className="text-red-700 dark:text-red-300" />
          <strong className="font-bold text-lg">Initialization Error</strong>
        </div>
        <p>{message}</p>
        <p className="mt-2 text-sm opacity-90">Please check your setup or try refreshing the page.</p>
      </div>
    );
  }

  // Non-critical error shown in chat flow
  return (
    <div 
      className="bg-red-400/30 dark:bg-red-700/40 backdrop-blur-sm 
                 border border-red-500/50 dark:border-red-500/60
                 text-red-800 dark:text-red-100 
                 px-4 py-3 rounded-xl shadow-md my-2 max-w-lg" 
      role="alert"
    >
      <div className="flex items-center">
        <ErrorIcon className="text-red-700 dark:text-red-200" />
        <span className="block sm:inline text-sm">{message}</span>
      </div>
    </div>
  );
};
