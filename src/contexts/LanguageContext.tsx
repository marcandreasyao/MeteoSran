import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fr';

export const translations = {
  en: {
    common: {
      appName: "MeteoSran",
      error: "Error",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      close: "Close",
      loading: "Loading...",
      logout: "Log out",
      submit: "Submit",
      send: "Send",
      settings: "Settings",
      copy: "Copy",
      copied: "Copied",
      share: "Share",
    },
    login: {
      tagline: "Next-Level Climate Intelligence",
      firstName: "First Name",
      lastName: "Last Name",
      email: "Email address",
      password: "Password",
      showPassword: "Show password",
      hidePassword: "Hide password",
      passRequirements: "Please meet all password requirements.",
      minChar: "At least 8 characters",
      uppercase: "At least 1 uppercase letter",
      specialChar: "At least 1 special character (e.g., !@#$%)",
      signInBtn: "Sign In",
      createAccountBtn: "Create Account",
      authenticating: "Authenticating...",
      or: "OR",
      googleBtn: "Continue with Google",
      appleBtn: "Continue with Apple",
      hasAccount: "Already have an account? ",
      noAccount: "Don't have an account? ",
      switchSignUp: "Sign Up",
      switchSignIn: "Sign In",
      errors: {
        invalidCredential: "Incorrect email or password. Please try again.",
        userNotFound: "No account found with this email.",
        wrongPassword: "Incorrect password. Please try again.",
        emailInUse: "This email is already registered. Try logging in instead.",
        weakPassword: "Password is too weak. Please use at least 6 characters.",
        tooManyRequests: "Too many failed attempts. Please try again later.",
        popupClosed: "The sign-in window was closed. Please try again.",
        networkFailed: "Network error. Please check your connection.",
        operationNotAllowed: "This sign-in method is currently disabled.",
        default: "An unexpected error occurred. Please try again."
      }
    },
    welcome: {
      greetingMorning: "Good morning",
      greetingAfternoon: "Good afternoon",
      greetingEvening: "Good evening",
      greetingThere: "there",
      subtitle: "How can I assist you with the weather today?",
      q1: "What's the forecast for today?",
      q2: "Is it going to rain this week?",
      q3: "Explain the Coriolis effect.",
      q4: "How are clouds formed?",
      q5: "What is a supercell thunderstorm?",
      q6: "Tell me about the jet stream.",
      q7: "What's the UV index right now?",
      q8: "How does El Niño affect weather?",
      q9: "What are the different types of fog?",
      q10: "Why is the sky blue?",
      q11: "What's the wind speed and direction?",
      q12: "Are there any weather alerts for my area?",
      q13: "How is barometric pressure measured?",
      q14: "What is the dew point?",
      q15: "Explain the science behind a rainbow.",
      q16: "What are cirrus clouds?",
      q17: "How do hurricanes form?",
      q18: "Explain precipitation types.",
      q19: "Tell me about thunderstorms.",
      q20: "What causes rainbows?",
    },
    header: {
      responseStyle: "Response Style",
      preferences: "Preferences",
      tagline: "Customize your MeteoSran experience",
      notifications: "Notifications",
      notificationsDesc: "Real-time weather alerts",
      locationSource: "Location Source",
      updateType: "Update Type",
      sendTestNotification: "Send Test Notification",
      closeSettings: "Close settings",
      campaignTitle: "Release Notes & Notifications",
      campaignUnread: "What's New in 1.6.6",
      openSettings: "Open settings",
      logout: "Log out",
      exportChat: "Export Chat",
      downloadPdf: "Download as PDF",
      generatingPdf: "Generating PDF...",
      downloadTooltip: "Download chat as PDF",
      downloadDisabledTooltip: "Send a message to enable download",
      langLabel: "Interface Language",
      langDesc: "Choose your preferred language",
      locationModes: {
        auto: "Auto",
        manual: "Manual",
        ip: "IP",
        fixed: "Fixed"
      },
      updateTypes: {
        summary: "Daily Summary",
        alerts: "Severe Alerts",
        warnings: "Rain Warnings"
      },
      modes: {
        default: {
          name: "Default",
          description: "Balanced, friendly, and informative responses"
        },
        concise: {
          name: "Concise",
          description: "Brief, to-the-point explanations"
        },
        short: {
          name: "Short",
          description: "Very brief responses with essential information"
        },
        straight: {
          name: "Straight",
          description: "Direct, no-nonsense answers"
        },
        funny: {
          name: "Funny",
          description: "Humorous explanations with weather-related jokes"
        },
        einstein: {
          name: "Einstein",
          description: "Complex, detailed scientific explanations"
        }
      }
    },
    sidebar: {
      newChat: "New Chat",
      searchPlaceholder: "Search conversations...",
      deleteTitle: "Delete Conversation",
      deleteConfirm: "Are you sure you want to delete \"{title}\"? This action cannot be undone.",
      deleteBtn: "Delete Chat",
      pinChat: "Pin Chat",
      unpinChat: "Unpin Chat",
      deleteChat: "Delete Chat",
      renameChat: "Rename Chat",
      renameTitle: "Rename Conversation",
      renamePlaceholder: "Enter new title...",
      emptySessions: "No conversations found",
      pinned: "Pinned",
      recent: "Recent",
      deletePrompt: "Delete chat?",
      noMatchingChats: "No matching chats",
    },
    chat: {
      placeholder: "Ask MeteoSran anything about the weather...",
      micPermissionDenied: "Microphone permission denied",
      recordTooltip: "Record voice input",
      recordingTooltip: "Recording...",
      imageUploadTooltip: "Attach image",
      sendTooltip: "Send message",
      clearImage: "Remove image",
      speakText: "Speak response",
      stopSpeaking: "Stop speaking",
      editText: "Edit message",
      copyText: "Copy response",
      copiedText: "Copied!",
      tryAgain: "Try again",
      feedbackLiked: "Liked response",
      feedbackDisliked: "Disliked response",
      imageUploadLabel: "Image Upload",
      liveSessionLabel: "Live Session",
      languageLabel: "Language",
      invalidImageType: "Please select an image file (e.g., PNG, JPG, WEBP).",
      fileTooLarge: "File is too large. Maximum size is 4MB.",
      listening: "Listening...",
      describeImage: "Describe image...",
      stopListening: "Stop listening",
      regenerate: "Regenerate",
      prevVersion: "Previous version",
      nextVersion: "Next version",
      response: "Response",
      liveConnecting: "Connecting to Gemini 2.5 Live API...",
      liveListening: "Listening... Talk to MeteoSran.",
      liveSpeaking: "MeteoSran is speaking...",
      liveError: "Microphone or Connection Error.",
      liveEndSession: "End Session",
    },
    errors: {
      initProgress: "Initializing MeteoSran...",
      saveFailed: "Background DB save failed",
      cannotRegenerate: "Cannot regenerate: Previous message is not a valid user query.",
      loadingModels: "Loading weather models...",
      connectingServices: "Connecting to weather services...",
      initializingAI: "Initializing AI components...",
      preparingUI: "Preparing user interface...",
      ready: "MeteoSran is ready!",
      failedInit: "Failed to initialize MeteoSran. Please try refreshing the page.",
      authenticating: "Authenticating session...",
      geoNotSupported: "Geolocation is not supported by your browser.",
      geoDenied: "Location access denied. Using IP-based fallback.",
      geoUnavailable: "Location unavailable. Using IP-based fallback.",
      geoTimeout: "Location request timed out. Using IP-based fallback.",
      unknown: "An unknown error occurred.",
      resolvingCity: "Resolving \"{city}\"...",
      locationSetManual: "Location set manually to: {location}",
      locationNotFound: "Could not find location for \"{city}\". Please try again.",
      locationNetworkError: "Failed to resolve \"{city}\" due to network error.",
      enterManually: "Enter manually",
      initError: "Initialization Error",
      checkSetup: "Please check your setup or try refreshing the page.",
      promptCity: "Enter your city name (e.g., Abidjan, Yamoussoukro, Paris):",
    },
    loadingSteps: {
      auth: "Auth",
      weather: "Weather",
      connect: "Connect",
      ai: "AI",
      ui: "UI",
      ready: "Ready"
    },
    pwa: {
      success: "MeteoSran installed successfully!",
      title: "Install MeteoSran",
      iosDesc: "Tap the Share button below and select 'Add to Home Screen' for a premium weather experience!",
      androidDesc: "Get instant access to weather insights with our PWA. Works offline and feels like a native app!",
      install: "Install",
      later: "Later",
      shareGuide: "Share > Add to Home Screen"
    },
    releaseNotes: {
      title: "What's New in 1.6.6",
      subtitle: "Premium Aesthetic & Stability Upgrade",
      close: "Close",
      gotIt: "Got it, thanks!",
      features: {
        memoryTitle: "Contextual Memory Intelligence",
        memoryDesc: "MeteoSran now remembers your preferences, topics, and past conversations seamlessly across sessions for true long-term AI recall.",
        themeTitle: "Deep Theme Switch Transition",
        themeDesc: "Experience a smooth circular wipe transition (utilizing the View Transitions API) combined with MagicUI-inspired animated toggling icons, replacing noisy instant switches.",
        mobileTitle: "Mobile & Translation Optimizations",
        mobileDesc: "Perfected mobile display with Visual Viewport adaptation to prevent virtual keyboard layout deformation, and blocked browser translators from translating interface icons.",
        locationTitle: "Manual Location Intelligence",
        locationDesc: "Enhanced location awareness allows the AI to smartly default to manually specified or previously discussed regions automatically.",
        datetimeTitle: "System Datetime Crash Resolved",
        datetimeDesc: "Fixed a critical issue causing instability related to system datetime context injection. Everything is rock-solid now.",
        archTitle: "Robust Core Architecture",
        archDesc: "Completely fixed chat history persistence & syncing. Resolved \"Down Spin\" server issues for lightning-fast, reliable AI responses.",
        liquidTitle: "Liquid Aura Streaming",
        liquidDesc: "A completely new fluid text generation effect. Watch the AI write with a stable, glowing trailing cursor instead of jumpy text blocks.",
        codeTitle: "Aurora Glass Code Blocks",
        codeDesc: "Mac-style traffic light headers and glassmorphic copy controls transform technical answers into premium developer tools.",
        sidebarTitle: "Minimalist Slate Sidebar",
        sidebarDesc: "Experience a typography-driven history, animated hover glides, glowing active blue dot indicators, and a sleek bottom-line search.",
        bilingualTitle: "Full Bilingual Support",
        bilingualDesc: "Experience MeteoSran completely localized. Seamlessly switch between English and French interfaces with full dynamic translation across all components.",
        downloadTitle: "Navigation Space Optimization",
        downloadDesc: "Moved the 'Download Chat' PDF button into Settings, cleaning up the navigation bar and keeping settings fully visible on mobile.",
        loginTitle: "Liquid Glass Login",
        loginDesc: "Overhauled the authentication screen with premium liquid glassmorphism background effects and animated, glowing input containers.",
        iconGuardTitle: "Translation Guard for Icons",
        iconGuardDesc: "Applied a specialized system translation bypass to all UI icons, preventing browsers (Chrome/Safari) from translating and breaking them."
      }
    }
  },
  fr: {
    common: {
      appName: "MeteoSran",
      error: "Erreur",
      cancel: "Annuler",
      save: "Enregistrer",
      delete: "Supprimer",
      close: "Fermer",
      loading: "Chargement...",
      logout: "Se déconnecter",
      submit: "Envoyer",
      send: "Envoyer",
      settings: "Paramètres",
      copy: "Copier",
      copied: "Copié",
      share: "Partager",
    },
    login: {
      tagline: "Météo-Intelligence Avancée de Nouvelle Génération",
      firstName: "Prénom",
      lastName: "Nom",
      email: "Adresse e-mail",
      password: "Mot de passe",
      showPassword: "Afficher le mot de passe",
      hidePassword: "Masquer le mot de passe",
      passRequirements: "Respecte toutes les exigences de mot de passe.",
      minChar: "Au moins 8 caractères",
      uppercase: "Au moins 1 lettre majuscule",
      specialChar: "Au moins 1 caractère spécial (ex., !@#$%)",
      signInBtn: "Se connecter",
      createAccountBtn: "Créer un compte",
      authenticating: "Authentification...",
      or: "OU",
      googleBtn: "Continuer avec Google",
      appleBtn: "Continuer avec Apple",
      hasAccount: "Tu as déjà un compte ? ",
      noAccount: "Tu n'as pas de compte ? ",
      switchSignUp: "S'inscrire",
      switchSignIn: "Se connecter",
      errors: {
        invalidCredential: "E-mail ou mot de passe incorrect. Essaie encore.",
        userNotFound: "Aucun compte trouvé avec cet e-mail.",
        wrongPassword: "Mot de passe incorrect. Essaie encore.",
        emailInUse: "Cet e-mail est déjà enregistré. Essaie plutôt de te connecter.",
        weakPassword: "Le mot de passe est trop faible. Utilise au moins 6 caractères.",
        tooManyRequests: "Trop de tentatives échouées. Réessaie plus tard.",
        popupClosed: "La fenêtre de connexion a été fermée. Réessaie.",
        networkFailed: "Erreur réseau. Vérifie ta connexion.",
        operationNotAllowed: "Cette méthode de connexion est actuellement désactivée.",
        default: "Une erreur inattendue est survenue. Réessaie."
      }
    },
    welcome: {
      greetingMorning: "Bonjour",
      greetingAfternoon: "Bon après-midi",
      greetingEvening: "Bonsoir",
      greetingThere: "toi",
      subtitle: "Comment puis-je t'aider avec la météo aujourd'hui ?",
      q1: "Quel est le bulletin météo pour aujourd'hui ?",
      q2: "Va-t-il pleuvoir cette semaine ?",
      q3: "Explique l'effet Coriolis.",
      q4: "Comment se forment les nuages ?",
      q5: "Qu'est-ce qu'un orage supercellulaire ?",
      q6: "Parle-moi du courant-jet.",
      q7: "Quel est l'indice UV en ce moment ?",
      q8: "Comment El Niño affecte-t-il le climat ?",
      q9: "Quels sont les différents types de brouillard ?",
      q10: "Pourquoi le ciel est-il bleu ?",
      q11: "Quels sont la vitesse et le sens du vent ?",
      q12: "Y a-t-il des alertes météo dans ma région ?",
      q13: "Comment mesure-t-on la pression barométrique ?",
      q14: "Qu'est-ce que le point de rosée ?",
      q15: "Explique la science derrière un arc-en-ciel.",
      q16: "Que sont les cirrus ?",
      q17: "Comment se forment les ouragans ?",
      q18: "Explique les types de précipitations.",
      q19: "Parle-moi des orages.",
      q20: "Qu'est-ce qui cause les arcs-en-ciel ?",
    },
    header: {
      responseStyle: "Style de réponse",
      preferences: "Préférences",
      tagline: "Personnalise ton expérience MeteoSran",
      notifications: "Notifications",
      notificationsDesc: "Alertes météo en temps réel",
      locationSource: "Source de localisation",
      updateType: "Type de mise à jour",
      sendTestNotification: "Envoyer une notification test",
      closeSettings: "Fermer les paramètres",
      campaignTitle: "Notes de version & Notifications",
      campaignUnread: "Nouveautés de la version 1.6.6",
      openSettings: "Ouvrir les paramètres",
      logout: "Se déconnecter",
      exportChat: "Exporter la discussion",
      downloadPdf: "Télécharger en PDF",
      generatingPdf: "Génération du PDF...",
      downloadTooltip: "Télécharger la discussion au format PDF",
      downloadDisabledTooltip: "Envoyez un message pour activer le téléchargement",
      langLabel: "Langue de l'interface",
      langDesc: "Choisis ta langue préférée",
      locationModes: {
        auto: "Auto",
        manual: "Manuel",
        ip: "IP",
        fixed: "Fixe"
      },
      updateTypes: {
        summary: "Résumé quotidien",
        alerts: "Alertes critiques",
        warnings: "Alertes pluie"
      },
      modes: {
        default: {
          name: "Par défaut",
          description: "Réponses équilibrées, amicales et informatives"
        },
        concise: {
          name: "Concise",
          description: "Explications brèves et précises"
        },
        short: {
          name: "Court",
          description: "Réponses très courtes avec les informations essentielles"
        },
        straight: {
          name: "Direct",
          description: "Réponses directes et sans fioritures"
        },
        funny: {
          name: "Drôle",
          description: "Explications humoristiques avec des blagues sur la météo"
        },
        einstein: {
          name: "Einstein",
          description: "Explications scientifiques complexes et détaillées"
        }
      }
    },
    sidebar: {
      newChat: "Nouvelle discussion",
      searchPlaceholder: "Rechercher des Chats...",
      deleteTitle: "Supprimer la conversation",
      deleteConfirm: "Es-tu sûr de vouloir supprimer \"{title}\" ? Cette action est irréversible.",
      deleteBtn: "Supprimer la discussion",
      pinChat: "Épingler",
      unpinChat: "Désépingler",
      deleteChat: "Supprimer la discussion",
      renameChat: "Renommer la discussion",
      renameTitle: "Renommer la conversation",
      renamePlaceholder: "Entrer le nouveau titre...",
      emptySessions: "Aucune conversation trouvée",
      pinned: "Épinglées",
      recent: "Récents",
      deletePrompt: "Supprimer la discussion ?",
      noMatchingChats: "Aucune discussion correspondante",
    },
    chat: {
      placeholder: "Demande à MeteoSran",
      micPermissionDenied: "Permission de microphone refusée",
      recordTooltip: "Enregistrer une entrée vocale",
      recordingTooltip: "Enregistrement...",
      imageUploadTooltip: "Joindre une image",
      sendTooltip: "Envoyer le message",
      clearImage: "Supprimer l'image",
      speakText: "Écouter la réponse",
      stopSpeaking: "Arrêter la lecture",
      editText: "Modifier le message",
      copyText: "Copier la réponse",
      copiedText: "Copié !",
      tryAgain: "Réessayer",
      feedbackLiked: "Réponse aimée",
      feedbackDisliked: "Réponse non aimée",
      imageUploadLabel: "Téléverser une image",
      liveSessionLabel: "Session en direct",
      languageLabel: "Langue",
      invalidImageType: "Sélectionne un fichier image (ex. PNG, JPG, WEBP).",
      fileTooLarge: "Le fichier est trop volumineux. La taille maximale est de 4 Mo.",
      listening: "Écoute...",
      describeImage: "Décris l'image...",
      stopListening: "Arrêter l'écoute",
      regenerate: "Régénérer",
      prevVersion: "Version précédente",
      nextVersion: "Version suivante",
      response: "Réponse",
      liveConnecting: "Connexion à l'API en direct Gemini 2.5...",
      liveListening: "Écoute en cours... Parle à MeteoSran.",
      liveSpeaking: "MeteoSran parle...",
      liveError: "Erreur de microphone ou de connexion.",
      liveEndSession: "Terminer la session",
    },
    errors: {
      initProgress: "Initialisation de MeteoSran...",
      saveFailed: "Échec de l'enregistrement de la base de données en arrière-plan",
      cannotRegenerate: "Impossible de régénérer : le message précédent n'est pas une requête utilisateur valide.",
      loadingModels: "Chargement des modèles météo...",
      connectingServices: "Connexion aux services météo...",
      initializingAI: "Initialisation des composants IA...",
      preparingUI: "Préparation de l'interface utilisateur...",
      ready: "MeteoSran est prêt !",
      failedInit: "Échec de l'initialisation de MeteoSran. Actualise la page.",
      authenticating: "Authentification de la session en cours...",
      geoNotSupported: "La géolocalisation n'est pas prise en charge par ton navigateur.",
      geoDenied: "Accès à la localisation refusé. Utilisation de la localisation par IP.",
      geoUnavailable: "Localisation indisponible. Utilisation de la localisation par IP.",
      geoTimeout: "La demande de localisation a expiré. Utilisation de la localisation par IP.",
      unknown: "Une erreur inconnue est survenue.",
      resolvingCity: "Résolution de \"{city}\"...",
      locationSetManual: "Position définie manuellement sur : {location}",
      locationNotFound: "Impossible de trouver l'emplacement pour \"{city}\". Réessaie.",
      locationNetworkError: "Échec de la résolution de \"{city}\" en raison d'une erreur réseau.",
      enterManually: "Saisir manuellement",
      initError: "Erreur d'initialisation",
      checkSetup: "Vérifie ta configuration ou essaie d'actualiser la page.",
      promptCity: "Entrez le nom de votre ville (ex. Abidjan, Yamoussoukro, Paris) :",
    },
    loadingSteps: {
      auth: "Auth",
      weather: "Météo",
      connect: "Réseau",
      ai: "IA",
      ui: "Interface",
      ready: "Prêt"
    },
    pwa: {
      success: "MeteoSran installé avec succès !",
      title: "Installer MeteoSran",
      iosDesc: "Appuie sur le bouton Partager ci-dessous et sélectionne 'Sur l'écran d'accueil' pour une expérience météo premium !",
      androidDesc: "Accédez instantanément à nos analyses météo grâce à notre PWA. Fonctionne hors ligne et ressemble à une appli native !",
      install: "Installer",
      later: "Plus tard",
      shareGuide: "Partager &gt; Sur l'écran d'accueil"
    },
    releaseNotes: {
      title: "Nouveautés de MeteoSran 1.6.6",
      subtitle: "Version corrective de stabilité & d'esthétique",
      close: "Fermer",
      gotIt: "Compris, merci !",
      features: {
        memoryTitle: "Mémoire Contextuelle Intelligente",
        memoryDesc: "MeteoSran mémorise désormais tes préférences, tes sujets et tes conversations passées de manière transparente entre les sessions pour un véritable rappel de l'IA à long terme.",
        themeTitle: "Transition de thème fluide",
        themeDesc: "Fais l'expérience d'une transition fluide par balayage circulaire (via l'API View Transitions) combinée à des icônes animées inspirées de MagicUI, remplaçant les changements brusques.",
        mobileTitle: "Optimisations mobiles & Traduction",
        mobileDesc: "Affichage mobile perfectionné avec adaptation du Visual Viewport pour éviter les déformations du clavier virtuel, et blocage des traducteurs de navigateur sur les icônes d'interface.",
        locationTitle: "Intelligence de Localisation Manuelle",
        locationDesc: "La détection de localisation améliorée permet à l'IA de cibler intelligemment et automatiquement les régions spécifiées manuellement ou précédemment discutées.",
        datetimeTitle: "Crash Datetime Système Résolu",
        datetimeDesc: "Correction d'un problème critique causant de l'instabilité liée à l'injection du contexte datetime système. Tout est désormais parfaitement stable.",
        archTitle: "Architecture Core Robuste",
        archDesc: "Correction complète de la persistance et de la synchronisation de l'historique des discussions. Problèmes de serveur résolus pour des réponses de l'IA ultra-rapides et fiables.",
        liquidTitle: "Effet d'Écriture Fluide (Liquid Aura)",
        liquidDesc: "Un tout nouvel effet de génération de texte fluide. Regarde l'IA écrire avec un curseur lumineux et stable au lieu de blocs de texte saccadés.",
        codeTitle: "Blocs de Code Aurora Glass",
        codeDesc: "Des en-têtes de style Mac (boutons de fenêtre) et des contrôles de copie glassmorphes transforment les réponses techniques en véritables outils de développement premium.",
        sidebarTitle: "Barre Latérale Épurée",
        sidebarDesc: "Découvre un historique axé sur la typographie, des animations de survol fluides, un indicateur d'activité bleu lumineux et une barre de recherche discrète.",
        bilingualTitle: "Support Bilingue Complet",
        bilingualDesc: "Vis l'expérience MeteoSran entièrement localisée. Bascule de manière fluide entre les interfaces anglaise et française avec une traduction dynamique complète sur tous les composants.",
        downloadTitle: "Optimisation de l'espace navbar",
        downloadDesc: "Déplacement du bouton PDF 'Télécharger le chat' dans tes paramètres pour épurer la barre de navigation, garantissant la visibilité totale de la configuration sur mobile.",
        loginTitle: "Portail Liquid Glass",
        loginDesc: "Découvre la refonte de ton écran de connexion avec des effets d'arrière-plan en morphisme de verre liquide premium et des conteneurs de saisie animés et lumineux.",
        iconGuardTitle: "Protection des icônes d'interface",
        iconGuardDesc: "Application d'un blocage de traduction système sur toutes tes icônes interactives pour empêcher les traducteurs automatiques de déformer la mise en page."
      }
    }
  }
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, variables?: Record<string, string>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    if (saved === 'en' || saved === 'fr') return saved as Language;
    // Auto-detect browser language
    const browserLang = navigator.language.split('-')[0];
    return browserLang === 'fr' ? 'fr' : 'en';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  };

  const t = (keyPath: string, variables?: Record<string, string>): string => {
    const keys = keyPath.split('.');
    let translationObj: any = translations[language];

    for (const key of keys) {
      if (translationObj && typeof translationObj === 'object') {
        translationObj = translationObj[key];
      } else {
        translationObj = undefined;
        break;
      }
    }

    if (typeof translationObj !== 'string') {
      // Fallback to English
      let englishObj: any = translations['en'];
      for (const key of keys) {
        if (englishObj && typeof englishObj === 'object') {
          englishObj = englishObj[key];
        } else {
          englishObj = undefined;
          break;
        }
      }
      translationObj = typeof englishObj === 'string' ? englishObj : keyPath;
    }

    if (variables && typeof translationObj === 'string') {
      let result = translationObj;
      Object.entries(variables).forEach(([name, value]) => {
        result = result.replace(new RegExp(`\\{${name}\\}`, 'g'), value);
      });
      return result;
    }

    return translationObj;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
