import React, { useEffect } from 'react';
import { Theme } from '../types';

interface TermsOfServiceProps {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ theme, toggleTheme }) => {
  
  // Set page title for SEO and verification
  useEffect(() => {
    document.title = "MeteoSran AI - Terms of Service";
  }, []);

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between font-sans overflow-x-hidden ${theme === 'dark' ? 'dark text-white' : 'text-slate-900'}`}>

      
      {/* Header */}
      <header className="relative z-50 w-full px-4 sm:px-6 py-4 bg-white/20 dark:bg-[#0a1020]/25 backdrop-blur-xl border-b border-slate-200/30 dark:border-slate-800/30 transition-all duration-300">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={handleBackToApp}>
            <img 
              src="/Meteosran-logo.png" 
              alt="MeteoSran Logo" 
              className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 p-1 shadow-md hover:scale-105 transition-transform" 
            />
            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight leading-none">MeteoSran AI</h1>
              <span className="text-[10px] sm:text-xs text-sky-600 dark:text-sky-400 font-medium tracking-wide">Weather Intelligence</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800/50 transition-colors focus:outline-none flex items-center justify-center min-touch-target"
              aria-label="Toggle theme"
            >
              <span className="material-symbols-outlined notranslate text-xl" translate="no">
                {theme === 'dark' ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
            <button 
              onClick={handleBackToApp}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-sky-500 hover:bg-sky-600 text-white shadow-md hover:shadow-lg transition-all focus:outline-none focus:ring-2 focus:ring-sky-500/50 active:scale-95 flex items-center gap-1.5 min-touch-target"
            >
              <span className="material-symbols-outlined notranslate text-sm" translate="no">arrow_back</span>
              Back to MeteoSran
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full px-4 sm:px-6 py-8 sm:py-12 relative">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white/40 dark:bg-slate-900/35 backdrop-blur-2xl shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden relative">
          
          {/* Decorative Aurora Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-400/10 via-indigo-400/5 to-transparent pointer-events-none" />
          
          <div className="p-6 sm:p-10 relative space-y-8 text-justify">
            
            {/* Header info */}
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Terms of Service</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Last Updated: May 29, 2026</p>
            </div>

            {/* Terms Content */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">gavel</span>
                1. Acceptance of Terms
              </h3>
              <p>
                By accessing or using the MeteoSran AI application (whether via our Progressive Web App at <a href="https://meteosran.onrender.com" className="text-sky-500 hover:underline">https://meteosran.onrender.com</a>, the future domain <a href="https://meteosran.com" className="text-sky-500 hover:underline">https://meteosran.com</a>, or our forthcoming native mobile products), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all usage of the platform.
              </p>
            </section>

            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">info</span>
                2. Description of Service
              </h3>
              <p>
                MeteoSran AI is an intelligent weather education and forecasting assistant platform developed by <strong>Marc Andréas Yao</strong>. It merges real-time data feeds (such as AccuWeather API), Open-Meteo Climatology normals, and Google's Gemini models. It provides contextual reports, voice capabilities, multi-modal input processing, and dynamic historical comparisons. The application is provided for informational and learning purposes.
              </p>
            </section>

            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">person</span>
                3. User Account and Responsibilities
              </h3>
              <p>
                To access persistent chat sessions and memory summaries, you may register using Firebase Authentication. You agree to:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4 text-xs">
                <li>Provide accurate, truthful information during authentication.</li>
                <li>Keep your credentials confidential and secure.</li>
                <li>Avoid executing high-frequency scripts, API spam, or server flooding attempts designed to induce high billing costs or server failures ("down spin" states).</li>
                <li>Refrain from uploading harmful, offensive, or copyrighted materials during visual multi-modal image inquiries.</li>
              </ul>
            </section>

            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">copyright</span>
                4. Intellectual Property Rights
              </h3>
              <p>
                All code assets, design elements, animations (such as the circular view transition wiper and Liquid Aura text stream effects), interactive background structures, the custom logo, and educational layouts are the exclusive property of <strong>Marc Andréas Yao</strong>. You may not copy, replicate, reverse-engineer, or redistribute any part of MeteoSran's UI design system or custom source files without prior written approval.
              </p>
            </section>

            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">warning</span>
                5. Limitation of Liability and Forecast Accuracy
              </h3>
              <p>
                <strong>Educational and Informational Disclaimer</strong>: MeteoSran fetches data from public and commercial third-party weather API channels. While we strive to verify scientific data accuracy, meteorological predictions are subject to real-time changes and modeling variances. 
              </p>
              <p>
                MeteoSran is not an emergency alerting platform. Do not make safety-critical travel decisions, agricultural investments, or critical evacuations based solely on AI summaries. Marc Andréas Yao shall not be held liable for any loss, damage, or disruption resulting from weather inaccuracies or API data outages.
              </p>
            </section>

            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">payments</span>
                6. Future Premium Tiers and Subscription Plans
              </h3>
              <p>
                MeteoSran is currently a public educational resource. To sustain live WebSocket connection hosting and AccuWeather API costs, a premium subscription model may be introduced in a forthcoming future version to support advanced real-time features. We reserve the right to modify or adjust pricing tiers, subscription requirements, or payment terms. Payment collection will be processed securely via compliant third-party gateways.
              </p>
            </section>

            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">map</span>
                7. Governing Law
              </h3>
              <p>
                These Terms of Service and any actions related to your usage of MeteoSran AI shall be governed by, and construed in accordance with, the laws of the Republic of Ivory Coast (Côte d'Ivoire), without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">contact_support</span>
                8. Questions and Support
              </h3>
              <p>
                For any questions regarding these Terms, or if you need developers support for code issues, contact us:
              </p>
              <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 text-xs sm:text-sm space-y-1.5 ml-2">
                <p><strong>Creator</strong>: Marc Andréas Yao</p>
                <p><strong>Email</strong>: <a href="mailto:marcandreas2018@gmail.com" className="text-sky-500 hover:underline">marcandreas2018@gmail.com</a></p>
                <p><strong>LinkedIn</strong>: <a href="https://www.linkedin.com/in/marcandreasyao" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">https://www.linkedin.com/in/marcandreasyao</a></p>
                <p><strong>Phone</strong>: <a href="tel:+2250778271018" className="text-sky-500 hover:underline">+225 0778271018</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full px-4 py-6 border-t border-slate-200/30 dark:border-slate-800/30 bg-white/10 dark:bg-[#0a1020]/20 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MeteoSran AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:underline hover:text-sky-500 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:underline hover:text-sky-500 transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>

    </div>
  );
};
