import { SYSTEM_INSTRUCTION } from './geminiService';

const API_KEY = import.meta.env?.VITE_GEMINI_API_KEY || "AIzaSyC5knS5kLETmp3grQ1lTMjnZRqbJqm26-M";
const HOST = 'generativelanguage.googleapis.com';
const URL = `wss://${HOST}/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

export class LiveApiService {
  private ws: WebSocket | null = null;
  public onAudioReceived: ((pcmData: Uint8Array) => void) | null = null;
  public onTextReceived: ((text: string) => void) | null = null;
  public onConnected: (() => void) | null = null;
  public onDisconnected: (() => void) | null = null;
  public onInterrupted: (() => void) | null = null;

  connect() {
    this.ws = new WebSocket(URL);

    this.ws.onopen = () => {
      console.log("[Live API] Connected");
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
      console.error("[Live API] WebSocket Error:", error);
    };
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
