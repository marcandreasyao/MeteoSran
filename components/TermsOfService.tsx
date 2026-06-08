import React, { useEffect } from 'react';
import { Theme } from '../types';
import { useLanguage } from '../src/hooks/useLanguage';

interface TermsOfServiceProps {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ theme, toggleTheme }) => {
  const [lang, toggleLang] = useLanguage();

  useEffect(() => {
    document.title = lang === 'fr'
      ? "MeteoSran AI - Conditions d'Utilisation"
      : 'MeteoSran AI - Terms of Service';
  }, [lang]);

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  return (
    <div className={`min-h-screen w-full flex flex-col justify-between font-sans overflow-x-hidden ${theme === 'dark' ? 'dark text-white' : 'text-slate-900'}`}>

      {/* ── Header ────────────────────────────────────────────────── */}
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

          <div className="flex items-center gap-1">
            {/* Language toggle — shows the language you'd switch TO */}
            <button
              onClick={toggleLang}
              aria-label={lang === 'fr' ? 'Switch to English' : 'Passer en français'}
              className="px-2 py-1 text-xs font-semibold tracking-widest text-slate-500 dark:text-slate-400 hover:text-sky-500 dark:hover:text-sky-400 transition-colors focus:outline-none"
            >
              {lang === 'fr' ? 'EN' : 'FR'}
            </button>

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
              className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white text-xs font-semibold shadow-lg shadow-blue-500/20 active:scale-[0.97] transition-all focus:outline-none flex items-center gap-1.5 min-touch-target"
            >
              <span className="material-symbols-outlined notranslate text-sm" translate="no">arrow_back</span>
              {lang === 'fr' ? 'Retour à MeteoSran' : 'Back to MeteoSran'}
            </button>
          </div>
        </div>
      </header>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main className="flex-grow w-full px-4 sm:px-6 py-8 sm:py-12 relative">
        <div className="max-w-4xl mx-auto rounded-3xl bg-white/40 dark:bg-slate-900/35 backdrop-blur-2xl shadow-2xl border border-white/50 dark:border-white/10 overflow-hidden relative">

          {/* Decorative Aurora Ambient Glow */}
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-sky-400/10 via-indigo-400/5 to-transparent pointer-events-none" />

          <div className="p-6 sm:p-10 relative space-y-8 text-justify">

            {/* ── Page title block ── */}
            <div className="border-b border-slate-200/50 dark:border-slate-800/50 pb-6">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                {lang === 'fr' ? "Conditions d'Utilisation" : 'Terms of Service'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                {lang === 'fr' ? 'Dernière mise à jour\u00A0: 29 mai 2026' : 'Last Updated: May 29, 2026'}
              </p>
            </div>

            {/* ── Section 1: Acceptance ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '1. Acceptation des Conditions' : '1. Acceptance of Terms'}
              </h3>
              {lang === 'fr' ? (
                <p>
                  En accédant ou en utilisant l'application MeteoSran AI (que ce soit via notre Progressive Web App sur{' '}
                  <a href="https://meteosran.com" className="text-sky-500 hover:underline">https://meteosran.com</a>{' '}
                  (et son sous-domaine de redirection{' '}
                  <a href="https://www.meteosran.com" className="text-sky-500 hover:underline">https://www.meteosran.com</a>{' '}
                  ou le domaine d'hébergement technique{' '}
                  <a href="https://meteosran.onrender.com" className="text-sky-500 hover:underline">https://meteosran.onrender.com</a>),
                  {' '}ou nos futurs produits mobiles natifs), vous reconnaissez avoir lu, compris et accepté d'être lié par les présentes Conditions d'Utilisation. Si vous n'acceptez pas ces conditions, vous devez immédiatement cesser toute utilisation de la plateforme.
                </p>
              ) : (
                <p>
                  By accessing or using the MeteoSran AI application (whether via our Progressive Web App at{' '}
                  <a href="https://meteosran.com" className="text-sky-500 hover:underline">https://meteosran.com</a>{' '}
                  (along with its redirect subdomain{' '}
                  <a href="https://www.meteosran.com" className="text-sky-500 hover:underline">https://www.meteosran.com</a>{' '}
                  or the technical web service hosting at{' '}
                  <a href="https://meteosran.onrender.com" className="text-sky-500 hover:underline">https://meteosran.onrender.com</a>),
                  {' '}or our forthcoming native mobile products), you acknowledge that you have read, understood, and agree to be bound by these Terms of Service. If you do not agree to these terms, you must immediately cease all usage of the platform.
                </p>
              )}
            </section>

            {/* ── Section 2: Description of service ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '2. Description du Service' : '2. Description of Service'}
              </h3>
              <p>
                {lang === 'fr'
                  ? <>MeteoSran AI est une plateforme d'assistance intelligente à l'éducation météorologique et aux prévisions, développée par <strong>Marc Andréas Yao</strong>. Elle combine des flux de données en temps réel (tels que l'API AccuWeather), les normales climatologiques Open-Meteo et nos modèles d'IA propriétaires. Elle fournit des rapports contextuels, des capacités vocales, un traitement multi-modal des entrées et des comparaisons historiques dynamiques. L'application est fournie à des fins d'information et d'apprentissage.</>
                  : <>MeteoSran AI is an intelligent weather education and forecasting assistant platform developed by <strong>Marc Andréas Yao</strong>. It merges real-time data feeds (such as AccuWeather API), Open-Meteo Climatology normals, and our proprietary AI models. It provides contextual reports, voice capabilities, multi-modal input processing, and dynamic historical comparisons. The application is provided for informational and learning purposes.</>
                }
              </p>
            </section>

            {/* ── Section 3: User responsibilities ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '3. Compte Utilisateur et Responsabilités' : '3. User Account and Responsibilities'}
              </h3>
              <p>
                {lang === 'fr'
                  ? "Pour accéder aux sessions de conversation persistantes et aux résumés de mémoire, vous pouvez vous inscrire via Firebase Authentication. Vous acceptez de\u00A0:"
                  : 'To access persistent chat sessions and memory summaries, you may register using Firebase Authentication. You agree to:'}
              </p>
              {lang === 'fr' ? (
                <ul className="list-disc list-inside space-y-2 ml-4 text-xs">
                  <li>Fournir des informations exactes et véridiques lors de l'authentification.</li>
                  <li>Garder vos identifiants confidentiels et sécurisés.</li>
                  <li>Éviter l'exécution de scripts à haute fréquence, le spam d'API ou les tentatives de saturation du serveur destinées à provoquer des coûts de facturation élevés ou des défaillances de l'infrastructure.</li>
                  <li>S'abstenir de télécharger des contenus nuisibles, offensants ou protégés par des droits d'auteur lors des demandes d'analyse d'images multi-modales.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside space-y-2 ml-4 text-xs">
                  <li>Provide accurate, truthful information during authentication.</li>
                  <li>Keep your credentials confidential and secure.</li>
                  <li>Avoid executing high-frequency scripts, API spam, or server flooding attempts designed to induce high billing costs or server failures ("down spin" states).</li>
                  <li>Refrain from uploading harmful, offensive, or copyrighted materials during visual multi-modal image inquiries.</li>
                </ul>
              )}
            </section>

            {/* ── Section 4: IP rights ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '4. Droits de Propriété Intellectuelle' : '4. Intellectual Property Rights'}
              </h3>
              <p>
                {lang === 'fr'
                  ? <>L'ensemble des actifs de code, des éléments de design, des animations (telles que l'effet de transition circulaire et les effets de flux de texte Liquid Aura), des structures d'arrière-plan interactives, du logo personnalisé et des mises en page éducatives sont la propriété exclusive de <strong>Marc Andréas Yao</strong>. Vous ne pouvez pas copier, reproduire, décompiler ou redistribuer toute partie du système de design UI ou des fichiers sources personnalisés de MeteoSran sans autorisation écrite préalable.</>
                  : <>All code assets, design elements, animations (such as the circular view transition wiper and Liquid Aura text stream effects), interactive background structures, the custom logo, and educational layouts are the exclusive property of <strong>Marc Andréas Yao</strong>. You may not copy, replicate, reverse-engineer, or redistribute any part of MeteoSran's UI design system or custom source files without prior written approval.</>
                }
              </p>
            </section>

            {/* ── Section 5: Liability ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr'
                  ? '5. Limitation de Responsabilité et Précision des Prévisions'
                  : '5. Limitation of Liability and Forecast Accuracy'}
              </h3>
              {lang === 'fr' ? (
                <>
                  <p>
                    <strong>Avertissement éducatif et informatif{'\u00A0'}:</strong> MeteoSran récupère des données provenant de canaux d'API météorologiques tiers publics et commerciaux. Bien que nous nous efforcions de vérifier l'exactitude des données scientifiques, les prévisions météorologiques sont soumises à des changements en temps réel et à des variations de modélisation.
                  </p>
                  <p>
                    MeteoSran n'est pas une plateforme d'alerte d'urgence. Ne prenez pas de décisions de voyage critiques pour la sécurité, d'investissements agricoles ou d'évacuations basées uniquement sur les résumés de l'IA. Marc Andréas Yao ne saurait être tenu responsable de toute perte, dommage ou perturbation résultant d'inexactitudes météorologiques ou de pannes de données API.
                  </p>
                </>
              ) : (
                <>
                  <p>
                    <strong>Educational and Informational Disclaimer:</strong> MeteoSran fetches data from public and commercial third-party weather API channels. While we strive to verify scientific data accuracy, meteorological predictions are subject to real-time changes and modeling variances.
                  </p>
                  <p>
                    MeteoSran is not an emergency alerting platform. Do not make safety-critical travel decisions, agricultural investments, or critical evacuations based solely on AI summaries. Marc Andréas Yao shall not be held liable for any loss, damage, or disruption resulting from weather inaccuracies or API data outages.
                  </p>
                </>
              )}
            </section>

            {/* ── Section 6: Premium tiers ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr'
                  ? '6. Niveaux Premium et Abonnements à Venir'
                  : '6. Future Premium Tiers and Subscription Plans'}
              </h3>
              <p>
                {lang === 'fr'
                  ? "MeteoSran est actuellement une ressource éducative publique. Pour soutenir l'hébergement des connexions WebSocket live et les coûts de l'API AccuWeather, un modèle d'abonnement premium pourrait être introduit dans une version future afin de prendre en charge des fonctionnalités avancées en temps réel. Nous nous réservons le droit de modifier les niveaux tarifaires, les exigences d'abonnement ou les conditions de paiement. Les paiements seront traités de manière sécurisée via des passerelles tierces conformes."
                  : 'MeteoSran is currently a public educational resource. To sustain live WebSocket connection hosting and AccuWeather API costs, a premium subscription model may be introduced in a forthcoming future version to support advanced real-time features. We reserve the right to modify or adjust pricing tiers, subscription requirements, or payment terms. Payment collection will be processed securely via compliant third-party gateways.'}
              </p>
            </section>

            {/* ── Section 7: Governing law ── */}
            <section className="space-y-4 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '7. Droit Applicable' : '7. Governing Law'}
              </h3>
              <p>
                {lang === 'fr'
                  ? "Les présentes Conditions d'Utilisation et toute action liée à votre usage de MeteoSran AI seront régies et interprétées conformément aux lois de la République de Côte d'Ivoire, sans égard à ses dispositions relatives aux conflits de lois."
                  : "These Terms of Service and any actions related to your usage of MeteoSran AI shall be governed by, and construed in accordance with, the laws of the Republic of Ivory Coast (Côte d'Ivoire), without regard to its conflict of law provisions."}
              </p>
            </section>

            {/* ── Section 8: Support ── */}
            <section className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-6 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '8. Questions et Assistance' : '8. Questions and Support'}
              </h3>
              <p>
                {lang === 'fr'
                  ? "Pour toute question concernant ces Conditions, ou si vous avez besoin d'une assistance technique, contactez-nous\u00A0:"
                  : 'For any questions regarding these Terms, or if you need developer support for code issues, contact us:'}
              </p>
              <div className="p-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-800/50 text-xs sm:text-sm space-y-1.5 ml-2">
                <p><strong>{lang === 'fr' ? 'Créateur' : 'Creator'}</strong>{'\u00A0'}: Marc Andréas Yao</p>
                <p><strong>Email</strong>{'\u00A0'}: <a href="mailto:marcandreas2018@gmail.com" className="text-sky-500 hover:underline">marcandreas2018@gmail.com</a></p>
                <p><strong>LinkedIn</strong>{'\u00A0'}: <a href="https://www.linkedin.com/in/marcandreasyao" target="_blank" rel="noopener noreferrer" className="text-sky-500 hover:underline">https://www.linkedin.com/in/marcandreasyao</a></p>
                <p><strong>{lang === 'fr' ? 'Téléphone' : 'Phone'}</strong>{'\u00A0'}: <a href="tel:+2250778271018" className="text-sky-500 hover:underline">+225 0778271018</a></p>
              </div>
            </section>

          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────── */}
      <footer className="w-full px-4 py-6 border-t border-slate-200/30 dark:border-slate-800/30 bg-white/10 dark:bg-[#0a1020]/20 text-center text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 MeteoSran AI. {lang === 'fr' ? 'Tous droits réservés.' : 'All rights reserved.'}</p>
          <div className="flex items-center gap-4">
            <a href="/privacy" className="hover:underline hover:text-sky-500 transition-colors">
              {lang === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
            </a>
            <a href="/terms" className="hover:underline hover:text-sky-500 transition-colors">
              {lang === 'fr' ? "Conditions d'Utilisation" : 'Terms of Service'}
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
};
