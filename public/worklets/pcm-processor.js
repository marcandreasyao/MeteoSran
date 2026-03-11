/**
 * AudioWorkletProcessor to capture raw PCM 16-bit audio from the microphone
 * and send it back to the main thread via postMessage.
 * The Gemini Live API expects 16kHz, 16-bit, mono, little-endian PCM.
 */
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (input && input.length > 0) {
      const channelData = input[0];
      // Convert Float32Array [-1.0, 1.0] to Int16Array [-32768, 32767]
      const pcm16 = new Int16Array(channelData.length);
      for (let i = 0; i < channelData.length; i++) {
        let s = Math.max(-1, Math.min(1, channelData[i]));
        // 0x7FFF = 32767. 0x8000 = -32768.
        pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
      }
      
      // Post the 16-bit PCM buffer to the main thread
      // We pass the buffer in the transfer list so it is moved without copying
      this.port.postMessage(pcm16.buffer, [pcm16.buffer]);
    }
    return true; // Keep the processor alive
  }
}

registerProcessor('pcm-processor', PCMProcessor);
