import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Header } from './components/Header';
import { ChatInterface } from './components/ChatInterface';
import { Message, MessageRole, ImagePayload, ResponseMode } from './types';
import { initChatService, sendMessageToAI } from './services/geminiService';
import { ErrorMessage } from './components/ErrorMessage';
import { Footer } from './components/Footer';
import { LoadingProgress } from './components/LoadingProgress';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import WeatherWidget from './src/components/WeatherWidget';

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

const SHOCKWAVE_DURATION = 700; // ms

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

  const [showShockwave, setShowShockwave] = useState(false);
  const [showGlassFade, setShowGlassFade] = useState(false);
  const [showWeatherWidget, setShowWeatherWidget] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [initProgress, setInitProgress] = useState(0);
  const [initMessage, setInitMessage] = useState("Initializing MeteoSran...");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMode, setSelectedMode] = useState<ResponseMode>(ResponseMode.DEFAULT);
  const [currentInput, setCurrentInput] = useState<CurrentInputState>({ text: '', imageFile: null });
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [locationPrompt, setLocationPrompt] = useState(false);

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

  // Geolocation logic
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          setLocationError(null);
        },
        (error) => {
          setLocationError('Location access denied. Please enter your location manually.');
          setLocationPrompt(true);
        }
      );
    } else {
      setLocationError('Geolocation is not supported by your browser. Please enter your location manually.');
      setLocationPrompt(true);
    }
  }, []);

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

  const triggerShockwave = () => {
    setShowShockwave(true);
    setTimeout(() => setShowShockwave(false), SHOCKWAVE_DURATION);
  };

  const triggerGlassFade = () => {
    setShowGlassFade(true);
    setTimeout(() => setShowGlassFade(false), 900);
  };

  const toggleTheme = () => {
    triggerGlassFade();
    setTimeout(() => {
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    }, 450); // switch theme at midpoint of fade
  };
  
  const initialWelcomeMessage: Message = useMemo(() => ({
    id: crypto.randomUUID(),
    role: MessageRole.MODEL,
    text: "Hello! I'm MeteoSran. Ask me anything about clouds, storms, hurricanes, or other weather wonders! You can also upload an image of a weather phenomenon for me to explain.",
    timestamp: new Date(),
  }),[]);

  const handleSendMessage = async (text: string, imageFile?: File | null) => {
    if (!text.trim() && !imageFile) return;

    const isWeatherQueryForCI = text.toLowerCase().includes('weather') && 
                                (text.toLowerCase().includes('ivory coast') || text.toLowerCase().includes('abidjan'));
    
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
      const response = await sendMessageToAI([...messages, userMessage], selectedMode);
      setMessages(prev => [...prev, response]);
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

  const handleSampleQuestion = (question: string) => {
    setCurrentInput({ text: question, imageFile: null });
    setTimeout(() => {
      handleSendMessage(question);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 0);
  };

  if (!isInitialized) {
    return <LoadingProgress progress={initProgress} message={initMessage} />;
  }

  return (
    <div className={`flex flex-col h-screen transition-opacity duration-500 ${showGlassFade ? 'opacity-70' : 'opacity-100'} ${theme === 'dark' ? 'dark' : ''}`}>
      {showGlassFade && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          <div className="glass-fade-overlay"></div>
        </div>
      )}
      {showShockwave && (
        <div className="fixed inset-0 z-[9999] pointer-events-none flex items-center justify-center">
          <div className="shockwave-glass"></div>
        </div>
      )}
      {/* Location error and manual entry */}
      {locationError && (
        <div className="bg-yellow-100 text-yellow-800 p-2 text-center text-xs sm:text-sm">
          {locationError} {locationPrompt && <button className="ml-1 sm:ml-2 underline" onClick={handleManualLocation}>Enter manually</button>}
        </div>
      )}
      <div className="flex-grow flex flex-col overflow-hidden">
        <Header 
          theme={theme} 
          toggleTheme={toggleTheme} 
          messages={messages}
          selectedMode={selectedMode}
          onModeChange={setSelectedMode}
        />
        <main className="flex-grow flex flex-col overflow-hidden p-1 sm:p-2 md:p-4">
          {error && <ErrorMessage message={error} />}
          {showWeatherWidget && (
            <div className="my-2 sm:my-4 flex justify-center px-1 sm:px-0">
              <WeatherWidget userLocation={userLocation} />
            </div>
          )}
          <ChatInterface
            messages={messages}
            isLoading={isLoading}
            error={error}
            onSendMessage={handleSendMessage}
            onSampleQuestion={handleSampleQuestion}
            currentInputState={currentInput}
            setCurrentInputState={setCurrentInput}
            inputRef={inputRef}
          />
        </main>
        <Footer />
      </div>
      
      {/* PWA Install Prompt */}
      <PWAInstallPrompt theme={theme} />
    </div>
  );
};

export default App;
