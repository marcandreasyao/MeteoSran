import { SYSTEM_INSTRUCTION } from './geminiService';

const GEMINI_KEYS: string[] = [];
for (let i = 1; i <= 10; i++) {
  const key = (import.meta.env as any)[`VITE_GEMINI_API_KEY_${i}`];
  if (key) GEMINI_KEYS.push(key);
}
// Fallback to original key if no numbered keys are found
if (GEMINI_KEYS.length === 0 && import.meta.env?.VITE_GEMINI_API_KEY) {
  GEMINI_KEYS.push(import.meta.env.VITE_GEMINI_API_KEY);
}

const HOST = 'generativelanguage.googleapis.com';

export class LiveApiService {
  private ws: WebSocket | null = null;
  private currentKeyIndex = 0;
  private reconnectAttempts = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 3;

  public onAudioReceived: ((pcmData: Uint8Array) => void) | null = null;
  public onTextReceived: ((text: string) => void) | null = null;
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onInterrupted: (() => void) | null = null;

  connect() {
    if (GEMINI_KEYS.length === 0) {
      console.error("[Live API] No Gemini API keys found for rotation.");
      return;
    }

    const key = GEMINI_KEYS[this.currentKeyIndex];
    const url = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${key}`;
    
    console.log(`[Live API] Connecting with key ${this.currentKeyIndex + 1}/${GEMINI_KEYS.length}...`);
    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      console.log(`[Live API] Connected successfully using key ${this.currentKeyIndex + 1}`);
      this.reconnectAttempts = 0; // Reset attempts on successful connection
      this.sendSetup();
      this.onConnected?.();
    };

    this.ws.onmessage = async (event) => {
      try {
        let data;
        if (event.data instanceof Blob) {
          const text = await event.data.text();
          data = JSON.parse(text);
        } else {
          data = JSON.parse(event.data);
        }

        // BidiGenerateContent returns a variety of messages:
        // serverContent -> contains model turns and audio parts
        if (data.serverContent) {

          // Handle Barge-in interruption
          if (data.serverContent.interrupted) {
            console.log("[Live API] Model interrupted by user speech.");
            this.onInterrupted?.();
          }

          // Handle incoming audio stream from Gemini
          if (data.serverContent.modelTurn) {
            const parts = data.serverContent.modelTurn.parts;
            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                // Decode base64 audio (24kHz PCM)
                const binaryString = window.atob(part.inlineData.data);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                this.onAudioReceived?.(bytes);
              }
              if (part.text) {
                this.onTextReceived?.(part.text);
              }
            }
          }
        }
      } catch (e) {
        console.error("[Live API] Error parsing message:", e);
      }
    };

    this.ws.onclose = (event) => {
      console.log("[Live API] Disconnected", event.code, event.reason);
      this.onDisconnected?.();
    };

    this.ws.onerror = (error) => {
      console.error(`[Live API] WebSocket Error with key ${this.currentKeyIndex + 1}:`, error);
      
      // If we haven't connected yet, or if it closed unexpectedly, try rotating
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.rotateAndReconnect();
      }
    };
  }

  private rotateAndReconnect() {
    this.ws = null;

    if (this.currentKeyIndex < GEMINI_KEYS.length - 1) {
      this.currentKeyIndex++;
      console.log(`[Live API] Rotating to key ${this.currentKeyIndex + 1}...`);
      this.connect();
    } else if (this.reconnectAttempts < this.MAX_RECONNECT_ATTEMPTS) {
      // If all keys exhausted, start over from the first one after a delay (up to MAX_RECONNECT_ATTEMPTS)
      this.reconnectAttempts++;
      this.currentKeyIndex = 0;
      console.log(`[Live API] All keys exhausted. Retry attempt ${this.reconnectAttempts}/${this.MAX_RECONNECT_ATTEMPTS} starting from key 1 in 2s...`);
      setTimeout(() => this.connect(), 2000);
    } else {
      console.error("[Live API] Maximum reconnect attempts reached. Please check your API keys and network connection.");
    }
  }

  private sendSetup() {
    // Setup message with the MeteoSran persona 
    const setupMessage = {
      setup: {
        // Use Gemini 2.5 Flash because it officially supports Native Audio Dialogs
        model: "models/gemini-2.0-flash",
        generationConfig: {
          responseModalities: ["AUDIO"], // We want voice back!
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                // Friendly, engaging voice fits MeteoSran.
                // Other options: Puck, Charon, Kore, Fenrir, Leto
                voiceName: "Aoede"
              }
            }
          }
        },
        systemInstruction: {
          parts: [{ text: SYSTEM_INSTRUCTION }]
        }
      }
    };
    this.ws?.send(JSON.stringify(setupMessage));
  }

  sendAudioChunk(pcm16Data: ArrayBuffer) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;

    // Fast ArrayBuffer to Base64 natively
    let binary = '';
    const bytes = new Uint8Array(pcm16Data);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    const base64 = window.btoa(binary);

    const message = {
      realtimeInput: {
        mediaChunks: [{
          mimeType: "audio/pcm;rate=16000",
          data: base64
        }]
      }
    };
    this.ws.send(JSON.stringify(message));
  }

  sendTextMessage(text: string) {
    if (this.ws?.readyState !== WebSocket.OPEN) return;
    const message = {
      clientContent: {
        turns: [{
          role: "user",
          parts: [{ text }]
        }],
        turnComplete: true
      }
    };
    this.ws.send(JSON.stringify(message));
  }

  disconnect() {
    this.ws?.close();
    this.ws = null;
  }
}
