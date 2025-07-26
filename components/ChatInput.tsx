import React, { useRef, useState, useEffect, RefObject } from 'react';
import { CurrentInputState } from '../App'; // Import CurrentInputState

interface ChatInputProps {
  onSendMessage: (text: string, imageFile?: File | null) => void;
  isLoading: boolean;
  currentInputState: CurrentInputState;
  setCurrentInputState: (value: CurrentInputState) => void;
  inputRef: RefObject<HTMLTextAreaElement | null>;
}

const SendIcon: React.FC<{isLoading: boolean}> = ({isLoading}) => (
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

export const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isLoading, currentInputState, setCurrentInputState, inputRef }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const { text: currentText, imageFile } = currentInputState;

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
        if(fileInputRef.current) fileInputRef.current.value = "";
        return;
      }
      const maxSize = 4 * 1024 * 1024; 
      if (file.size > maxSize) {
        alert(`File is too large. Maximum size is ${maxSize / (1024*1024)}MB.`);
        if(fileInputRef.current) fileInputRef.current.value = "";
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
    <div className="p-2 sm:p-3 md:p-4 border-t border-white/20 dark:border-slate-700/30 
                    bg-white/10 dark:bg-slate-900/10 backdrop-blur-sm">
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
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 sm:gap-2 md:gap-3 
                     bg-white/40 dark:bg-slate-800/50 
                     rounded-xl sm:rounded-2xl p-0.5 sm:p-1 border border-white/40 dark:border-slate-600/50 
                     focus-within:ring-2 focus-within:ring-blue-500 dark:focus-within:ring-sky-500 
                     transition-all duration-150 shadow-xl backdrop-blur-md"
      >
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
          className="flex items-center justify-center p-2 sm:p-2.5 md:p-3 rounded-full bg-slate-100/80 dark:bg-slate-700/60 shadow hover:bg-slate-200 dark:hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-400 dark:focus:ring-sky-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] min-w-[44px]"
          aria-label="Attach image"
        >
          <span className="material-symbols-outlined text-lg sm:text-xl md:text-2xl text-blue-500 dark:text-sky-400">add_photo_alternate</span>
        </button>
        <textarea
          ref={inputRef}
          value={currentText}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          placeholder={imageFile ? "Describe the image or simply ask a question..." : "Ask me anything about weather..."}
          className="flex-grow p-2 sm:p-2 md:p-3 bg-transparent border-none focus:ring-0 resize-none overflow-y-auto max-h-32 
                     text-sm md:text-base text-slate-800 dark:text-slate-100 
                     placeholder-slate-500 dark:placeholder-slate-400"
          rows={1}
          disabled={isLoading}
          style={{ scrollbarWidth: 'thin' }}
          aria-label="Chat message input"
        />
        <button
          type="submit"
          disabled={isLoading || (!currentText.trim() && !imageFile)}
          className="group flex items-center justify-center p-2 sm:p-2.5 md:p-3 rounded-full bg-blue-500 dark:bg-sky-600 shadow-lg text-white 
                     hover:bg-blue-600 dark:hover:bg-sky-500 
                     focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-sky-500 focus:ring-offset-1 
                     dark:focus:ring-offset-slate-800
                     disabled:bg-slate-400/50 dark:disabled:bg-slate-600/50 
                     disabled:text-slate-500 dark:disabled:text-slate-400
                     disabled:cursor-not-allowed transition-colors duration-150 min-h-[44px] min-w-[44px]"
          aria-label="Send message"
        >
          <SendIcon isLoading={isLoading} />
        </button>
      </form>
    </div>
  );
};
