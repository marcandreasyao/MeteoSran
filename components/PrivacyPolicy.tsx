import React, { useEffect } from 'react';
import { Theme } from '../types';
import { useLanguage } from '../src/hooks/useLanguage';

interface PrivacyPolicyProps {
  theme: Theme;
  toggleTheme: (event?: React.MouseEvent) => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ theme, toggleTheme }) => {
  const [lang, toggleLang] = useLanguage();

  useEffect(() => {
    document.title = lang === 'fr'
      ? 'MeteoSran AI - Politique de Confidentialité'
      : 'MeteoSran AI - Privacy Policy';
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
                {lang === 'fr' ? 'Politique de Confidentialité' : 'Privacy Policy'}
              </h2>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
                {lang === 'fr' ? 'Dernière mise à jour\u00A0: 29 mai 2026' : 'Last Updated: May 29, 2026'}
              </p>
            </div>

            {/* ── Introduction ── */}
            <section className="space-y-4">
              {lang === 'fr' ? (
                <>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    MeteoSran AI (conçu, designé et développé par <strong>Marc Andréas Yao</strong>) est une Progressive Web App (PWA) dont une version mobile native est prévue prochainement. Nous nous engageons à protéger la vie privée de nos utilisateurs tout en fournissant des analyses météorologiques avancées et des données climatologiques à visée éducative.
                  </p>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    La présente Politique de Confidentialité décrit la manière dont nous collectons, utilisons, traitons et protégeons vos informations lorsque vous accédez à notre plateforme via{' '}
                    <a href="https://meteosran.com" className="text-sky-500 hover:underline">https://meteosran.com</a>{' '}
                    (et son sous-domaine de redirection{' '}
                    <a href="https://www.meteosran.com" className="text-sky-500 hover:underline">https://www.meteosran.com</a>{' '}
                    ou le domaine d'hébergement technique{' '}
                    <a href="https://meteosran.onrender.com" className="text-sky-500 hover:underline">https://meteosran.onrender.com</a>)
                    {' '}ou nos futurs produits mobiles natifs.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    MeteoSran AI (conceived, designed, and developed by <strong>Marc Andréas Yao</strong>) is built as a Progressive Web App (PWA) with a forthcoming native mobile version. We are committed to protecting the privacy of our users while delivering advanced weather analysis and educational climatological insights.
                  </p>
                  <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    This Privacy Policy documents how we collect, use, process, and protect your information when you access our weather assistant platform via{' '}
                    <a href="https://meteosran.com" className="text-sky-500 hover:underline">https://meteosran.com</a>{' '}
                    (along with its redirect subdomain{' '}
                    <a href="https://www.meteosran.com" className="text-sky-500 hover:underline">https://www.meteosran.com</a>{' '}
                    or the technical web service hosting at{' '}
                    <a href="https://meteosran.onrender.com" className="text-sky-500 hover:underline">https://meteosran.onrender.com</a>)
                    {' '}or use our forthcoming mobile app products.
                  </p>
                </>
              )}
            </section>

            {/* ── Section 1: Data collected ── */}
            <section className="space-y-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr'
                  ? '1. Informations collectées et traitées'
                  : '1. Information We Collect and Process'}
              </h3>

              <div className="space-y-4 ml-2 sm:ml-4">

                {/* Geolocation card */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    {lang === 'fr' ? 'Données de Géolocalisation' : 'Geolocation Data'}
                  </h4>
                  {lang === 'fr' ? (
                    <>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        Pour fournir des prévisions météorologiques hyper-locales précises et des normales climatologiques, MeteoSran nécessite une entrée de localisation. Vous pouvez choisir entre{'\u00A0'}:
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                        <li><strong>Géolocalisation automatique</strong>{'\u00A0'}: utilise les API de localisation du navigateur ou de l'appareil (GPS haute précision, données en cache pendant 5 minutes pour économiser la batterie).</li>
                        <li><strong>Localisation par IP</strong>{'\u00A0'}: mécanisme de secours permettant d'approximer les coordonnées de la ville.</li>
                        <li><strong>Localisation manuelle</strong>{'\u00A0'}: saisie de noms de villes ou de coordonnées sans accorder les permissions de localisation.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        To deliver accurate, hyper-local weather predictions and climatological norms, MeteoSran requires location input. You may choose:
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                        <li><strong>Automatic Geolocation</strong>: Uses browser or device location APIs (high-accuracy GPS or network data cached for 5 minutes to conserve battery).</li>
                        <li><strong>IP-Based Location</strong>: Fallback mechanism to approximate city coordinates.</li>
                        <li><strong>Manual Location</strong>: Manually entering city names or coordinates to query forecasts without giving device location permissions.</li>
                      </ul>
                    </>
                  )}
                </div>

                {/* Audio card */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    {lang === 'fr' ? 'Enregistrement Audio (Session Live)' : 'Audio Recording (Live Session)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'fr'
                      ? "Lors du lancement du mode Session Live à commande vocale, l'application demande les permissions d'accès au microphone. MeteoSran capture des données audio PCM brutes à 16\u00A0kHz et les transmet directement à notre API multi-modale via une connexion WebSocket sécurisée. Nous ne stockons, n'enregistrons ni n'analysons vos fichiers audio. Les flux audio existent momentanément en mémoire et sont supprimés immédiatement après la génération du contenu."
                      : "When you launch the voice-controlled Live Session mode, the app requests microphone permissions. MeteoSran captures raw 16kHz PCM audio data and streams it directly to our live multi-modal API via a secure WebSocket connection. We do not store, record, or analyze your audio files. Audio streams exist momentarily in memory and are discarded immediately after content generation."}
                  </p>
                </div>

                {/* Image uploads card */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    {lang === 'fr' ? 'Entrées Multi-Modales (Images)' : 'Multi-Modal Input (Image Uploads)'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                    {lang === 'fr'
                      ? "MeteoSran prend en charge le téléchargement d'images pour analyser les phénomènes météorologiques (types de nuages, dommages causés par les tempêtes, etc.). Ces images sont converties en encodage base64 côté client et transmises de manière sécurisée à nos modèles d'IA pour inspection visuelle. Nous ne conservons pas ces images dans notre base de données."
                      : 'MeteoSran supports image uploads to analyze weather phenomena (such as cloud types or storm damage). These images are converted to base64 encoding client-side and transmitted securely to our AI models for visual inspection. We do not persist these images on our database.'}
                  </p>
                </div>

                {/* Account storage card */}
                <div className="p-4 rounded-2xl bg-white/30 dark:bg-slate-900/40 border border-slate-200/30 dark:border-slate-800/30">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">
                    {lang === 'fr' ? 'Compte et Historique des Conversations' : 'Account and Conversation Storage'}
                  </h4>
                  {lang === 'fr' ? (
                    <>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        Pour vous permettre d'accéder à votre historique de conversations sur tous vos appareils{'\u00A0'}:
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                        <li>Nous synchronisons les données d'authentification via Firebase Authentication (adresse e-mail, hachages de mot de passe et noms d'affichage publics).</li>
                        <li>Les journaux de conversation, les titres des fils et les résumés de mémoire sont stockés de manière sécurisée dans notre base de données PostgreSQL serverless (Neon) via Prisma ORM et Firestore. Vous pouvez supprimer chaque session individuellement à tout moment depuis la barre latérale.</li>
                      </ul>
                    </>
                  ) : (
                    <>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-1.5 leading-relaxed">
                        To let you access your chat logs across devices:
                      </p>
                      <ul className="list-disc list-inside text-xs text-slate-600 dark:text-slate-400 mt-2 space-y-1">
                        <li>We sync authorization data via Firebase Authentication (email, password hashes, and public display names).</li>
                        <li>Conversation logs, thread titles, and running memory summaries are stored securely in our PostgreSQL serverless database (Neon) via Prisma ORM and Firestore. You may delete individual sessions at any time through the history sidebar.</li>
                      </ul>
                    </>
                  )}
                </div>

              </div>
            </section>

            {/* ── Section 2: Third-party integrations ── */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr'
                  ? '2. Intégrations Tierces et Flux de Données'
                  : '2. Third-Party Integrations and Data Flow'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {lang === 'fr'
                  ? "Pour générer des analyses prévisionnelles, nous transférons les requêtes vers des plateformes tierces hautement sécurisées. Aucune information personnellement identifiable (IPI) n'est jointe à ces appels externes\u00A0:"
                  : 'To generate forecast insights, we forward requests to highly secure third-party provider platforms. No personally identifiable information (PII) is attached to these external calls:'}
              </p>
              {lang === 'fr' ? (
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                  <li><strong>Modèles IA MeteoSran (via Google)</strong>{'\u00A0'}: traitement des requêtes texte, image et audio PCM. Soumis aux directives de confidentialité standard de l'API développeur Google.</li>
                  <li><strong>API AccuWeather</strong>{'\u00A0'}: retransmission des prévisions régionales locales à l'aide de coordonnées de ville anonymisées.</li>
                  <li><strong>API Open-Meteo</strong>{'\u00A0'}: interrogation des archives de données météorologiques historiques à l'aide des coordonnées de localisation.</li>
                  <li><strong>Vercel Analytics &amp; Speed Insights</strong>{'\u00A0'}: collecte de métriques Core Web Vitals anonymisées et conformes au RGPD pour améliorer les performances et prévenir les pannes.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                  <li><strong>MeteoSran AI Models (Powered by Google)</strong>: Processes text, image, and PCM voice requests. Subject to Google's standard developer API privacy guidelines.</li>
                  <li><strong>AccuWeather API</strong>: Retransmits local regional forecasts using sanitized city coordinates.</li>
                  <li><strong>Open-Meteo API</strong>: Queries historical weather archive data using location coordinates.</li>
                  <li><strong>Vercel Analytics &amp; Speed Insights</strong>: Collects anonymized, GDPR-compliant Core Web Vitals to improve performance and prevent application crashes.</li>
                </ul>
              )}
            </section>

            {/* ── Section 3: Privacy protection ── */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr'
                  ? '3. Protection des Données et Droits des Utilisateurs'
                  : '3. Privacy Protection and User Rights'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {lang === 'fr'
                  ? "Nous croyons en une transparence totale. Nous ne louons, ne vendons ni ne distribuons vos adresses e-mail, coordonnées de localisation ou historique de conversation en aucune circonstance. Vous conservez un contrôle total sur vos données\u00A0:"
                  : 'We believe in complete transparency. We do not lease, trade, sell, or distribute your email addresses, location coordinates, or chat history under any circumstances. You retain full control over your data:'}
              </p>
              {lang === 'fr' ? (
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                  <li>Vous pouvez supprimer chaque fil de conversation à tout moment depuis votre historique dans la barre latérale, ce qui le supprime de Firestore et de la base de données Neon.</li>
                  <li>Vous pouvez désactiver l'accès à la géolocalisation à tout moment dans le module Paramètres et opter pour une recherche manuelle de ville à la place.</li>
                </ul>
              ) : (
                <ul className="list-disc list-inside text-xs text-slate-700 dark:text-slate-300 space-y-2 ml-4">
                  <li>You can erase any individual chat thread at any time from your sidebar history, deleting it from Firestore and Neon databases.</li>
                  <li>You can toggle geolocation access off in the settings module at any time and choose a manual city name search instead.</li>
                </ul>
              )}
            </section>

            {/* ── Section 4: Premium tiers ── */}
            <section className="space-y-4">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr'
                  ? '4. Niveaux Premium et Abonnements à Venir'
                  : '4. Forthcoming Premium Tiers and Subscription Plans'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {lang === 'fr'
                  ? "MeteoSran est actuellement une ressource éducative publique. Pour soutenir l'hébergement des connexions WebSocket live et les coûts de l'API AccuWeather, un modèle d'abonnement premium pourrait être introduit dans une version future afin de prendre en charge des fonctionnalités avancées en temps réel. Les transactions seront gérées via des passerelles de paiement sécurisées tierces conformes PCI-DSS. Aucune donnée de carte bancaire ne transitera jamais par nos serveurs."
                  : "MeteoSran is currently a public educational resource. To sustain live WebSocket connection hosting and AccuWeather API costs, a premium subscription model may be introduced in a forthcoming future version to support advanced real-time features. Transactions will be handled via third-party, PCI-DSS compliant secure payment gateways. No card details will ever touch our servers."}
              </p>
            </section>

            {/* ── Section 5: Contact ── */}
            <section className="space-y-4 border-t border-slate-200/50 dark:border-slate-800/50 pt-6">
              <h3 className="text-lg font-bold text-slate-950 dark:text-slate-100">
                {lang === 'fr' ? '5. Nous Contacter' : '5. Contact Us'}
              </h3>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                {lang === 'fr'
                  ? "Pour toute question concernant cette Politique de Confidentialité, vos journaux de base de données, ou si vous souhaitez demander la suppression complète de votre compte, veuillez contacter le développeur\u00A0:"
                  : 'If you have any questions regarding this Privacy Policy, your database logs, or if you want to request complete account deletion, please contact the developer:'}
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
