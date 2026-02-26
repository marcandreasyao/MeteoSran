import { useState, useEffect, useRef, useCallback } from 'react';

export interface SpeechRecognitionResult {
    text: string;
    isListening: boolean;
    supported: boolean;
    audioData: Uint8Array | null; // Frequency data for the visualizer
    language: 'fr-FR' | 'en-US';
}

interface UseSpeechRecognitionProps {
    onResult: (text: string, isFinal: boolean) => void;
    onEnd?: () => void;
}

export const useSpeechRecognition = ({ onResult, onEnd }: UseSpeechRecognitionProps) => {
    const [isListening, setIsListening] = useState(false);
    const [supported, setSupported] = useState(true);
    const [language, setLanguage] = useState<'fr-FR' | 'en-US'>('fr-FR');
    const [audioData, setAudioData] = useState<Uint8Array | null>(null);

    const recognitionRef = useRef<any>(null);

    // Audio Analysis Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

    useEffect(() => {
        // Check for browser support
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (!SpeechRecognition) {
            setSupported(false);
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = language;

        recognition.onresult = (event: any) => {
            let interimTranscript = '';
            let finalTranscript = '';

            for (let i = event.resultIndex; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            // If we have a final result, pass it and true.
            // If only interim, pass it and false.
            if (finalTranscript) {
                onResult(finalTranscript, true);
            } else if (interimTranscript) {
                onResult(interimTranscript, false);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsListening(false);
                stopAudioAnalysis();
            }
        };

        recognition.onend = () => {
            // Speech recognition stops automatically sometimes (e.g., silence).
            // We need to sync our state.
            setIsListening(false);
            stopAudioAnalysis();
            if (onEnd) onEnd();
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            stopAudioAnalysis();
        };
    }, [language, onResult, onEnd]);

    // Update language of instance if it changes
    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = language;
        }
    }, [language]);

    const startAudioAnalysis = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            audioContextRef.current = audioContext;

            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256; // Defines how many frequency bins we get
            analyser.smoothingTimeConstant = 0.8;
            analyserRef.current = analyser;

            const source = audioContext.createMediaStreamSource(stream);
            source.connect(analyser);
            sourceRef.current = source;

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const updateData = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                // Create a new array reference so React detects the state change
                setAudioData(new Uint8Array(dataArray));
                animationFrameRef.current = requestAnimationFrame(updateData);
            };

            updateData();
        } catch (err) {
            console.error("Error accessing microphone for audio analysis:", err);
        }
    };

    const stopAudioAnalysis = () => {
        if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
            audioContextRef.current = null;
        }
        setAudioData(null);
    };

    const startListening = useCallback(() => {
        if (!supported || !recognitionRef.current) return;

        try {
            // Start both the speech recognition and the audio analyzer
            recognitionRef.current.start();
            startAudioAnalysis();
            setIsListening(true);
        } catch (e) {
            // Catch DOMException if already started
            console.error("Recognition couldn't start", e);
        }
    }, [supported]);

    const stopListening = useCallback(() => {
        if (!supported || !recognitionRef.current) return;
        recognitionRef.current.stop();
        stopAudioAnalysis();
        setIsListening(false);
    }, [supported]);

    const toggleLanguage = useCallback(() => {
        setLanguage(prev => prev === 'fr-FR' ? 'en-US' : 'fr-FR');
    }, []);

    return {
        isListening,
        supported,
        audioData,
        language,
        startListening,
        stopListening,
        toggleLanguage
    };
};
