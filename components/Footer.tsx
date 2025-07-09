import React from 'react';

export const Footer: React.FC = () => {
  const year = 2025; // As per previous context

  return (
    <footer 
      className="p-3 text-center text-xs sm:text-sm w-full 
                 bg-white/20 dark:bg-slate-800/60 backdrop-blur-md 
                 border-t border-white/40 dark:border-slate-700/60
                 text-slate-700 dark:text-slate-100"
      role="contentinfo"
    >
      <div className="container mx-auto">
        <p>&copy; {year} MeteoSran 1.1 by Marc Andréas Yao. </p>
        {/* <p>Powered by Gemini.</p> */}
      </div>
    </footer>
  );
};