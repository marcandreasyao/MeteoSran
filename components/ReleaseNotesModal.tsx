import React, { useState, useEffect } from 'react';

interface ReleaseNotesModalProps {
  onClose: () => void;
}

export const ReleaseNotesModal: React.FC<ReleaseNotesModalProps> = ({ onClose }) => {
  const [isClosing, setIsClosing] = useState(false);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(onClose, 300); // Wait for fade-out animation
  };

  // Prevent background scrolling while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  return (
    <div className={`fixed inset-0 z-[1000] flex items-center justify-center p-4 sm:p-6 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={handleClose}
      />
      
      {/* Modal Container */}
      <div className={`relative w-full max-w-lg overflow-hidden rounded-3xl bg-white/95 dark:bg-[#1a1b1e]/95 backdrop-blur-2xl shadow-2xl border border-white/50 dark:border-white/10 ${isClosing ? 'animate-modal-fade-out' : 'animate-modal-pop'}`}>
        
        {/* Aurora Ambient Glow */}
        <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-400/10 via-indigo-400/5 to-transparent pointer-events-none" />
        
        {/* Header */}
        <div className="relative flex items-center justify-between p-5 sm:p-6 border-b border-slate-200/50 dark:border-slate-700/50">
          <div className="flex items-center gap-3">
            <img src="/Meteosran-logo.png" alt="MeteoSran Logo" className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 p-1 shadow-sm" />
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">What's New in 1.6.6</h2>
              <p className="text-xs sm:text-sm text-sky-600 dark:text-sky-400 font-medium">Premium Aesthetic & Stability Upgrade</p>
            </div>
          </div>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors focus:outline-none"
            aria-label="Close"
          >
            <span className="material-symbols-outlined text-xl">close</span>
          </button>
        </div>
        
        {/* Content */}
        <div className="relative p-5 sm:p-6 space-y-4 sm:space-y-5 max-h-[60vh] overflow-y-auto custom-scrollbar">
          
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-slate-600 dark:text-slate-300">database</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Robust Core Architecture</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">Completely fixed chat history persistence & syncing. Resolved "Down Spin" server issues for lightning-fast, reliable AI responses.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sky-100 dark:bg-sky-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-sky-600 dark:text-sky-400">water_drop</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Liquid Aura Streaming</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">A completely new fluid text generation effect. Watch the AI write with a stable, glowing trailing cursor instead of jumpy text blocks.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-indigo-600 dark:text-indigo-400">code_blocks</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aurora Glass Code Blocks</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">Mac-style traffic light headers and glassmorphic copy controls transform technical answers into premium developer tools.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px] text-emerald-600 dark:text-emerald-400">side_navigation</span>
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Minimalist Slate Sidebar</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">Experience a typography-driven history, animated hover glides, glowing active blue dot indicators, and a sleek bottom-line search.</p>
              </div>
            </div>
          </div>
          
        </div>
        
        {/* Footer */}
        <div className="relative p-5 sm:p-6 border-t border-slate-200/50 dark:border-slate-700/50 bg-slate-50/50 dark:bg-slate-800/30 flex justify-end">
          <button 
            onClick={handleClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-sky-500 hover:bg-sky-600 text-white font-medium shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 active:scale-95"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
