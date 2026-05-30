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
    const lastActiveTimeRef = useRef<number>(0);

    const onResultRef = useRef(onResult);
    const onEndRef = useRef(onEnd);

    // Keep refs up-to-date to prevent recreating speech recognition instance on callback changes
    useEffect(() => {
        onResultRef.current = onResult;
    }, [onResult]);

    useEffect(() => {
        onEndRef.current = onEnd;
    }, [onEnd]);

    // Audio Analysis Refs
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const animationFrameRef = useRef<number | null>(null);

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

            // Loop from 0 to capture all accumulated transcripts in continuous mode
            for (let i = 0; i < event.results.length; ++i) {
                if (event.results[i].isFinal) {
                    finalTranscript += event.results[i][0].transcript;
                } else {
                    interimTranscript += event.results[i][0].transcript;
                }
            }

            const totalTranscript = finalTranscript + interimTranscript;
            const isFinal = interimTranscript === '';

            onResultRef.current(totalTranscript, isFinal);
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error', event.error);
            if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                setIsListening(false);
                stopAudioAnalysis();
            }
        };

        recognition.onend = () => {
            setIsListening(false);
            stopAudioAnalysis();
            if (onEndRef.current) onEndRef.current();
        };

        recognitionRef.current = recognition;

        return () => {
            recognition.stop();
            stopAudioAnalysis();
        };
    }, [language]);

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

            const startTime = Date.now();
            const ambientSamples: number[] = [];
            let threshold = 18; // Default fallback
            let calibrated = false;

            // Reset active time at the start of analysis
            lastActiveTimeRef.current = Date.now();

            const updateData = () => {
                if (!analyserRef.current) return;
                analyserRef.current.getByteFrequencyData(dataArray);
                setAudioData(new Uint8Array(dataArray));

                // Calculate average volume (rms-like estimate from frequency amplitude)
                let sum = 0;
                for (let i = 0; i < dataArray.length; i++) {
                    sum += dataArray[i];
                }
                const average = dataArray.length > 0 ? sum / dataArray.length : 0;

                const elapsed = Date.now() - startTime;

                if (!calibrated) {
                    if (elapsed < 400) {
                        ambientSamples.push(average);
                    } else {
                        const ambientSum = ambientSamples.reduce((a, b) => a + b, 0);
                        const ambientAverage = ambientSamples.length > 0 ? ambientSum / ambientSamples.length : 10;
                        threshold = Math.max(12, Math.min(25, ambientAverage + 8));
                        calibrated = true;
                        lastActiveTimeRef.current = Date.now();
                        console.log(`[SpeechRecognition] Ambient noise calibrated: avg=${ambientAverage.toFixed(2)}, threshold=${threshold.toFixed(2)}`);
                    }
                } else {
                    // Speech detection comparison
                    if (average > threshold) {
                        lastActiveTimeRef.current = Date.now();
                    } else {
                        const silenceDuration = Date.now() - lastActiveTimeRef.current;
                        if (silenceDuration > 1500) {
                            console.log(`[SpeechRecognition] Auto-stopped due to ${silenceDuration}ms of silence.`);
                            recognitionRef.current?.stop();
                            stopAudioAnalysis();
                            setIsListening(false);
                            return; // Stop animation loop
                        }
                    }
                }

                animationFrameRef.current = requestAnimationFrame(updateData);
            };

            updateData();
        } catch (err) {
            console.error("Error accessing microphone for audio analysis:", err);
        }
    };

    const startListening = useCallback(() => {
        if (!supported || !recognitionRef.current) return;

        try {
            // Start both the speech recognition and the audio analyzer
            recognitionRef.current.start();
            startAudioAnalysis();
            setIsListening(true);
        } catch (e) {
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
