import React from 'react';

export const Footer: React.FC = () => {
  const year = 2025;
  const version = "1.6.5";

  return (
    <footer
      className="p-1 sm:p-2 text-center text-[8px] sm:text-[10px] w-full 
                 bg-white/10 dark:bg-slate-800/40 backdrop-blur-sm 
                 border-t border-white/20 dark:border-slate-700/40
                 text-slate-500 dark:text-slate-400"
      role="contentinfo"
    >
      <div className="container mx-auto">
        <p>&copy; {year} MeteoSran {version} by Marc Andréas Yao. </p>
        {/* <p>Powered by Gemini.</p> */}
      </div>
    </footer>
  );
};