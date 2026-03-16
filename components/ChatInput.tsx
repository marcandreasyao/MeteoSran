import React, { useRef, useState, useEffect, RefObject } from 'react';
import { CurrentInputState } from '../App';
import { useSpeechRecognition } from '../src/hooks/useSpeechRecognition';
import { AudioVisualizer } from './AudioVisualizer';

interface ChatInputProps {
  onSendMessage: (text: string, imageFile?: File | null) => void;
  isLoading: boolean;
  currentInputState: CurrentInputState;
  setCurrentInputState: (value: CurrentInputState) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  onStartLiveSession?: () => void;
}


const CloseIcon: React.FC = () => (
  <span className="material-symbols-outlined text-xs">close</span>
);

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, currentInputState, setCurrentInputState, inputRef, onStartLiveSession }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [showToolsDropdown, setShowToolsDropdown] = useState(false);

  const { text: currentText, imageFile } = currentInputState;
  const textBeforeDictationRef = useRef<string>('');

  const handleSpeechResult = React.useCallback((transcript: string, _isFinal: boolean) => {
    const prefix = textBeforeDictationRef.current ? textBeforeDictationRef.current + ' ' : '';
    setCurrentInputState({ ...currentInputState, text: prefix + transcript });
  }, [currentInputState, setCurrentInputState]);

  const {
    isListening,
    supported: speechSupported,
    audioData,
    language,
    startListening,
    stopListening,
    toggleLanguage
  } = useSpeechRecognition({
    onResult: handleSpeechResult,
  });

  const toggleDictation = () => {
    if (isListening) {
      stopListening();
    } else {
      textBeforeDictationRef.current = currentText;
      startListening();
    }
  };

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreviewUrl(null);
    }
  }, [imageFile]);

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    if ((currentText.trim() || imageFile) && !isLoading) {
      onSendMessage(currentText.trim(), imageFile);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
      }
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCurrentInputState({ ...currentInputState, text: e.target.value });
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 128)}px`;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleImageUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file (e.g., PNG, JPG, WEBP).');
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const maxSize = 4 * 1024 * 1024;
      if (file.size > maxSize) {
        alert(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
        if (fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      setCurrentInputState({ ...currentInputState, imageFile: file });
    }
  };

  const handleClearImage = () => {
    setCurrentInputState({ ...currentInputState, imageFile: null });
    setImagePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="p-2 sm:p-3 md:p-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] w-full relative z-10">
      {imagePreviewUrl && (
        <div className="mb-2 p-2 bg-white/20 dark:bg-slate-700/30 rounded-lg relative w-fit max-w-[120px] sm:max-w-[200px]">
          <img src={imagePreviewUrl} alt="Selected preview" className="max-h-20 sm:max-h-32 rounded object-contain" />
          <button
            onClick={handleClearImage}
            className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 focus:outline-none focus:ring-1 focus:ring-white"
            aria-label="Remove selected image"
          >
            <CloseIcon />
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-end gap-2 w-full">
        <div className="flex items-center flex-grow gap-1.5 sm:gap-2 bg-slate-100 dark:bg-[#1e1f20] rounded-[28px] sm:rounded-[32px] p-1 sm:p-2 sm:px-4 transition-all duration-200 border border-slate-200/50 dark:border-slate-800/80 shadow-sm relative">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/png, image/jpeg, image/webp, image/gif"
            className="hidden"
            aria-label="Upload image file"
            disabled={isLoading}
          />
        
          {/* Tools Menu (Dropdown) on Mobile/Tablet */}
          <div className="relative flex items-center shrink-0">
            <button
              type="button"
              onClick={() => setShowToolsDropdown(!showToolsDropdown)}
              className={`p-1.5 sm:p-2 rounded-full transition-all duration-300 ${showToolsDropdown ? 'bg-blue-600 text-white rotate-45' : 'text-slate-500 hover:bg-black/5 dark:hover:bg-white/5'}`}
              aria-label="Tools menu"
            >
              <span className="material-symbols-outlined text-[24px] sm:text-2xl">{showToolsDropdown ? 'close' : 'add'}</span>
            </button>

            {/* Soft Dropdown Menu */}
            {showToolsDropdown && (
              <div className="absolute bottom-full left-0 mb-3 w-40 sm:w-48 bg-white/90 dark:bg-[#1e1f20]/95 backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300 z-50">
                <div className="p-1.5 flex flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      handleImageUploadClick();
                      setShowToolsDropdown(false);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors group"
                  >
                    <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">add_photo_alternate</span>
                    <span className="text-sm font-medium">Image Upload</span>
                  </button>
                  
                  {onStartLiveSession && (
                    <button
                      type="button"
                      onClick={() => {
                        onStartLiveSession();
                        setShowToolsDropdown(false);
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors group"
                    >
                      <div className="relative">
                        <span className="material-symbols-outlined text-[22px] group-hover:scale-110 transition-transform">graphic_eq</span>
                        <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                        </span>
                      </div>
                      <span className="text-sm font-medium">Live Session</span>
                    </button>
                  )}

                  {speechSupported && (
                    <button
                      type="button"
                      onClick={() => {
                        toggleLanguage();
                      }}
                      className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors group"
                    >
                      <span className="text-[11px] font-black w-6 text-center border border-slate-400 rounded px-0.5 group-hover:bg-slate-700 group-hover:text-white transition-all">
                        {language === 'fr-FR' ? 'FR' : 'EN'}
                      </span>
                      <span className="text-sm font-medium">Language</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Primary Voice Tool (Always visible for accessibility) */}
          {speechSupported && (
            <button
              type="button"
              onClick={toggleDictation}
              disabled={isLoading}
              className={`p-1.5 sm:p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0 ${isListening
                ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              <span className="material-symbols-outlined text-[22px] sm:text-2xl">
                {isListening ? 'mic_off' : 'mic'}
              </span>
            </button>
          )}

          {isListening ? (
            <div className="flex-grow flex flex-col items-center justify-center overflow-hidden animate-[pulse_2s_ease-in-out_infinite] relative px-2 min-h-[40px] my-auto">
              <AudioVisualizer audioData={audioData} isListening={isListening} />
              <div className="absolute bottom-[-4px] text-xs font-medium text-sky-600 dark:text-sky-400 truncate w-full text-center opacity-80 pb-1">
                {currentText || "Listening..."}
              </div>
            </div>
          ) : (
            <div className="flex-grow relative flex items-center my-auto overflow-hidden"
                 style={{ 
                   WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)', 
                   maskImage: 'linear-gradient(to right, transparent 0%, black 5%, black 95%, transparent 100%)' 
                 }}>
              <textarea
                ref={inputRef}
                value={currentText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                placeholder={imageFile ? "Describe image..." : "Ask me anything about weather..."}
                style={{ height: '55px' }}
                className="w-full py-4 px-2 bg-transparent border-none focus:ring-0 resize-none overflow-y-auto hide-scrollbar
                             text-[16px] text-slate-800 dark:text-slate-100 
                             placeholder-slate-500 dark:placeholder-slate-400 leading-tight"
                rows={1}
                disabled={isLoading}
                aria-label="Chat message input"
              />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading || (!currentText.trim() && !imageFile)}
          className="group flex flex-shrink-0 items-center justify-center rounded-full transition-all duration-200
                     w-[44px] h-[44px] self-center
                     bg-blue-600 hover:bg-blue-500
                     disabled:bg-slate-300 dark:disabled:bg-slate-700
                     text-white disabled:text-slate-400 dark:disabled:text-slate-500
                     shadow-md hover:shadow-blue-500/30
                     focus:outline-none focus:ring-2 focus:ring-blue-400
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:shadow-none
                     ml-2"
          aria-label="Send message"
        >
          {isLoading ? (
            <span className="material-symbols-outlined text-[22px]">
              stop
            </span>
          ) : (
            <span className="material-symbols-outlined text-[22px] transform transition-transform group-hover:-translate-y-0.5 group-hover:scale-110">
              arrow_upward
            </span>
          )}
        </button>
      </form>
    </div>
  );
};
