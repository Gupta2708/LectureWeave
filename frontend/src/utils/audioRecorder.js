/**
 * Web Audio API based audio recorder that generates proper WAV files
 * Solves MediaRecorder WebM corruption issues
 */

class AudioRecorder {
  constructor() {
    this.audioContext = null
    this.mediaStream = null
    this.processor = null
    this.isRecording = false
    this.audioChunks = []
    this.sampleRate = 16000 // Whisper-friendly sample rate
    this.onDataAvailable = null
  }

  /**
   * Initialize audio recording
   */
  async initialize() {
    try {
      // Get microphone access with optimized settings for speech recognition
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          echoCancellation: false,    // Disable for better speech clarity
          noiseSuppression: false,    // Disable aggressive processing
          autoGainControl: true,      // Keep automatic gain control
          sampleRate: 48000,          // Request high quality
          sampleSize: 16              // 16-bit samples
        }
      })

      // Create audio context with default sample rate (let browser decide)
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()
      
      // Update our target sample rate to match the context
      this.sampleRate = this.audioContext.sampleRate
      console.log(`🎵 AudioContext created with sample rate: ${this.sampleRate}Hz`)

      console.log('🎤 Audio recorder initialized successfully')
      return true
    } catch (error) {
      console.error('❌ Failed to initialize audio recorder:', error)
      throw error
    }
  }

  /**
   * Start recording audio
   */
  async startRecording(onDataCallback, chunkDurationMs = 20000) {
    if (!this.audioContext || !this.mediaStream) {
      throw new Error('Audio recorder not initialized')
    }

    this.onDataAvailable = onDataCallback
    this.isRecording = true
    this.audioChunks = []

    // Create audio source from microphone
    const source = this.audioContext.createMediaStreamSource(this.mediaStream)
    
    // Create script processor for audio data
    const bufferSize = 4096
    this.processor = this.audioContext.createScriptProcessor(bufferSize, 1, 1)
    
    let audioBuffer = []
    let lastChunkTime = Date.now()

    this.processor.onaudioprocess = (event) => {
      if (!this.isRecording) return

      const inputBuffer = event.inputBuffer
      const inputData = inputBuffer.getChannelData(0)
      
      // Preprocess audio for better quality
      const processedData = this.preprocessAudio(inputData)
      
      // Convert Float32Array to Int16Array with better precision
      const int16Data = new Int16Array(processedData.length)
      for (let i = 0; i < processedData.length; i++) {
        // Improved conversion with dithering to reduce quantization noise
        let sample = processedData[i] * 32767
        
        // Add small amount of dither to reduce quantization artifacts
        const dither = (Math.random() - 0.5) * 0.5
        sample += dither
        
        // Clamp to valid range
        int16Data[i] = Math.max(-32768, Math.min(32767, Math.round(sample)))
      }
      
      audioBuffer.push(int16Data)

      // Check if it's time to send a chunk
      const now = Date.now()
      if (now - lastChunkTime >= chunkDurationMs) {
        this.sendAudioChunk(audioBuffer)
        audioBuffer = []
        lastChunkTime = now
      }
    }

    // Connect audio nodes
    source.connect(this.processor)
    this.processor.connect(this.audioContext.destination)

    console.log('🎵 Recording started with Web Audio API')
  }

  /**
   * Stop recording
   */
  stopRecording() {
    this.isRecording = false
    
    if (this.processor) {
      this.processor.disconnect()
      this.processor = null
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop())
    }

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }

    console.log('🛑 Recording stopped')
  }

  /**
   * Convert audio buffer to WAV and send
   */
  sendAudioChunk(audioBuffer) {
    if (audioBuffer.length === 0) return

    // Calculate total samples
    const totalSamples = audioBuffer.reduce((sum, chunk) => sum + chunk.length, 0)
    
    if (totalSamples === 0) return

    // Combine all chunks into one buffer
    const combinedBuffer = new Int16Array(totalSamples)
    let offset = 0
    for (const chunk of audioBuffer) {
      combinedBuffer.set(chunk, offset)
      offset += chunk.length
    }

    // Resample to 16kHz for Whisper if needed
    const targetSampleRate = 16000
    let finalBuffer = combinedBuffer
    let finalSampleRate = this.sampleRate

    if (this.sampleRate !== targetSampleRate) {
      finalBuffer = this.resampleAudio(combinedBuffer, this.sampleRate, targetSampleRate)
      finalSampleRate = targetSampleRate
      console.log(`🔄 Resampled from ${this.sampleRate}Hz to ${targetSampleRate}Hz`)
    }

    // Generate WAV file
    const wavBlob = this.createWAVBlob(finalBuffer, finalSampleRate)
    
    console.log(`🎵 Generated WAV chunk: ${wavBlob.size} bytes (${finalSampleRate}Hz)`)
    
    if (this.onDataAvailable) {
      this.onDataAvailable(wavBlob)
    }
  }

  /**
   * Preprocess audio for better transcription quality
   */
  preprocessAudio(inputData) {
    const processedData = new Float32Array(inputData.length)
    
    // Step 1: Normalize audio levels
    let maxAmplitude = 0
    for (let i = 0; i < inputData.length; i++) {
      maxAmplitude = Math.max(maxAmplitude, Math.abs(inputData[i]))
    }
    
    const normalizeGain = maxAmplitude > 0 ? 0.8 / maxAmplitude : 1
    
    // Step 2: Apply normalization and simple high-pass filter
    let prevSample = 0
    const highPassAlpha = 0.95 // High-pass filter coefficient
    
    for (let i = 0; i < inputData.length; i++) {
      // Normalize
      let sample = inputData[i] * normalizeGain
      
      // Simple high-pass filter to remove DC offset and low-frequency noise
      const filtered = highPassAlpha * (prevSample + sample - (i > 0 ? inputData[i-1] * normalizeGain : 0))
      prevSample = filtered
      
      // Soft limiting to prevent clipping
      if (Math.abs(filtered) > 0.95) {
        sample = Math.sign(filtered) * (0.95 + 0.05 * Math.tanh((Math.abs(filtered) - 0.95) * 10))
      } else {
        sample = filtered
      }
      
      processedData[i] = sample
    }
    
    return processedData
  }

  /**
   * High-quality resampling with anti-aliasing filter
   */
  resampleAudio(inputBuffer, inputSampleRate, outputSampleRate) {
    if (inputSampleRate === outputSampleRate) {
      return inputBuffer
    }

    const ratio = inputSampleRate / outputSampleRate
    const outputLength = Math.round(inputBuffer.length / ratio)
    const outputBuffer = new Int16Array(outputLength)

    // Simple low-pass filter to prevent aliasing
    const filterSize = 4
    const halfFilter = Math.floor(filterSize / 2)

    for (let i = 0; i < outputLength; i++) {
      const inputIndex = i * ratio
      const inputIndexFloor = Math.floor(inputIndex)
      
      // Apply simple averaging filter for better quality
      let sum = 0
      let count = 0
      
      for (let j = -halfFilter; j <= halfFilter; j++) {
        const sampleIndex = inputIndexFloor + j
        if (sampleIndex >= 0 && sampleIndex < inputBuffer.length) {
          sum += inputBuffer[sampleIndex]
          count++
        }
      }
      
      outputBuffer[i] = count > 0 ? Math.round(sum / count) : 0
    }

    console.log(`🔄 High-quality resampling: ${inputSampleRate}Hz → ${outputSampleRate}Hz`)
    return outputBuffer
  }

  /**
   * Create proper WAV file from audio data
   */
  createWAVBlob(audioData, sampleRate) {
    const length = audioData.length
    const buffer = new ArrayBuffer(44 + length * 2)
    const view = new DataView(buffer)
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i))
      }
    }

    // RIFF chunk descriptor
    writeString(0, 'RIFF')
    view.setUint32(4, 36 + length * 2, true) // File size - 8
    writeString(8, 'WAVE')
    
    // fmt sub-chunk
    writeString(12, 'fmt ')
    view.setUint32(16, 16, true) // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true) // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true) // NumChannels (1 for mono)
    view.setUint32(24, sampleRate, true) // SampleRate
    view.setUint32(28, sampleRate * 2, true) // ByteRate
    view.setUint16(32, 2, true) // BlockAlign
    view.setUint16(34, 16, true) // BitsPerSample
    
    // data sub-chunk
    writeString(36, 'data')
    view.setUint32(40, length * 2, true) // Subchunk2Size
    
    // Write audio data
    let offset = 44
    for (let i = 0; i < length; i++) {
      view.setInt16(offset, audioData[i], true)
      offset += 2
    }
    
    return new Blob([buffer], { type: 'audio/wav' })
  }

  /**
   * Check if Web Audio API is supported
   */
  static isSupported() {
    return !!(window.AudioContext || window.webkitAudioContext)
  }
}

export default AudioRecorder
