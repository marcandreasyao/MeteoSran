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

const SendIcon: React.FC<{ isLoading: boolean }> = ({ isLoading }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={`w-5 h-5 md:w-6 md:h-6 transform transition-transform duration-150 ${isLoading ? 'animate-pulse' : 'group-hover:scale-110'}`}
  >
    <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <span className="material-symbols-outlined text-xs">close</span>
);

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, currentInputState, setCurrentInputState, inputRef, onStartLiveSession }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

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
    <div className="p-2 sm:p-3 md:p-4 w-full relative z-10">
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
        <div className="flex items-end flex-grow gap-1.5 sm:gap-2 bg-slate-100 dark:bg-[#1e1f20] rounded-[32px] p-2 sm:px-4 sm:py-2 transition-all duration-200">
          <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/png, image/jpeg, image/webp, image/gif"
          className="hidden"
          aria-label="Upload image file"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleImageUploadClick}
          disabled={isLoading}
          className="p-2 rounded-full hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300
                     focus:outline-none focus:ring-2 focus:ring-sky-500
                     transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Attach image"
        >
          <span className="material-symbols-outlined text-2xl">add_photo_alternate</span>
        </button>

        {/* Live Audio Session Button */}
        <button
          type="button"
          onClick={onStartLiveSession}
          disabled={isLoading}
          className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:bg-black/10 dark:hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed relative group flex items-center justify-center shrink-0"
          title="Start Live Conversational Audio"
          aria-label="Start Live Session"
        >
          <span className="material-symbols-outlined text-2xl">
            graphic_eq
          </span>
          <span className="absolute top-0 right-0 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
          </span>
        </button>

        {speechSupported && (
          <div className="flex items-center gap-1 border-l border-slate-300/50 dark:border-slate-600/50 pl-1 pr-1">
            <button
              type="button"
              onClick={toggleLanguage}
              className="text-xs font-bold px-1.5 py-1 rounded bg-slate-200/50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              title="Switch dictation language"
              disabled={isLoading || isListening}
            >
              {language === 'fr-FR' ? 'FR' : 'EN'}
            </button>
            <button
              type="button"
              onClick={toggleDictation}
              disabled={isLoading}
              className={`p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed ${isListening
                ? 'bg-red-100/80 dark:bg-red-900/40 text-red-500 dark:text-red-400 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                : 'hover:bg-black/10 dark:hover:bg-white/10 text-slate-600 dark:text-slate-300'
                }`}
              aria-label={isListening ? "Stop listening" : "Start voice input"}
            >
              <span className="material-symbols-outlined text-2xl">
                {isListening ? 'mic_off' : 'mic'}
              </span>
            </button>
          </div>
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
              placeholder={imageFile ? "Describe the image or ask a question..." : "Ask me anything about weather..."}
              className="w-full py-2 px-2 bg-transparent border-none focus:ring-0 resize-none overflow-y-auto max-h-32 
                           text-[15px] sm:text-[16px] text-slate-800 dark:text-slate-100 
                           placeholder-slate-500 dark:placeholder-slate-400 hide-scrollbar"
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
          className="group flex items-center justify-center p-3 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 
                       hover:bg-slate-300 dark:hover:bg-slate-700 
                       focus:outline-none focus:ring-2 focus:ring-slate-400 
                       disabled:bg-slate-100 dark:disabled:bg-slate-800/50
                       disabled:text-slate-400 dark:disabled:text-slate-600
                       disabled:cursor-not-allowed transition-all duration-200 shrink-0 mb-[2px] ml-1"
          aria-label="Send message"
        >
          <SendIcon isLoading={isLoading} />
        </button>
      </form>
    </div>
  );
};
