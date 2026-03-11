export class AudioContextService {
  private recordingContext: AudioContext | null = null;
  private playbackContext: AudioContext | null = null;
  private microphoneInput: MediaStreamAudioSourceNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private stream: MediaStream | null = null;
  
  // Track consecutive chunks to play them seamlessly without gaps
  private playbackTime: number = 0;

  async startRecording(onChunk: (pcm16Data: ArrayBuffer) => void) {
    // 1. Initialize recording context
    if (!this.recordingContext) {
      this.recordingContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 16000, // Important: Gemini requires 16000Hz PCM
      });
      // Load the AudioWorklet processor we created earlier
      await this.recordingContext.audioWorklet.addModule('/worklets/pcm-processor.js');
    }

    if (this.recordingContext.state === 'suspended') {
      await this.recordingContext.resume();
    }

    // 2. Request microphone stream
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: {
       echoCancellation: true,
       noiseSuppression: true,
       autoGainControl: true,
    } });

    // 3. Connect microphone to Worklet
    this.microphoneInput = this.recordingContext.createMediaStreamSource(this.stream);
    this.workletNode = new AudioWorkletNode(this.recordingContext, 'pcm-processor');

    this.workletNode.port.onmessage = (event) => {
      // event.data is the ArrayBuffer holding 16-bit PCM sent from worklet
      onChunk(event.data);
    };

    this.microphoneInput.connect(this.workletNode);
    // Connect worklet to destination so it processes, but its outputs are silent anyway
    this.workletNode.connect(this.recordingContext.destination);
  }

  stopRecording() {
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    if (this.microphoneInput) {
      this.microphoneInput.disconnect();
      this.microphoneInput = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
  }

  async playAudioChunk(pcmData: Uint8Array) {
    // 1. Initialize playback context on demand
    if (!this.playbackContext) {
      this.playbackContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: 24000, // Gemini responds with 24000Hz PCM
      });
    }

    if (this.playbackContext.state === 'suspended') {
      await this.playbackContext.resume();
    }

    // 2. Decode raw 16-bit little-endian PCM into Float32Array for Web Audio API
    // Uint8Array -> Int16Array
    const pcm16 = new Int16Array(pcmData.buffer, pcmData.byteOffset, pcmData.byteLength / 2);
    
    // Create an AudioBuffer (1 channel, sample rate = 24kHz)
    const audioBuffer = this.playbackContext.createBuffer(1, pcm16.length, 24000);
    const channelData = audioBuffer.getChannelData(0);
    
    // Convert 16-bit integer back to float range [-1.0, 1.0]
    for (let i = 0; i < pcm16.length; i++) {
        channelData[i] = pcm16[i] / 32768.0;
    }

    // 3. Schedule the buffer for playback
    const source = this.playbackContext.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(this.playbackContext.destination);

    const currentTime = this.playbackContext.currentTime;
    // If the queue is running behind, jump to current time
    if (this.playbackTime < currentTime) {
        this.playbackTime = currentTime;
    }

    source.start(this.playbackTime);
    this.playbackTime += audioBuffer.duration;
  }

  // Use this if Gemini interrupts itself or user overrides ("barge-in")
  stopPlayback() {
     if (this.playbackContext) {
        // Suspend the context to stop playing immediately and reset the queue time
        this.playbackContext.suspend();
        this.playbackContext.close();
        this.playbackContext = null;
        this.playbackTime = 0;
     }
  }
}
