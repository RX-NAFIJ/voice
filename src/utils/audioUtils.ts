import lamejs from 'lamejs';

/**
 * Convert base64 audio string to ArrayBuffer
 */
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Convert ArrayBuffer or Blob to base64 string
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // remove data:audio/...;base64, prefix if present
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

/**
 * Convert AudioBuffer to 16-bit PCM WAV Blob
 */
export function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels: Float32Array[] = [];
  let sampleRate = buffer.sampleRate;
  let offset = 0;
  let pos = 0;

  function setUint16(data: number) {
    out.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // write WAVE header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(sampleRate);
  setUint32(sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      let sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

/**
 * Encode an AudioBuffer into MP3 Blob using lamejs
 */
export function audioBufferToMp3(buffer: AudioBuffer, kbps = 128): Blob {
  const channels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const mp3encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];

  const left = buffer.getChannelData(0);
  const leftInt16 = new Int16Array(left.length);
  for (let i = 0; i < left.length; i++) {
    const s = Math.max(-1, Math.min(1, left[i]));
    leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  let rightInt16: Int16Array | undefined = undefined;
  if (channels > 1) {
    const right = buffer.getChannelData(1);
    rightInt16 = new Int16Array(right.length);
    for (let i = 0; i < right.length; i++) {
      const s = Math.max(-1, Math.min(1, right[i]));
      rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  const sampleBlockSize = 1152;
  for (let i = 0; i < leftInt16.length; i += sampleBlockSize) {
    const leftChunk = leftInt16.subarray(i, i + sampleBlockSize);
    let mp3buf: Int8Array;
    if (channels === 2 && rightInt16) {
      const rightChunk = rightInt16.subarray(i, i + sampleBlockSize);
      mp3buf = mp3encoder.encodeBuffer(leftChunk, rightChunk);
    } else {
      mp3buf = mp3encoder.encodeBuffer(leftChunk);
    }
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
    }
  }

  const mp3buf = mp3encoder.flush();
  if (mp3buf.length > 0) {
    mp3Data.push(new Uint8Array(mp3buf.buffer, mp3buf.byteOffset, mp3buf.length));
  }

  return new Blob(mp3Data as BlobPart[], { type: 'audio/mp3' });
}

/**
 * Render AudioBuffer with custom speed and pitch shift (in semitones)
 * using Web Audio OfflineAudioContext
 */
export async function renderProcessedAudio(
  originalBuffer: AudioBuffer,
  speed: number = 1.0,
  pitchSemitones: number = 0
): Promise<AudioBuffer> {
  // If speed and pitch are default, return original
  if (Math.abs(speed - 1.0) < 0.01 && Math.abs(pitchSemitones) < 0.1) {
    return originalBuffer;
  }

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  
  // Speed alters duration inversely
  const targetDuration = originalBuffer.duration / Math.max(0.2, speed);
  const sampleRate = originalBuffer.sampleRate;
  const offlineCtx = new OfflineAudioContext(
    originalBuffer.numberOfChannels,
    Math.ceil(targetDuration * sampleRate),
    sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = originalBuffer;

  // playbackRate controls speed
  source.playbackRate.value = speed;

  // detune is in cents (1 semitone = 100 cents)
  // To allow pitch shift independent of speed, detune applies
  if (pitchSemitones !== 0) {
    source.detune.value = pitchSemitones * 100;
  }

  source.connect(offlineCtx.destination);
  source.start(0);

  const renderedBuffer = await offlineCtx.startRendering();
  audioCtx.close();
  return renderedBuffer;
}

/**
 * Trigger file download in browser
 */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Browser Web Speech API fallback for Bengali voice
 */
export function speakWithBrowserSynthesis(
  text: string,
  speed: number = 1.0,
  pitch: number = 1.0,
  voicePreference: 'male' | 'female' = 'male'
): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!('speechSynthesis' in window)) {
      reject(new Error('Browser Speech Synthesis is not supported'));
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = Math.min(2.0, Math.max(0.5, speed));
    utterance.pitch = Math.min(2.0, Math.max(0.5, pitch));

    // Try finding Bengali voice
    const voices = window.speechSynthesis.getVoices();
    const bengaliVoice = voices.find(
      (v) => v.lang.startsWith('bn') || v.name.toLowerCase().includes('bengali') || v.name.toLowerCase().includes('bangla')
    );

    if (bengaliVoice) {
      utterance.voice = bengaliVoice;
      utterance.lang = bengaliVoice.lang;
    } else {
      // Default to general voice
      const preferred = voices.find((v) =>
        voicePreference === 'female'
          ? v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('girl') || v.name.toLowerCase().includes('zira')
          : v.name.toLowerCase().includes('male') || v.name.toLowerCase().includes('david')
      );
      if (preferred) utterance.voice = preferred;
      utterance.lang = 'bn-BD';
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => reject(e);

    window.speechSynthesis.speak(utterance);
  });
}
