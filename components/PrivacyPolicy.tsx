import React, { useEffect } from 'react';
import { Theme } from '../types';

interface PrivacyPolicyProps {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ theme, toggleTheme }) => {
  
  // Set page title for SEO and verification
  useEffect(() => {
    document.title = "MeteoSran AI - Privacy Policy";
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
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">Privacy Policy</h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Last Updated: May 29, 2026</p>
            </div>

            {/* Introduction section */}
            <section className="space-y-4">
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                MeteoSran AI (conceived, designed, and developed by <strong>Marc Andréas Yao</strong>) is built as a Progressive Web App (PWA) with a forthcoming native mobile version. We are committed to protecting the privacy of our users while delivering advanced weather analysis and educational climatological insights.
              </p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                This Privacy Policy documents how we collect, use, process, and protect your information when you access our weather assistant platform via the web at <a href="https://meteosran.onrender.com" className="text-sky-500 hover:underline">https://meteosran.onrender.com</a> (future home at <a href="https://meteosran.com" className="text-sky-500 hover:underline">https://meteosran.com</a>) or use our forthcoming mobile app products.
              </p>
            </section>

            {/* Core Data Points */}
            <section className="space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">database_upload</span>
                1. Information We Collect and Process
              </h3>
              
              <div className="space-y-4 ml-2 sm:ml-4">
                
                {/* Geolocation */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined notranslate text-sky-400 text-lg" translate="no">location_on</span>
                    Geolocation Data
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    To deliver accurate, hyper-local weather predictions and climatological norms, MeteoSran requires location input. You may choose:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                    <li><strong>Automatic Geolocation</strong>: Uses browser or device location APIs (high-accuracy GPS or network data cached for 5 minutes to conserve battery).</li>
                    <li><strong>IP-Based Location</strong>: Fallback mechanism to approximate city coordinates.</li>
                    <li><strong>Manual Location</strong>: Manually entering city names or coordinates to query forecasts without giving device location permissions.</li>
                  </ul>
                </div>

                {/* Voice / Audio */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined notranslate text-sky-400 text-lg" translate="no">mic</span>
                    Audio Recording (Gemini Live Session)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    When you launch the voice-controlled Live Session mode, the app requests microphone permissions. MeteoSran captures raw 16kHz PCM audio data and streams it directly to Google's live multi-modal API via a secure WebSocket connection. We do not store, record, or analyze your audio files. Audio streams exist momentarily in memory and are discarded immediately after content generation.
                  </p>
                </div>

                {/* Image Uploads */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined notranslate text-sky-400 text-lg" translate="no">image</span>
                    Multi-Modal Input (Image Uploads)
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    MeteoSran supports image uploads to analyze weather phenomena (such as cloud types or storm damage). These images are converted to base64 encoding client-side and transmitted securely to Google's Gemini models for visual inspection. We do not persist these images on our database.
                  </p>
                </div>

                {/* Database Synced Data */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 flex items-center gap-2">
                    <span className="material-symbols-outlined notranslate text-sky-400 text-lg" translate="no">history</span>
                    Account and Conversation Storage
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    To let you access your chat logs across devices:
                  </p>
                  <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                    <li>We sync authorization data via Firebase Authentication (email, password hashes, and public display names).</li>
                    <li>Conversation logs, thread titles, and running memory summaries are stored securely in our PostgreSQL serverless database (Neon) via Prisma ORM and Firestore. You may delete individual sessions at any time through the history sidebar.</li>
                  </ul>
                </div>

              </div>
            </section>

            {/* Third party services */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">cloud</span>
                2. Third-Party Integrations and Data Flow
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                To generate forecast insights, we forward requests to highly secure third-party provider platforms. No personally identifiable information (PII) is attached to these external calls:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                <li><strong>Google Gemini AI API</strong>: Processes text, image, and PCM voice requests. Subject to Google's standard developer API privacy guidelines.</li>
                <li><strong>AccuWeather API</strong>: Retransmits local regional forecasts using sanitized city coordinates.</li>
                <li><strong>Open-Meteo API</strong>: Queries historical weather archive data using location coordinates.</li>
                <li><strong>Vercel Analytics & Speed Insights</strong>: Collects anonymized, GDPR-compliant Core Web Vitals to improve performance and prevent application crashes.</li>
              </ul>
            </section>

            {/* Privacy Protection and GDPR */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">shield</span>
                3. Privacy Protection and User Rights
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                We believe in complete transparency. We do not lease, trade, sell, or distribute your email addresses, location coordinates, or chat history under any circumstances. You retain full control over your data:
              </p>
              <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                <li>You can erase any individual chat thread at any time from your sidebar history, deleting it from Firestore and Neon databases.</li>
                <li>You can toggle geolocation access off in the settings module at any time and choose a manual city name search instead.</li>
              </ul>
            </section>

            {/* Subscriptions section */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">payments</span>
                4. Forthcoming Premium Tiers and Subscription Plans
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                MeteoSran is currently a public educational resource. To sustain live WebSocket connection hosting andAccuWeather API costs, a premium subscription model may be introduced in a forthcoming future version to support advanced real-time features. Transactions will be handled via third-party, PCI-DSS compliant secure payment gateways. No card details will ever touch our servers.
              </p>
            </section>

            {/* Contact details */}
            <section className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100 flex items-center gap-2">
                <span className="material-symbols-outlined notranslate text-sky-500" translate="no">contact_page</span>
                5. Contact Us
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                If you have any questions regarding this Privacy Policy, your database logs, or if you want to request complete account deletion, please contact the developer:
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
