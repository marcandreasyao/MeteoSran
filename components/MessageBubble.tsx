import React, { useRef, useEffect } from 'react';
import { Message, MessageRole } from '../types';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageBubbleProps {
  message: Message;
}

const UserIcon: React.FC = () => (
  <span className="inline-block h-7 w-7 rounded-full bg-gray-300 dark:bg-slate-700 flex items-center justify-center">
    <svg className="h-5 w-5 text-white dark:text-slate-200" fill="currentColor" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-2.21 3.58-4 8-4s8 1.79 8 4v1H4v-1z" />
    </svg>
  </span>
);

const ModelIcon: React.FC = () => (
  <img src="/Meteosran-logo.png" alt="MeteoSran Logo" className="h-7 w-7 rounded-full bg-white dark:bg-slate-800 p-1" />
);

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;
  const isModel = message.role === MessageRole.MODEL;
  const isSystem = message.role === MessageRole.SYSTEM;

  const bubbleAlignment = isUser ? 'justify-end' : 'justify-start';
  
  const userBubbleStyles = "bg-blue-500/50 dark:bg-sky-600/60 text-white dark:text-slate-50 backdrop-blur-md border border-blue-400/30 dark:border-sky-500/40";
  const modelBubbleStyles = "bg-white/40 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 backdrop-blur-md border border-slate-300/30 dark:border-slate-600/40";
  const systemBubbleStyles = "bg-red-400/50 dark:bg-red-700/60 text-white dark:text-red-50 backdrop-blur-md border border-red-300/30 dark:border-red-600/40";

  const bubbleColor = isUser
    ? userBubbleStyles
    : isModel
    ? modelBubbleStyles
    : systemBubbleStyles;

  const iconBgColor = isUser ? 'bg-blue-500 dark:bg-sky-600' : 'bg-slate-200 dark:bg-slate-600';
  const icon = isUser ? <UserIcon /> : isModel ? <ModelIcon /> : null;
  const authorName = isUser ? "You" : isModel ? "MeteoSran" : "System";

  const hasImage = message.image && message.image.data && message.image.mimeType;

  const bubbleRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (bubbleRef.current) {
      bubbleRef.current.classList.add('bubble-in');
      const timeout = setTimeout(() => {
        bubbleRef.current && bubbleRef.current.classList.remove('bubble-in');
      }, 700);
      return () => clearTimeout(timeout);
    }
  }, []);

  return (
    <div className={`flex ${bubbleAlignment} w-full`}>
      <div className={`flex flex-col max-w-xl md:max-w-2xl`}>
        <div className={`flex items-center space-x-2 mb-1 ${isUser ? 'self-end' : 'self-start'}`}>
          {!isUser && icon && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${iconBgColor}`}>{icon}</div>}
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{authorName}</span>
          {isUser && icon && <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${iconBgColor}`}>{icon}</div>}
        </div>
        <div
          ref={bubbleRef}
          className={`p-3 md:p-4 rounded-xl shadow-xl ${bubbleColor} ${isUser ? 'rounded-br-none' : 'rounded-bl-none'} transition-all duration-500
            bg-white/30 dark:bg-slate-800/40 backdrop-blur-lg border-2 border-sky-200/40 dark:border-sky-400/30
            hover:shadow-[0_0_24px_4px_rgba(56,189,248,0.18)] hover:border-sky-400/80
            relative overflow-hidden bubble-glass-premium
          `}
          style={{
            boxShadow: '0 4px 32px 0 rgba(56,189,248,0.10), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
          }}
        >
          {isUser && hasImage && (
            <div className="mb-2 border border-white/30 dark:border-slate-500/40 rounded-lg overflow-hidden">
              <img 
                src={`data:${message.image!.mimeType};base64,${message.image!.data}`} 
                alt={message.image!.name || 'User uploaded image'} 
                className="max-w-full h-auto max-h-64 object-contain rounded-md"
              />
            </div>
          )}
          {(isModel || isSystem || (isUser && message.text)) ? ( // Ensure user text also gets parsed if it exists
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({node, ...props}) => <h1 className="text-2xl font-semibold my-2" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-semibold my-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-semibold my-1" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc list-inside my-1 space-y-1" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal list-inside my-1 space-y-1" {...props} />,
                p: ({node, ...props}) => <p className="my-1" {...props} />,
                strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                a: ({node, ...props}) => <a className="text-blue-600 dark:text-sky-400 hover:underline" target="_blank" rel="noopener noreferrer" {...props} />,
              }}
            >
              {message.text}
            </ReactMarkdown>
          ) : isUser && !message.text && hasImage ? null : ( // If only image and no text from user, don't try to render empty p
             <p className="whitespace-pre-wrap">{message.text}</p> // Fallback for any other scenario (shouldn't be hit often)
          )}
        </div>
         <p className={`text-xs text-slate-500 dark:text-slate-400 mt-1 ${isUser ? 'text-right' : 'text-left'}`}>
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
      </div>
    </div>
  );
};
