import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Message, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useLanguage } from '../src/contexts/LanguageContext';
import { WeatherCard, WeatherCardData } from './WeatherCard';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
  onSwitchAlternative?: (messageId: string, direction: 'prev' | 'next') => void;
  isHighlighted?: boolean;
}



const ModelIcon: React.FC<{ isThinking?: boolean }> = ({ isThinking }) => (
  <div className="relative">
    <div className={`aura-ring ${isThinking ? 'active' : ''}`}></div>
    <div className={`aura-glow ${isThinking ? 'active' : ''}`}></div>
    <img 
      src="/Meteosran-logo.png" 
      alt="MeteoSran Logo" 
      className={`h-6 w-6 md:h-7 md:w-7 rounded-full bg-white dark:bg-slate-800 p-0.5 md:p-1 relative z-10 
        ${isThinking ? 'animate-[logo-breathing_2s_ease-in-out_infinite]' : ''}`} 
    />
  </div>
);

// Aura cursor — a glowing dot that trails the stream
const AuraCursor: React.FC = () => (
  <span
    aria-hidden
    style={{
      display: 'inline-block',
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      marginLeft: '3px',
      verticalAlign: 'middle',
      background: 'radial-gradient(circle, #38bdf8 0%, #818cf8 60%, transparent 100%)',
      boxShadow: '0 0 8px 3px rgba(56,189,248,0.55), 0 0 18px 6px rgba(129,140,248,0.25)',
      animation: 'aura-cursor-pulse 1.1s ease-in-out infinite',
    }}
  />
);

