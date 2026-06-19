import React from 'react';

export const Footer: React.FC = () => {
  const year = 2026;
  const version = "1.8.3";

  return (
    <footer
      className="p-1 sm:p-2 text-center text-[8px] sm:text-[10px] w-full 
                 bg-white/10 dark:bg-slate-800/40 backdrop-blur-sm 
                 border-t border-white/20 dark:border-slate-700/40
                 text-slate-500 dark:text-slate-400"
      role="contentinfo"
    >
      <div className="container mx-auto">
        <p>
          &copy; {year} MeteoSran {version} by Marc Andréas Yao.
          {' | '}
          <a href="/privacy" className="hover:underline hover:text-sky-500 transition-colors">Privacy Policy</a>
          {' | '}
          <a href="/terms" className="hover:underline hover:text-sky-500 transition-colors">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
};