import React, { useState, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
  onRegenerate?: (messageId: string) => void;
  onSwitchAlternative?: (messageId: string, direction: 'prev' | 'next') => void;
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

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, onRegenerate, onSwitchAlternative }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === MessageRole.USER;
  const isSystem = message.role === MessageRole.SYSTEM;
  const [isTyping, setIsTyping] = useState(false);

  const hasImage = message.image && message.image.data && message.image.mimeType;
  const timeString = new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Dark-mode helper for button resting state
  const isDark = () => document.body.classList.contains('dark');
  const restingBg  = () => isDark() ? 'rgba(30,41,59,0.65)' : 'rgba(255,255,255,0.55)';
  const restingBorder = 'rgba(148,163,184,0.18)';
  const restingColor  = 'rgb(100,116,139)';
  const restingShadow = '0 1px 4px rgba(0,0,0,0.06)';

  // Unified Hover Theme (Sky Blue)
  const hoverBg = 'rgba(14,165,233,0.08)';
  const hoverBorder = '1px solid rgba(14,165,233,0.28)';
  const hoverColor = 'rgb(14,165,233)';
  const hoverShadow = '0 0 12px rgba(14,165,233,0.18), 0 2px 8px rgba(14,165,233,0.10)';

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
        title: 'MeteoSran Response',
        text: textToExport,
      }).catch(console.error);
    } else {
      const blob = new Blob([textToExport], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meteosran-response.txt';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  // 1) USER MESSAGE rendering: sleek right-aligned pill bubble
  if (isUser) {
    return (
      <div className="flex justify-end w-full animate-fade-up-soft">
        <div className="flex flex-col items-end max-w-[85%] md:max-w-2xl">
          <div className="bg-slate-800 text-slate-100 dark:bg-slate-700/80 px-4 py-2.5 rounded-2xl rounded-tr-sm shadow-sm">
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
      <div className="flex gap-3 max-w-[95%] md:max-w-3xl w-full">
        <div className="flex-shrink-0 mt-1">
          <ModelIcon isThinking={isTyping || (displayedText === '' && !isUser && !isSystem)} />
        </div>
        
        <div className="flex flex-col flex-grow min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-xs md:text-sm font-semibold text-slate-700 dark:text-slate-300">MeteoSran</span>
            <span className="text-[10px] md:text-xs text-slate-400 dark:text-slate-500">{timeString}</span>
          </div>

          <div className="text-slate-800 dark:text-slate-200 text-[14px] md:text-[15px] leading-relaxed">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-xl md:text-2xl font-bold mt-4 md:mt-6 mb-2 text-slate-900 dark:text-white" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-lg md:text-xl font-semibold mt-4 md:mt-5 mb-2 text-slate-800 dark:text-slate-100" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-base md:text-lg font-medium mt-3 md:mt-4 mb-1 text-slate-800 dark:text-slate-200" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-outside ml-4 md:ml-5 my-2 md:my-3 space-y-1.5 marker:text-slate-400" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-outside ml-4 md:ml-5 my-2 md:my-3 space-y-1.5 marker:text-slate-400" {...props} />,
                li: ({node, ...props}) => <li className="pl-1" {...props} />,
                p: ({node, ...props}) => <p className="mb-3 md:mb-4 last:mb-0" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold text-slate-900 dark:text-white" {...props} />,
                a: ({node, ...props}) => <a className="text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 underline decoration-sky-400/30 underline-offset-2 transition-colors" target="_blank" rel="noopener noreferrer" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-slate-300 dark:border-slate-600 pl-4 py-1 my-3 italic text-slate-600 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-800/50 rounded-r-lg" {...props} />,
                code: ({node, inline, ...props}: any) => 
                  inline ? 
                  <code className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-[0.9em] font-mono text-sky-700 dark:text-sky-300" {...props} /> :
                  <div className="my-3 md:my-4 rounded-lg overflow-hidden bg-slate-900 dark:bg-[#0d1117] shadow-sm ring-1 ring-slate-800 dark:ring-white/10">
                    <pre className="p-3 md:p-4 overflow-x-auto text-[13px] md:text-[14px] leading-relaxed text-slate-300 font-mono">
                      <code {...props} />
                    </pre>
                  </div>
              }}
            >
              {displayedText}
            </ReactMarkdown>
          </div>
          
          {/* ACTION BUTTONS — Premium glassmorphic row */}
          <div className="flex items-center gap-1.5 mt-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-300 ease-out">

            {/* ── Copy Button ── */}
            <div className="relative tooltip-container">
              <div className="premium-tooltip">{copied ? 'Copié !' : 'Copier'}</div>
              <button
                onClick={handleCopy}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  border: copied
                    ? '1px solid rgba(34,197,94,0.35)'
                    : '1px solid rgba(148,163,184,0.18)',
                  background: copied
                    ? 'rgba(34,197,94,0.08)'
                    : 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: copied
                    ? '0 0 0 1px rgba(34,197,94,0.15), 0 2px 8px rgba(34,197,94,0.12)'
                    : '0 1px 4px rgba(0,0,0,0.06)',
                  color: copied ? 'rgb(22,163,74)' : 'rgb(100,116,139)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  whiteSpace: 'nowrap',
                  minHeight: 'auto',
                  minWidth: 'auto',
                }}
              onMouseEnter={e => {
                if (!copied) {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = hoverBg;
                  el.style.border = hoverBorder;
                  el.style.color = hoverColor;
                  el.style.boxShadow = hoverShadow;
                  el.style.transform = 'scale(1.04)';
                }
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                if (copied) {
                  el.style.background = 'rgba(34,197,94,0.08)';
                  el.style.border = '1px solid rgba(34,197,94,0.35)';
                  el.style.color = 'rgb(22,163,74)';
                  el.style.boxShadow = '0 0 0 1px rgba(34,197,94,0.15), 0 2px 8px rgba(34,197,94,0.12)';
                } else {
                  el.style.background = restingBg();
                  el.style.border = `1px solid ${restingBorder}`;
                  el.style.color = restingColor;
                  el.style.boxShadow = restingShadow;
                }
                el.style.transform = 'scale(1)';
              }}
            >
              {copied ? (
                <>
                  <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Copié !</span>
                </>
              ) : (
                <>
                  <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <span>Copier</span>
                </>
              )}
            </button>
          </div>

          {/* ── Share Button ── */}
          <div className="relative tooltip-container">
            <div className="premium-tooltip">Partager</div>
            <button
              onClick={handleExport}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '5px 10px',
                borderRadius: '999px',
                border: '1px solid rgba(148,163,184,0.18)',
                background: restingBg(),
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                color: 'rgb(100,116,139)',
                fontSize: '11.5px',
                fontWeight: 500,
                letterSpacing: '0.01em',
                cursor: 'pointer',
                transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                whiteSpace: 'nowrap',
                minHeight: 'auto',
                minWidth: 'auto',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = hoverBg;
                el.style.border = hoverBorder;
                el.style.color = hoverColor;
                el.style.boxShadow = hoverShadow;
                el.style.transform = 'scale(1.04)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLButtonElement;
                el.style.background = restingBg();
                el.style.border = `1px solid ${restingBorder}`;
                el.style.color = restingColor;
                el.style.boxShadow = restingShadow;
                el.style.transform = 'scale(1)';
              }}
            >
              <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Partager</span>
            </button>
          </div>

          {/* ── Regenerate Button ── */}
          {onRegenerate && (
            <div className="relative tooltip-container">
              <div className="premium-tooltip">Régénérer</div>
              <button
                onClick={() => onRegenerate(message.id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  padding: '5px 10px',
                  borderRadius: '999px',
                  border: '1px solid rgba(148,163,184,0.18)',
                  background: restingBg(),
                  backdropFilter: 'blur(12px)',
                  WebkitBackdropFilter: 'blur(12px)',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  color: 'rgb(100,116,139)',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  letterSpacing: '0.01em',
                  cursor: 'pointer',
                  transition: 'all 0.22s cubic-bezier(0.34,1.56,0.64,1)',
                  whiteSpace: 'nowrap',
                  minHeight: 'auto',
                  minWidth: 'auto',
                }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = hoverBg;
                  el.style.border = hoverBorder;
                  el.style.color = hoverColor;
                  el.style.boxShadow = hoverShadow;
                  el.style.transform = 'scale(1.04)';
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLButtonElement;
                  el.style.background = restingBg();
                  el.style.border = `1px solid ${restingBorder}`;
                  el.style.color = restingColor;
                  el.style.boxShadow = restingShadow;
                  el.style.transform = 'scale(1)';
                }}
              >
                <svg style={{width:'13px',height:'13px',flexShrink:0}} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Régénérer</span>
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
                  title="Version précédente"
                  style={{minHeight:'auto',minWidth:'auto'}}
                >
                  <svg className="w-3 h-3 md:w-3.5 md:h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <span className="min-w-[2rem] text-center font-medium">{(message.currentAlternativeIndex || 0) + 1} / {message.alternatives.length}</span>
                <button 
                  onClick={() => onSwitchAlternative && onSwitchAlternative(message.id, 'next')}
                  disabled={message.currentAlternativeIndex === message.alternatives.length - 1}
                  className="p-0.5 rounded-full hover:bg-slate-200/70 dark:hover:bg-slate-600/70 disabled:opacity-30 transition-colors"
                  title="Version suivante"
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