// Aurora Glass Code Block Component
const CodeBlock: React.FC<{ language: string; children: React.ReactNode }> = ({ language, children }) => {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children).replace(/\n$/, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 rounded-xl overflow-hidden shadow-lg border border-slate-200/60 dark:border-slate-700/50 bg-white/40 dark:bg-[#0d1117]/60 backdrop-blur-xl relative group">
      {/* Aurora Ambient Glow (visible in dark mode) */}
      <div className="absolute inset-0 bg-gradient-to-br from-sky-400/5 via-transparent to-indigo-400/5 pointer-events-none opacity-0 dark:opacity-100"></div>
      
      {/* Mac-style Header */}
      <div className="relative flex items-center justify-between px-4 py-2.5 bg-slate-100/60 dark:bg-slate-800/60 border-b border-slate-200/60 dark:border-slate-700/50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]"></div>
            <div className="w-3 h-3 rounded-full bg-[#27c93f] shadow-[inset_0_1px_4px_rgba(0,0,0,0.2)]"></div>
          </div>
          <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{language}</span>
        </div>
        
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all duration-200 backdrop-blur-md border shadow-sm
            ${copied 
              ? 'bg-green-500/10 border-green-500/30 text-green-600 dark:text-green-400' 
              : 'bg-white/50 dark:bg-slate-700/50 border-slate-200/50 dark:border-slate-600/50 text-slate-500 dark:text-slate-400 hover:bg-white/80 dark:hover:bg-slate-700/80 hover:text-sky-600 dark:hover:text-sky-400'
            }`}
        >
          <span className="material-symbols-outlined notranslate text-[14px]" translate="no">
            {copied ? 'check' : 'content_copy'}
          </span>
          {copied ? t('common.copied') : t('common.copy')}
        </button>
      </div>
      
      {/* Code Content */}
      <pre className="relative p-4 overflow-x-auto text-[13px] md:text-[14px] leading-relaxed text-slate-800 dark:text-slate-300 font-mono custom-scrollbar">
        <code>{children}</code>
      </pre>
    </div>
  );
};

const stripMarkdown = (text: string): string => {
  return text
    // Remove weather card blocks first
    .replace(/<weather-card>[\s\S]*?<\/weather-card>/gi, '')
    // Remove code blocks
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code
    .replace(/`([^`]+)`/g, '$1')
    // Remove images
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, '$1')
    // Remove links, keeping only text
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    // Remove bold/italic markdown characters
    .replace(/[*_#~>]/g, '')
    // Replace multiple spaces/newlines with a single space
    .replace(/\s+/g, ' ')
    .trim();
};

// ── Weather Card Parser ──
const parseWeatherCard = (text: string): { cleanText: string; cardData: WeatherCardData | null } => {
  const tagRegex = /<weather-card>([\s\S]*?)<\/weather-card>/i;
  const match = text.match(tagRegex);

  if (!match) {
    return { cleanText: text, cardData: null };
  }

  const cleanText = text.replace(tagRegex, '').trim();
  let cardData: WeatherCardData | null = null;

  try {
    const parsed = JSON.parse(match[1].trim());
    const d = parsed.data || parsed;
    
    cardData = {
      location: d.location || 'Unknown',
      condition: d.condition || '',
      icon: d.icon || 'cloudy',
      temperature: {
        current: d.temperature?.current ?? 0,
        high: d.temperature?.high ?? d.temperature?.current ?? 0,
        low: d.temperature?.low ?? d.temperature?.current ?? 0,
        unit: d.temperature?.unit || 'C',
      },
      metrics: {
        humidity: d.metrics?.humidity ?? 0,
        windSpeed: d.metrics?.windSpeed ?? 0,
        windDirection: d.metrics?.windDirection || 'N',
        uvIndex: d.metrics?.uvIndex ?? 0,
        precipitationChance: d.metrics?.precipitationChance ?? 0,
      },
      feelsLike: d.feelsLike,
      isDayTime: d.isDayTime,
      hourlyStrip: Array.isArray(d.hourlyStrip) ? d.hourlyStrip : undefined,
    };
  } catch (e) {
    console.warn('[WeatherCard] Failed to parse weather card JSON:', e);
  }

  return { cleanText, cardData };
};

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRegenerate, onSwitchAlternative, isHighlighted = false }) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;
  const [isTyping, setIsTyping] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const globalAudioRef = useRef<HTMLAudioElement | null>(null);

  const handleTogglePlayAudio = async () => {
    alert(t('header.tts.comingSoon'));
    return;
    
    /* Temporarily disabled - Coming Soon
    if (isPlaying) {
      if (globalAudioRef.current) {
        globalAudioRef.current.pause();
      }
      setIsPlaying(false);
      return;
    }

    if ((window as any).MeteoSranActiveAudio) {
      (window as any).MeteoSranActiveAudio.pause();
      if ((window as any).MeteoSranActiveAudioStopCallback) {
        (window as any).MeteoSranActiveAudioStopCallback();
      }
    }

    setIsLoadingAudio(true);

    try {
      const cleanText = stripMarkdown(message.text);

      const storedVoice = localStorage.getItem('MeteoSranTtsVoice');
      const voiceName = storedVoice || (language === 'fr' ? 'Leda' : 'Callirrhoe');
      const targetLanguageCode = voiceName === 'Leda' ? 'fr-FR' : 'en-US';

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: cleanText,
          languageCode: targetLanguageCode,
          voiceName: voiceName
        })
      });

      if (!response.ok) {
        throw new Error('Failed to synthesize speech');
      }

      const data = await response.json();
      if (!data.audioContent) {
        throw new Error('No audio content received');
      }

      const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
      const audio = new Audio(audioUrl);
      globalAudioRef.current = audio;
      
      (window as any).MeteoSranActiveAudio = audio;
      (window as any).MeteoSranActiveAudioStopCallback = () => {
        setIsPlaying(false);
        globalAudioRef.current = null;
      };

      audio.onended = () => {
        setIsPlaying(false);
        globalAudioRef.current = null;
        (window as any).MeteoSranActiveAudio = null;
        (window as any).MeteoSranActiveAudioStopCallback = null;
      };

      audio.onerror = (e) => {
        console.error("Audio playback error:", e);
        setIsPlaying(false);
        globalAudioRef.current = null;
        (window as any).MeteoSranActiveAudio = null;
        (window as any).MeteoSranActiveAudioStopCallback = null;
      };

      await audio.play();
      setIsPlaying(false); // keep false for now
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
      (window as any).MeteoSranActiveAudio = null;
      (window as any).MeteoSranActiveAudioStopCallback = null;
    } finally {
      setIsLoadingAudio(false);
    }
    */
  };

  useEffect(() => {
    return () => {
      if (isPlaying && globalAudioRef.current) {
        globalAudioRef.current.pause();
        if ((window as any).MeteoSranActiveAudio === globalAudioRef.current) {
          (window as any).MeteoSranActiveAudio = null;
          (window as any).MeteoSranActiveAudioStopCallback = null;
        }
      }
    };
  }, [isPlaying]);

  const hasImage = message.image && message.image.data && message.image.mimeType;
  const timeString = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const [displayedText, setDisplayedText] = useState(() => {
    const isNew = !isUser && !isSystem && (Date.now() - new Date(message.timestamp).getTime() < 2000);
    return isNew ? '' : message.text;
  });

  useEffect(() => {
    if (!isUser && !isSystem) {
      const isNew = Date.now() - new Date(message.timestamp).getTime() < 2000;
      if (isNew) {
        setIsTyping(true);
        const words = message.text.split(' ');
        let currentWordIndex = 0;
        setDisplayedText(words[0] || '');
        
        const typingInterval = setInterval(() => {
          currentWordIndex++;
          if (currentWordIndex < words.length) {
            setDisplayedText(prev => prev + ' ' + words[currentWordIndex]);
          } else {
            clearInterval(typingInterval);
            setDisplayedText(message.text);
            setIsTyping(false);
          }
        }, 50);
        return () => {
          clearInterval(typingInterval);
          setIsTyping(false);
        };
      } else {
        setDisplayedText(message.text);
        setIsTyping(false);
      }
    }
  }, [message.text, isUser, isSystem, message.timestamp]);

  const handleExport = () => {
    const textToExport = message.text;
    if (navigator.share) {
      navigator.share({
        title: `${t('common.appName')} ${t('chat.response')}`,
        text: textToExport,
      }).catch(console.error);
    } else {
      const blob = new Blob([textToExport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${t('common.appName').toLowerCase()}-${t('chat.response').toLowerCase()}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 1) USER MESSAGE rendering: sleek right-aligned pill bubble
  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-fade-up-soft">
        <div className="flex flex-col items-end max-w-[85%] md:max-w-2xl">
          <div className={`px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm transition-all duration-500
            ${isHighlighted 
              ? 'bg-sky-500 text-white ring-4 ring-sky-500/50 dark:ring-sky-400/50 shadow-[0_0_20px_rgba(14,165,233,0.6)] scale-[1.01]' 
              : 'bg-slate-800 text-slate-100 dark:bg-slate-700/80'}`}>
            {hasImage && (
              <div className="mb-2 rounded-lg overflow-hidden">
                <img 
                  src={`data:${message.image!.mimeType};base64,${message.image!.data}`} 
                  alt={message.image!.name || 'Uploaded image'} 
                  className="max-w-full h-auto max-h-48 md:max-h-64 object-contain rounded-md"
                />
              </div>
            )}
            {message.text && (
              <p className="whitespace-pre-wrap text-[13px] md:text-[15px] leading-relaxed">
                {message.text}
              </p>
            )}
          </div>
          <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500 mt-1 mr-1">
            {timeString}
          </span>
        </div>
      </div>
    );
  }

  // 2) SYSTEM MESSAGE rendering: centered alert pill
  if (isSystem) {
    return (
      <div className="flex justify-center w-full animate-fade-up-soft">
        <div className="bg-red-500/10 text-red-600 dark:text-red-400 text-xs md:text-sm px-4 py-2 rounded-full border border-red-500/20">
          {message.text}
        </div>
      </div>
    );
  }

  // 3) MODEL (AI) MESSAGE rendering: Left aligned, unboxed, elegant typography
  return (
    <div className="flex justify-start w-full animate-fade-up-soft group">
      <div className={`flex gap-3 max-w-[95%] md:max-w-3xl w-full transition-all duration-500 rounded-2xl
        ${isHighlighted 
          ? 'bg-sky-500/10 dark:bg-sky-500/5 p-4 border border-sky-500/30 shadow-[0_0_20px_rgba(14,165,233,0.15)] scale-[1.01]' 
          : ''}`}>
        <div className="flex-shrink-0 mt-1">
          <ModelIcon isThinking={isTyping || (displayedText === '' && !isUser && !isSystem)} />
        </div>
        
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">MeteoSran</span>
            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">{timeString}</span>
          </div>

          {(() => {
            const { cleanText, cardData } = parseWeatherCard(displayedText);
            return (
              <>
                <div 
                  className={`text-slate-800 dark:text-slate-200 text-[14px] md:text-[15px] leading-relaxed transition-opacity duration-300 ${isTyping ? 'opacity-100' : ''}`}
                  style={{ textShadow: '0 0.5px 1.5px rgba(0, 0, 0, 0.12)' }}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-bold mt-4 md:mt-6 mb-2 text-slate-900 dark:text-white" {...props} />,
                      h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-semibold mt-4 md:mt-5 mb-2 text-slate-800 dark:text-slate-100" {...props} />,
                      h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-medium mt-3 md:mt-4 mb-1 text-slate-800 dark:text-slate-200" {...props} />,
                      ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 md:ml-5 my-2 md:my-3 space-y-1.5 marker:text-slate-400" {...props} />,
                      ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 md:ml-5 my-2 md:my-3 space-y-1.5 marker:text-slate-400" {...props} />,
                      li: ({node, ...props}) => <li className="pl-1" {...props} />,
                      p: ({node, children, ...props}) => <p className="mb-3 md:mb-4 last:mb-0" {...props}>{children}</p>,
                      strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                      a: ({node, ...props}) => <a className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline decoration-sky-400/30 underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                      blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 my-3 italic text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 rounded-r-lg" {...props} />,
                      code: ({node, inline, className, children, ...props}: any) => {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : 'code';
                        
                        return inline ? (
                          <code className="bg-slate-100 dark:bg-slate-800/80 px-1.5 py-0.5 rounded-md border border-slate-200/50 dark:border-slate-700/50 text-[0.9em] font-mono text-sky-700 dark:text-sky-300 shadow-sm" {...props}>
                            {children}
                          </code>
                        ) : (
                          <CodeBlock language={language}>
                            {children}
                          </CodeBlock>
                        );
                      }
                    }}
                  >
                    {cleanText}
                  </ReactMarkdown>
                  {isTyping && <AuraCursor />}
                </div>

                {/* ── Visual Weather Card ── */}
                {cardData && !isTyping && (
                  <div className="mt-4">
                    <WeatherCard data={cardData} />
                  </div>
                )}
              </>
            );
          })()}
          
          {/* ACTION BUTTONS — Premium glassmorphic row */}
          <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 ease-out">

            {/* ── Listen (TTS) Button ── */}
            <div className="relative tooltip-container">
              <div className="premium-tooltip">{isPlaying ? t('common.stop') : t('common.listen')}</div>
              <button
                onClick={handleTogglePlayAudio}
                disabled={isLoadingAudio}
                className={`inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-full border backdrop-blur-md shadow-sm text-[11.5px] font-medium tracking-wide cursor-pointer transition-all duration-200 hover:scale-[1.04] active:scale-[0.95] whitespace-nowrap min-h-0 min-w-0
                  ${isPlaying
                    ? 'bg-rose-500/10 border-rose-500/35 text-rose-600 dark:text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.18),0_2px_8px_rgba(244,63,94,0.1)]'
                    : 'bg-white/55 dark:bg-slate-800/65 border-slate-400/20 dark:border-slate-500/20 text-slate-500 dark:text-slate-400 hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30 hover:shadow-[0_0_12px_rgba(14,165,233,0.18),0_2px_8px_rgba(14,165,233,0.1)]'
                  }`}
              >
                {isLoadingAudio ? (
                  <>
                    <svg className="animate-spin w-[13px] h-[13px] text-sky-500" style={{flexShrink:0}} fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('common.loading')}</span>
                  </>
                ) : isPlaying ? (
                  <>
                    <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 10h6v4H9z" />
                    </svg>
                    <span>{t('common.stop')}</span>
                  </>
                ) : (
                  <>
                    <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                    </svg>
                    <span>{t('common.listen')}</span>
                  </>
                )}
              </button>
            </div>

            {/* ── Copy Button ── */}
            <div className="relative tooltip-container">
              <div className="premium-tooltip">{copied ? t('common.copied') : t('common.copy')}</div>
              <button
                onClick={handleCopy}
                className={`inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-full border backdrop-blur-md shadow-sm text-[11.5px] font-medium tracking-wide cursor-pointer transition-all duration-200 hover:scale-[1.04] active:scale-[0.95] whitespace-nowrap min-h-0 min-w-0
                  ${copied
                    ? 'bg-emerald-500/10 border-emerald-500/35 text-emerald-600 dark:text-emerald-400 shadow-[0_0_0_1px_rgba(34,197,94,0.15),0_2px_8px_rgba(34,197,94,0.12)]'
                    : 'bg-white/55 dark:bg-slate-800/65 border-slate-400/20 dark:border-slate-500/20 text-slate-500 dark:text-slate-400 hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30 hover:shadow-[0_0_12px_rgba(14,165,233,0.18),0_2px_8px_rgba(14,165,233,0.1)]'
                  }`}
              >
                {copied ? (
                  <>
                    <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('common.copied')}</span>
                  </>
                ) : (
                  <>
                    <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>{t('common.copy')}</span>
                  </>
                )}
              </button>
            </div>

            {/* ── Share Button ── */}
            <div className="relative tooltip-container">
              <div className="premium-tooltip">{t('common.share')}</div>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-full border border-slate-400/20 dark:border-slate-500/20 bg-white/55 dark:bg-slate-800/65 text-slate-500 dark:text-slate-400 backdrop-blur-md shadow-sm text-[11.5px] font-medium tracking-wide cursor-pointer transition-all duration-200 hover:scale-[1.04] active:scale-[0.95] whitespace-nowrap min-h-0 min-w-0 hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30 hover:shadow-[0_0_12px_rgba(14,165,233,0.18),0_2px_8px_rgba(14,165,233,0.1)]"
              >
                <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                <span>{t('common.share')}</span>
              </button>
            </div>

            {/* ── Regenerate Button ── */}
            {onRegenerate && (
              <div className="relative tooltip-container">
                <div className="premium-tooltip">{t('chat.regenerate')}</div>
                <button
                  onClick={() => onRegenerate(message.id)}
                  className="inline-flex items-center gap-[5px] px-2.5 py-[5px] rounded-full border border-slate-400/20 dark:border-slate-500/20 bg-white/55 dark:bg-slate-800/65 text-slate-500 dark:text-slate-400 backdrop-blur-md shadow-sm text-[11.5px] font-medium tracking-wide cursor-pointer transition-all duration-200 hover:scale-[1.04] active:scale-[0.95] whitespace-nowrap min-h-0 min-w-0 hover:bg-sky-500/10 hover:text-sky-500 hover:border-sky-500/30 hover:shadow-[0_0_12px_rgba(14,165,233,0.18),0_2px_8px_rgba(14,165,233,0.1)]"
                >
                  <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span>{t('chat.regenerate')}</span>
                </button>
              </div>
            )}

            {/* ── Alternatives Pagination ── */}
            {message.alternatives && message.alternatives.length > 1 && (
              <div className="flex items-center gap-1 ml-1 text-[10px] md:text-xs text-slate-500 bg-white/55 dark:bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-200/40 dark:border-slate-700/40 backdrop-blur-md shadow-sm">
                <button 
                  onClick={() => onSwitchAlternative && onSwitchAlternative(message.id, 'prev')}
                  disabled={message.currentAlternativeIndex === 0}
                  className="p-0.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-600/70 disabled:opacity-30 transition-colors"
                  title={t('chat.prevVersion')}
                  style={{minHeight:'auto',minWidth:'auto'}}
                >
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="min-w-[2rem] text-center font-medium">{(message.currentAlternativeIndex || 0) + 1} / {message.alternatives.length}</span>
                <button 
                  onClick={() => onSwitchAlternative && onSwitchAlternative(message.id, 'next')}
                  disabled={message.currentAlternativeIndex === message.alternatives.length - 1}
                  className="p-0.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-600/70 disabled:opacity-30 transition-colors"
                  title={t('chat.nextVersion')}
                  style={{minHeight:'auto',minWidth:'auto'}}
                >
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
