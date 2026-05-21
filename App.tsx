import React, { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { Message, MessageRole, ResponseMode } from './types';
import { initChatService, sendMessageToAI, generateSmartTitle } from './services/geminiService';
import { maybeUpdateMemory } from './services/memoryService';
import { ErrorMessage } from './components/ErrorMessage';
import { Footer } from './components/Footer';
import { LoadingProgress } from './components/LoadingProgress';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import WeatherWidget from './src/components/WeatherWidget';
import { useGeolocation } from './src/hooks/useGeolocation';
import { useTouchDevice } from './src/hooks/useTouchDevice';
import { useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { saveMessageToDB, fetchUserMessages, fetchChatSessions, createChatSession, ChatSession, renameChatSession, deleteChatSession, pinChatSession } from './src/services/dbService';
import { Sidebar } from './components/Sidebar';
import { LiveSessionOverlay } from './components/LiveSessionOverlay';
import { ReleaseNotesModal } from './components/ReleaseNotesModal';
export type Theme = 'light' | 'dark';

export interface CurrentInputState {
  text: string;
  imageFile: File | null;
}

const readFileAsBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = error => reject(error);
    reader.readAsDataURL(file);
  });
};

const App: React.FC = () => {
  const isTouch = useTouchDevice();

  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') return savedTheme as Theme;
    // Fallback to system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    return 'light';
  });

  const [showGlassFade, setShowGlassFade] = useState(false);
  const [showWeatherWidget, setShowWeatherWidget] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [initMessage, setInitMessage] = useState("Initializing MeteoSran...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingActiveChat, setIsFetchingActiveChat] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ResponseMode>(ResponseMode.CONCISE);
  const [currentInput, setCurrentInput] = useState<CurrentInputState>({ text: '', imageFile: null });
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const [locationMode, setLocationMode] = useState<'auto' | 'manual' | 'ip' | 'fixed'>(() => {
    const stored = localStorage.getItem('locationMode');
    if (stored === 'manual' || stored === 'ip' || stored === 'fixed') return stored;
    return 'auto';
  });

  useEffect(() => {
    localStorage.setItem('locationMode', locationMode);
  }, [locationMode]);
  const { user, loading: authLoading } = useAuth();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Release Notes State
  const CURRENT_VERSION = '1.6.6';
  const [showReleaseNotes, setShowReleaseNotes] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  useEffect(() => {
    if (!window.visualViewport) return;

    const handleResize = () => {
      const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
      document.documentElement.style.setProperty('--visual-viewport-height', `${height}px`);

      // Detect if keyboard is open (height is substantially less than window.innerHeight)
      const isOpen = height < window.innerHeight * 0.85;
      setIsKeyboardOpen(isOpen);
    };

    window.visualViewport.addEventListener('resize', handleResize);
    window.visualViewport.addEventListener('scroll', handleResize);

    // Initial run
    handleResize();

    return () => {
      window.visualViewport?.removeEventListener('resize', handleResize);
      window.visualViewport?.removeEventListener('scroll', handleResize);
    };
  }, []);

  useEffect(() => {
    const seenVersion = localStorage.getItem('meteosran_version_seen');
    if (seenVersion !== CURRENT_VERSION) {
      setHasUnreadNotifications(true);
      // Optional: Auto-show on first load. Delay slightly for smoother entrance.
      const timer = setTimeout(() => {
        setShowReleaseNotes(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCloseReleaseNotes = () => {
    setShowReleaseNotes(false);
    setHasUnreadNotifications(false);
    localStorage.setItem('meteosran_version_seen', CURRENT_VERSION);
  };

  // Fetch messages when user logs in
  useEffect(() => {
    if (user && isInitialized) {
      fetchChatSessions(user.uid).then(async sessions => {
        setChatSessions(sessions);
        if (sessions.length > 0) {
          const latestChat = sessions[0];
          setActiveChatId(latestChat.id);
          const history = await fetchUserMessages(user.uid, latestChat.id);
          setMessages(history.length > 0 ? history : []);
        } else {
          // No chats exist at all. Don't create one yet until the user sends a message.
          setActiveChatId(null);
          setMessages([]);
        }
      }).catch(err => {
        console.error("Failed to load chat sessions:", err);
      });
    }
  }, [user, isInitialized]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Automatic System Theme Adaptation
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleSystemThemeChange = (e: MediaQueryListEvent | MediaQueryList) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };

    // Initial check and listener registration
    // Using try-catch or checking for addEventListener support for older browsers/Android versions
    try {
      mediaQuery.addEventListener('change', handleSystemThemeChange);
    } catch (err) {
      // Fallback for older Safari/mobile browsers
      mediaQuery.addListener(handleSystemThemeChange);
    }

    return () => {
      try {
        mediaQuery.removeEventListener('change', handleSystemThemeChange);
      } catch (err) {
        mediaQuery.removeListener(handleSystemThemeChange);
      }
    };
  }, []);

  useEffect(() => {
    if (isTouch) {
      document.body.classList.add('touch-device');
    } else {
      document.body.classList.remove('touch-device');
    }
  }, [isTouch]);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        // Simulate initialization steps
        setInitMessage("Loading weather models...");
        setInitProgress(20);
        await new Promise(resolve => setTimeout(resolve, 500));

        setInitMessage("Connecting to weather services...");
        setInitProgress(40);
        await new Promise(resolve => setTimeout(resolve, 500));

        setInitMessage("Initializing AI components...");
        setInitProgress(60);
        const initResult = await initChatService();

        if (initResult) {
          throw new Error(`Failed to initialize chat service: ${initResult}`);
        }

        setInitMessage("Preparing user interface...");
        setInitProgress(80);
        await new Promise(resolve => setTimeout(resolve, 500));

        setInitMessage("MeteoSran is ready!");
        setInitProgress(100);
        await new Promise(resolve => setTimeout(resolve, 500));

        setIsInitialized(true);
      } catch (error) {
        console.error("Initialization error:", error);
        setError("Failed to initialize MeteoSran. Please try refreshing the page.");
      }
    };

    initializeChat();
  }, []);

  // Advanced Geolocation hook handling Android best practices
  const { location: geoLoc, error: geoErr } = useGeolocation(locationMode === 'auto');

  useEffect(() => {
    if (locationMode === 'auto') {
      if (geoLoc) {
        setUserLocation({ lat: geoLoc.lat, lon: geoLoc.lon });
        setLocationError(null);
        setLocationPrompt(false);
      }
      if (geoErr) {
        setLocationError(geoErr);
        setLocationPrompt(true);
      }
    }
  }, [geoLoc, geoErr, locationMode]);

  const handleManualLocation = async () => {
    const cityName = prompt('Enter your city name (e.g., Abidjan, Yamoussoukro, Paris):');
    if (!cityName || cityName.trim() === '') return;

    setIsLoading(true);
    setLocationError(`Resolving "${cityName}"...`);
    try {
      // 1. Check local dictionary first for quick matches (helps with Ivory Coast regions)
      const localDictionary: Record<string, { lat: number; lon: number; name: string }> = {
        'abidjan': { lat: 5.30966, lon: -4.01266, name: 'Abidjan' },
        'yamoussoukro': { lat: 6.81881, lon: -5.27674, name: 'Yamoussoukro' },
        'bouaké': { lat: 7.69385, lon: -5.03079, name: 'Bouaké' },
        'bouake': { lat: 7.69385, lon: -5.03079, name: 'Bouaké' },
        'san pédro': { lat: 4.74851, lon: -6.6363, name: 'San Pédro' },
        'san pedro': { lat: 4.74851, lon: -6.6363, name: 'San Pédro' },
        'korhogo': { lat: 9.45803, lon: -5.62961, name: 'Korhogo' },
        'man': { lat: 7.41251, lon: -7.55383, name: 'Man' },
        'daloa': { lat: 6.87735, lon: -6.45022, name: 'Daloa' },
        'gagnoa': { lat: 6.13193, lon: -5.9506, name: 'Gagnoa' },
        'grand-bassam': { lat: 5.2118, lon: -3.7388, name: 'Grand-Bassam' },
        'grand bassam': { lat: 5.2118, lon: -3.7388, name: 'Grand-Bassam' },
        'assinie': { lat: 5.1584, lon: -3.2929, name: 'Assinie' },
        'odienné': { lat: 9.5051, lon: -7.5643, name: 'Odienné' },
        'odienne': { lat: 9.5051, lon: -7.5643, name: 'Odienné' },
        'ferkessédougou': { lat: 9.5928, lon: -5.1983, name: 'Ferkessédougou' },
        'ferkessedougou': { lat: 9.5928, lon: -5.1983, name: 'Ferkessédougou' }
      };

      const normalized = cityName.trim().toLowerCase();
      if (localDictionary[normalized]) {
        const entry = localDictionary[normalized];
        setUserLocation({ lat: entry.lat, lon: entry.lon });
        setLocationError(`Location set manually to: ${entry.name}`);
        setLocationPrompt(true);
        return;
      }

      // 2. Query free Open-Meteo Geocoding API (no keys needed, works in browser context)
      const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`);
      if (response.ok) {
        const data = await response.json();
        if (data.results && data.results.length > 0) {
          const firstResult = data.results[0];
          setUserLocation({
            lat: firstResult.latitude,
            lon: firstResult.longitude
          });
          const adminStr = firstResult.admin1 ? `, ${firstResult.admin1}` : '';
          const countryStr = firstResult.country ? `, ${firstResult.country}` : '';
          setLocationError(`Location set manually to: ${firstResult.name}${adminStr}${countryStr}`);
          setLocationPrompt(true);
          return;
        }
      }
      
      // 3. Fallback: Parse if they typed comma separated numbers directly (e.g. 5.34,-4.03)
      const parts = cityName.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          setUserLocation({ lat, lon });
          setLocationError(`Location set manually to: ${lat.toFixed(2)}, ${lon.toFixed(2)}`);
          setLocationPrompt(true);
          return;
        }
      }

      setLocationError(`Could not find location for "${cityName}". Please try again.`);
      setLocationPrompt(true);
    } catch (error) {
      console.error('Geocoding error:', error);
      setLocationError(`Failed to resolve "${cityName}" due to network error.`);
      setLocationPrompt(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (locationMode === 'ip' || locationMode === 'fixed') {
      setUserLocation(null);
      setLocationError(null);
      setLocationPrompt(false);
    } else if (locationMode === 'manual' && !userLocation) {
      handleManualLocation();
    }
  }, [locationMode]);

  const handleSelectChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    if (user) {
      setMessages([]);
      setIsFetchingActiveChat(true);
      try {
        const history = await fetchUserMessages(user.uid, chatId);
        setMessages(history.length > 0 ? history : []);
      } catch (err) {
        console.error("Failed to load chat history", err);
      } finally {
        setIsFetchingActiveChat(false);
      }
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    setIsLoading(false);
    setIsFetchingActiveChat(false);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const handleRenameChat = async (chatId: string, newTitle: string) => {
    if (!user) return;
    try {
      const success = await renameChatSession(user.uid, chatId, newTitle);
      if (success) {
        setChatSessions(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
      }
    } catch (err) {
      console.error("Failed to rename chat session:", err);
    }
  };

  const handleDeleteChat = async (chatId: string) => {
    if (!user) return;
    try {
      const success = await deleteChatSession(user.uid, chatId);
      if (success) {
        setChatSessions(prev => prev.filter(c => c.id !== chatId));
        if (activeChatId === chatId) {
          const remainingChats = chatSessions.filter(c => c.id !== chatId);
          if (remainingChats.length > 0) {
            handleSelectChat(remainingChats[0].id);
          } else {
            handleNewChat();
          }
        }
      }
    } catch (err) {
      console.error("Failed to delete chat session:", err);
    }
  };

  const handlePinChat = async (chatId: string, isPinned: boolean) => {
    if (!user) return;
    try {
      const success = await pinChatSession(user.uid, chatId, isPinned);
      if (success) {
        setChatSessions(prev => prev.map(c => c.id === chatId ? { ...c, isPinned } : c));
      }
    } catch (err) {
      console.error("Failed to pin chat session:", err);
    }
  };

  const triggerGlassFade = () => {
    setShowGlassFade(true);
    setTimeout(() => setShowGlassFade(false), 900);
  };

  const toggleTheme = (event?: React.MouseEvent) => {
    track('theme_toggle', {
      from: theme,
      to: theme === 'light' ? 'dark' : 'light'
    });

    const nextTheme = theme === 'light' ? 'dark' : 'light';

    // Support standard View Transitions API (Chrome 111+, Safari 18+, Edge)
    const isTransitionSupported = 
      typeof document !== 'undefined' && 
      'startViewTransition' in document &&
      window.matchMedia('(prefers-reduced-motion: no-preference)').matches;

    if (!isTransitionSupported || !event) {
      // Fallback transition
      triggerGlassFade();
      setTimeout(() => {
        setTheme(nextTheme);
      }, 450);
      return;
    }

    const x = event.clientX;
    const y = event.clientY;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = (document as any).startViewTransition(() => {
      setTheme(nextTheme);
    });

    transition.ready.then(() => {
      const clipPath = [
        `circle(0px at ${x}px ${y}px)`,
        `circle(${endRadius}px at ${x}px ${y}px)`,
      ];
      document.documentElement.animate(
        {
          clipPath: clipPath,
        },
        {
          duration: 450,
          easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
          pseudoElement: '::view-transition-new(root)',
        }
      );
    });
  };

  const handleSendMessage = async (text: string, imageFile?: File | null) => {
    if (!text.trim() && !imageFile) return;

    // Reset prompt immediately
    setCurrentInput({ text: '', imageFile: null });
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }

    track('message_sent', {
      hasText: !!text.trim(),
      hasImage: !!imageFile,
      mode: selectedMode,
      messageLength: text.length
    });

    const isWeatherQueryForCI = text.toLowerCase().includes('weather') &&
      (text.toLowerCase().includes('ivory coast') || text.toLowerCase().includes('abidjan'));

    if (isWeatherQueryForCI) {
      track('weather_widget_shown', { query: 'ivory_coast_weather' });
    }

    setShowWeatherWidget(isWeatherQueryForCI);

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: MessageRole.USER,
      text: text.trim(),
      timestamp: new Date(),
      ...(imageFile && {
        image: {
          data: await readFileAsBase64(imageFile),
          mimeType: imageFile.type,
          name: imageFile.name
        }
      })
    };

    // FIX 1: Create a definitive, synchronous array of the history PLUS the new message
    const currentConversation = [...messages, userMessage];

    // Update the UI using that exact array
    setMessages(currentConversation);
    setIsLoading(true);
    setError(null);

    try {
      // Send that exact array to the API. No stale state!
      const currentChat = chatSessions.find(c => c.id === activeChatId);
      const memorySummary = currentChat?.memorySummary || null;
      const response = await sendMessageToAI(
        currentConversation,
        selectedMode,
        user?.displayName || null,
        memorySummary,
        userLocation?.lat || null,
        userLocation?.lon || null
      );
      setMessages(prev => [...prev, response]);

      let finalChatId = activeChatId;

      (async () => {
        if (!finalChatId && user) {
          const promptText = userMessage.text;
          const newTitle = await generateSmartTitle(promptText);
          finalChatId = await createChatSession(user.uid, newTitle);

          if (finalChatId) {
            setActiveChatId(finalChatId);
            setChatSessions(prev => [{ id: finalChatId!, title: newTitle, createdAt: new Date(), updatedAt: new Date() }, ...prev]);
          }
        }

        if (user && finalChatId) {
          await saveMessageToDB(user.uid, finalChatId, userMessage);
          await saveMessageToDB(user.uid, finalChatId, response);

          // ── Long-term memory: background summarizer ──────────────
          const allMessages = [...currentConversation, response];
          const currentSummary = chatSessions.find(c => c.id === finalChatId)?.memorySummary || null;
          maybeUpdateMemory(
            allMessages,
            currentSummary,
            finalChatId,
            user.uid,
            (chatId, newSummary) => {
              setChatSessions(prev =>
                prev.map(c => c.id === chatId ? { ...c, memorySummary: newSummary } : c)
              );
            }
          );
        }
      })().catch(err => console.error("Background DB save failed:", err));

    } catch (err) {
      console.error('Error sending message:', err);
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
      setCurrentInput({ text: '', imageFile: null });
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleRegenerate = async (messageId: string) => {
    const msgIndex = messages.findIndex(m => m.id === messageId);
    if (msgIndex === -1) return;
    const msg = messages[msgIndex];
    if (msg.role !== MessageRole.MODEL) return;

    // FIX 2: The history needed to regenerate this AI response is everything up to, 
    // AND INCLUDING, the User message immediately preceding it.
    const historyToResend = messages.slice(0, msgIndex);

    // Safety check: Ensure the last message in the resend history is actually from the user.
    if (historyToResend.length === 0 || historyToResend[historyToResend.length - 1].role !== MessageRole.USER) {
      setError("Cannot regenerate: Previous message is not a valid user query.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const currentChat = chatSessions.find(c => c.id === activeChatId);
      const memorySummary = currentChat?.memorySummary || null;
      const response = await sendMessageToAI(
        historyToResend,
        selectedMode,
        user?.displayName || null,
        memorySummary,
        userLocation?.lat || null,
        userLocation?.lon || null
      );

      setMessages(prev => {
        const newMessages = [...prev];
        const targetMsg = { ...newMessages[msgIndex] };

        const alts = targetMsg.alternatives ? [...targetMsg.alternatives] : [targetMsg.text];
        alts.push(response.text);

        targetMsg.alternatives = alts;
        targetMsg.currentAlternativeIndex = alts.length - 1;
        targetMsg.text = response.text;

        newMessages[msgIndex] = targetMsg;

        if (user && activeChatId) {
          saveMessageToDB(user.uid, activeChatId, targetMsg);
        }

        return newMessages;
      });
    } catch (err) {
      console.error('Error regenerating message:', err);
      setError(err instanceof Error ? err.message : 'Failed to regenerate message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchAlternative = (messageId: string, direction: 'prev' | 'next') => {
    setMessages(prev => {
      const msgIndex = prev.findIndex(m => m.id === messageId);
      if (msgIndex === -1) return prev;

      const newMessages = [...prev];
      const targetMsg = { ...newMessages[msgIndex] };
      const alts = targetMsg.alternatives;

      if (!alts || alts.length <= 1) return prev;

      let currIdx = targetMsg.currentAlternativeIndex || 0;
      if (direction === 'prev' && currIdx > 0) {
        currIdx--;
      } else if (direction === 'next' && currIdx < alts.length - 1) {
        currIdx++;
      }

      targetMsg.currentAlternativeIndex = currIdx;
      targetMsg.text = alts[currIdx];
      newMessages[msgIndex] = targetMsg;

      if (user && activeChatId) {
        saveMessageToDB(user.uid, activeChatId, targetMsg);
      }

      return newMessages;
    });
  };

  const handleSampleQuestion = (question: string) => {
    track('sample_question_clicked', {
      question: question.substring(0, 50),
      questionLength: question.length
    });

    setCurrentInput({ text: question, imageFile: null });
    setTimeout(() => {
      handleSendMessage(question);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  const handleModeChange = (mode: ResponseMode) => {
    track('response_mode_changed', {
      from: selectedMode,
      to: mode
    });
    setSelectedMode(mode);
  };

  if (authLoading || !isInitialized) {
    return <LoadingProgress progress={initProgress} message={authLoading ? "Authenticating session..." : initMessage} />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return (
    <div 
      className={`flex w-full h-[100dvh] transition-opacity duration-500 overflow-hidden ${showGlassFade ? 'opacity-70' : 'opacity-100'} ${theme === 'dark' ? 'dark text-white' : 'text-slate-900'}`}
      style={{ height: 'var(--visual-viewport-height, 100dvh)' }}
    >
      {showGlassFade && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="glass-fade-overlay"></div>
        </div>
      )}

      {user && (
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
          chatSessions={chatSessions}
          activeChatId={activeChatId}
          onSelectChat={handleSelectChat}
          onNewChat={handleNewChat}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat}
        />
      )}

      <div className={`flex-1 flex flex-col h-full w-full relative overflow-hidden transition-all duration-300 pt-safe ${isKeyboardOpen ? '' : 'pb-safe'}`}>
        {locationError && (
          <div className={`${locationError.startsWith('Location set') ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-b border-emerald-200/50 dark:border-emerald-900/20' : 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-b border-amber-200/50 dark:border-amber-900/20'} p-2.5 text-center text-xs sm:text-sm z-30 flex items-center justify-between px-4 sm:px-6 transition-all duration-300`}>
            <div className="flex-grow flex items-center justify-center gap-2">
              <span className="material-symbols-outlined notranslate text-base sm:text-lg leading-none" translate="no">
                {locationError.startsWith('Location set') ? 'check_circle' : 'warning'}
              </span>
              <span className="font-medium">{locationError}</span>
              {locationPrompt && (
                <button 
                  className="underline font-bold ml-1.5 hover:opacity-80 transition-opacity" 
                  onClick={handleManualLocation}
                >
                  Enter manually
                </button>
              )}
            </div>
            <button 
              onClick={() => setLocationError(null)} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus:outline-none flex items-center justify-center flex-shrink-0"
              aria-label="Dismiss message"
            >
              <span className="material-symbols-outlined notranslate text-base sm:text-lg" style={{ fontSize: '18px' }} translate="no">close</span>
            </button>
          </div>
        )}

        <Header
          theme={theme}
          toggleTheme={toggleTheme}
          messages={messages}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onOpenNotifications={() => setShowReleaseNotes(true)}
          hasUnreadNotifications={hasUnreadNotifications}
          locationMode={locationMode}
          setLocationMode={setLocationMode}
          onManualLocationRequested={handleManualLocation}
        />

        <main className="flex-grow flex flex-col overflow-hidden px-1.5 sm:px-2 md:p-4 relative">
          {error && <ErrorMessage message={error} />}
          {showWeatherWidget && !isKeyboardOpen && (
            <div className="my-2 sm:my-4 flex justify-center px-1 sm:px-0 z-10">
              <WeatherWidget userLocation={userLocation} />
            </div>
          )}
          <ChatInterface
            messages={messages}
            isLoading={isLoading || isFetchingActiveChat}
            error={error}
            onSendMessage={handleSendMessage}
            onSampleQuestion={handleSampleQuestion}
            onRegenerate={handleRegenerate}
            onSwitchAlternative={handleSwitchAlternative}
            currentInputState={currentInput}
            setCurrentInputState={setCurrentInput}
            inputRef={inputRef}
            onStartLiveSession={() => setIsLiveSessionActive(true)}
            userFirstName={user?.displayName ? user.displayName.split(' ')[0] : ''}
            isKeyboardOpen={isKeyboardOpen}
          />
        </main>
        {!isKeyboardOpen && <Footer />}
      </div>

      <LiveSessionOverlay
        isActive={isLiveSessionActive}
        onClose={() => setIsLiveSessionActive(false)}
        userLocation={userLocation}
      />

      <PWAInstallPrompt theme={theme} />

      {showReleaseNotes && (
        <ReleaseNotesModal onClose={handleCloseReleaseNotes} />
      )}
    </div>
  );
};

export default App;