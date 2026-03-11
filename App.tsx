import React, { useState, useEffect, useRef } from 'react';
import { track } from '@vercel/analytics';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { Message, MessageRole, ResponseMode } from './types';
import { initChatService, sendMessageToAI } from './services/geminiService';
import { ErrorMessage } from './components/ErrorMessage';
import { Footer } from './components/Footer';
import { LoadingProgress } from './components/LoadingProgress';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import WeatherWidget from './src/components/WeatherWidget';
import { useGeolocation } from './src/hooks/useGeolocation';
import { useAuth } from './src/contexts/AuthContext';
import { LoginScreen } from './components/LoginScreen';
import { saveMessageToDB, fetchUserMessages, fetchChatSessions, createChatSession, ChatSession } from './src/services/dbService';
import { Sidebar } from './components/Sidebar';
import { LiveSessionOverlay } from './components/LiveSessionOverlay';
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

// ms

const initialWelcomeMessage: Message = {
  id: crypto.randomUUID(),
  role: MessageRole.MODEL,
  text: "Hello! I'm MeteoSran. Ask me anything about the weather in Ivory Coast or anywhere else in the world! You can also upload a weather image for me to analyze.",
  timestamp: new Date(),
};

const App: React.FC = () => {
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
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ResponseMode>(ResponseMode.CONCISE);
  const [currentInput, setCurrentInput] = useState<CurrentInputState>({ text: '', imageFile: null });
  const [isLiveSessionActive, setIsLiveSessionActive] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPrompt, setLocationPrompt] = useState(false);
  const { user, loading: authLoading } = useAuth();
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch messages when user logs in
  useEffect(() => {
    if (user && isInitialized) {
      setIsLoading(true);
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
      }).finally(() => {
         setIsLoading(false);
      });
    }
  }, [user, isInitialized]);

  useEffect(() => {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

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

  // Advanced Geolocation hook handling Android best practices (high accuracy, cache, timeout, permissions)
  const { location: geoLoc, error: geoErr } = useGeolocation(true);

  useEffect(() => {
    if (geoLoc) {
      setUserLocation({ lat: geoLoc.lat, lon: geoLoc.lon });
      setLocationError(null);
      setLocationPrompt(false);
    }
    if (geoErr) {
      setLocationError(geoErr);
      setLocationPrompt(true);
    }
  }, [geoLoc, geoErr]);

  // Handler for manual location entry (simple prompt for now)
  const handleManualLocation = () => {
    const manual = prompt('Enter your city or coordinates (lat,lon):');
    if (manual) {
      const parts = manual.split(',');
      if (parts.length === 2) {
        const lat = parseFloat(parts[0]);
        const lon = parseFloat(parts[1]);
        if (!isNaN(lat) && !isNaN(lon)) {
          setUserLocation({ lat, lon });
          setLocationError(null);
          setLocationPrompt(false);
          return;
        }
      }
      setLocationError('Invalid format. Please enter as lat,lon (e.g., 5.34,-4.03)');
    }
  };

  const handleSelectChat = async (chatId: string) => {
    if (chatId === activeChatId) return;
    setActiveChatId(chatId);
    if (user) {
      setIsLoading(true);
      const history = await fetchUserMessages(user.uid, chatId);
      setMessages(history.length > 0 ? history : [initialWelcomeMessage]);
      setIsLoading(false);
    }
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  const triggerGlassFade = () => {
    setShowGlassFade(true);
    setTimeout(() => setShowGlassFade(false), 900);
  };

  const toggleTheme = () => {
    // Track theme toggle event
    track('theme_toggle', { 
      from: theme, 
      to: theme === 'light' ? 'dark' : 'light' 
    });
    
    triggerGlassFade();
    setTimeout(() => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, 450); // switch theme at midpoint of fade
  };

  const handleSendMessage = async (text: string, imageFile?: File | null) => {
    if (!text.trim() && !imageFile) return;

    // Track message sending
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

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessageToAI([...messages, userMessage], selectedMode, false, user?.displayName || null);
      setMessages(prev => [...prev, response]);
      
      let finalChatId = activeChatId;

      if (!finalChatId && user) {
        // First message of a new chat session! Let's create the session and generate a title
        const promptText = userMessage.text;
        const newTitle = promptText ? promptText.split(" ").slice(0, 5).join(" ") + "..." : "Image Analysis...";
        finalChatId = await createChatSession(user.uid, newTitle);
        
        if (finalChatId) {
          setActiveChatId(finalChatId);
          setChatSessions(prev => [{ id: finalChatId!, title: newTitle, createdAt: new Date(), updatedAt: new Date() }, ...prev]);
        }
      }

      if (user && finalChatId) {
        await saveMessageToDB(user.uid, finalChatId, userMessage);
        await saveMessageToDB(user.uid, finalChatId, response);
      }
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

    // Send the history up to the message we want to regenerate
    const historyToResend = messages.slice(0, msgIndex);
    
    setIsLoading(true);
    setError(null);

    try {
      const response = await sendMessageToAI(historyToResend, selectedMode, false, user?.displayName || null);
      
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
    // Track sample question usage
    track('sample_question_clicked', { 
      question: question.substring(0, 50), // First 50 chars for privacy
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
    // Track mode changes
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
    <div className={`flex w-full h-[100dvh] transition-opacity duration-500 overflow-hidden ${showGlassFade ? 'opacity-70' : 'opacity-100'} ${theme === 'dark' ? 'dark text-white' : 'text-slate-900'}`}>
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
        />
      )}

      <div className="flex-1 flex flex-col h-full w-full relative overflow-hidden transition-all duration-300">
        {/* Location error and manual entry */}
        {locationError && (
          <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-xs sm:text-sm z-30">
            {locationError} {locationPrompt && <button className="ml-1 sm:ml-2 underline" onClick={handleManualLocation}>Enter manually</button>}
          </div>
        )}
        
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          messages={messages}
          selectedMode={selectedMode}
          onModeChange={handleModeChange}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />
        
        <main className="flex-grow flex flex-col overflow-hidden p-1 sm:p-2 md:p-4 relative">
          {error && <ErrorMessage message={error} />}
          {showWeatherWidget && (
            <div className="my-2 sm:my-4 flex justify-center px-1 sm:px-0 z-10">
              <WeatherWidget userLocation={userLocation} />
            </div>
          )}
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
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
          />
        </main>
        <Footer />
      </div>
      
      {/* Live Voice API Overlay */}
      <LiveSessionOverlay 
        isActive={isLiveSessionActive} 
        onClose={() => setIsLiveSessionActive(false)} 
      />

      {/* PWA Install Prompt */}
      <PWAInstallPrompt theme={theme} />
    </div>
  );
};

export default App;
