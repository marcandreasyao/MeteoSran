import React, { useEffect, useRef, useState } from 'react';
import { LiveApiService } from '../services/liveApiService';
import { AudioContextService } from '../services/audioContextService';

interface LiveSessionOverlayProps {
  isActive: boolean;
  onClose: () => void;
}

export const LiveSessionOverlay: React.FC<LiveSessionOverlayProps> = ({ isActive, onClose }) => {
  const [status, setStatus] = useState<'connecting' | 'listening' | 'speaking' | 'error'>('connecting');
  const liveApiService = useRef<LiveApiService | null>(null);
  const audioService = useRef<AudioContextService | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isActive) return;

    setStatus('connecting');
    audioService.current = new AudioContextService();
    liveApiService.current = new LiveApiService();

    liveApiService.current.onConnected = async () => {
      try {
        await audioService.current?.startRecording((pcmData: ArrayBuffer) => {
          liveApiService.current?.sendAudioChunk(pcmData);
        });
        setStatus('listening');
      } catch (err) {
        console.error("Failed to start recording:", err);
        setStatus('error');
      }
    };

    liveApiService.current.onDisconnected = () => {
      onClose();
    };

    liveApiService.current.onAudioReceived = (pcmData: Uint8Array) => {
      setStatus('speaking');
      audioService.current?.playAudioChunk(pcmData);
      
      // Auto-revert to listening after 500ms of no audio chunks received
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = setTimeout(() => {
        setStatus('listening');
      }, 500);
    };
    
    liveApiService.current.onInterrupted = () => {
      audioService.current?.stopPlayback();
      setStatus('listening');
    };

    liveApiService.current.connect();

    return () => {
      if (speakingTimeoutRef.current) clearTimeout(speakingTimeoutRef.current);
      audioService.current?.stopRecording();
      liveApiService.current?.disconnect();
    };
  }, [isActive, onClose]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/60 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md p-8 rounded-3xl bg-white/10 dark:bg-slate-800/40 border border-white/20 shadow-2xl flex flex-col items-center gap-8 relative overflow-hidden">
        
        {/* Animated Background gradients depending on status */}
        <div className={`absolute inset-0 opacity-30 transition-all duration-1000 ${
            status === 'connecting' ? 'bg-gradient-to-tr from-yellow-500/40 to-orange-500/40 animate-pulse' :
            status === 'speaking' ? 'bg-gradient-to-tr from-sky-400/50 to-indigo-500/50 animate-pulse' :
            status === 'error' ? 'bg-gradient-to-tr from-red-500/50 to-rose-600/50' :
            'bg-gradient-to-tr from-emerald-400/30 to-teal-500/30' // listening
        }`} />

        <div className="z-10 text-center space-y-2">
            <h2 className="text-2xl font-bold text-white tracking-tight">MeteoSran Live</h2>
            <p className="text-slate-300 text-sm">
                {status === 'connecting' && "Connecting to Gemini 2.5 Live API..."}
                {status === 'listening' && "Listening... Talk to MeteoSran."}
                {status === 'speaking' && "MeteoSran is speaking..."}
                {status === 'error' && "Microphone or Connection Error."}
            </p>
        </div>

        {/* Pulsating Orb */}
        <div className="relative z-10 w-32 h-32 flex items-center justify-center">
            {status !== 'error' && (
                <div className={`absolute inset-0 rounded-full bg-white/20 ${
                    status === 'speaking' ? 'animate-[ping_1.5s_cubic-bezier(0,0,0.2,1)_infinite]' :
                    status === 'listening' ? 'animate-[ping_3s_cubic-bezier(0,0,0.2,1)_infinite]' : ''
                }`} />
            )}
            <div className={`w-24 h-24 rounded-full shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-500 flex items-center justify-center
                ${status === 'speaking' ? 'bg-gradient-to-br from-sky-400 to-indigo-600 scale-110' :
                  status === 'listening' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 scale-100' :
                  status === 'connecting' ? 'bg-gradient-to-br from-yellow-400 to-orange-500 scale-90' :
                  'bg-gradient-to-br from-red-500 to-rose-600'}
            `}>
                <span className="material-symbols-outlined text-white text-4xl">
                    {status === 'speaking' ? 'graphic_eq' : 
                     status === 'listening' ? 'mic' : 
                     status === 'connecting' ? 'sync' : 'error'}
                </span>
            </div>
        </div>

        <button
            onClick={onClose}
            className="z-10 mt-4 px-8 py-3 rounded-full bg-white/10 hover:bg-red-500/80 hover:text-white border border-white/20 text-slate-200 transition-all font-medium backdrop-blur-sm flex items-center gap-2"
        >
            <span className="material-symbols-outlined text-xl">call_end</span>
            End Session
        </button>
      </div>
    </div>
  );
};
