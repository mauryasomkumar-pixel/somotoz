/**
 * Audio Synthesis & WAV Exporter for Somotoz AI Suite
 * Synthesizes harmonic melodies directly into valid 16-bit PCM .WAV audio files
 */

export interface AudioNoteData {
  freq: number;
  duration: number;
  type?: string;
}

/**
 * Generates and downloads a .wav audio file from melodic frequency notes
 */
export function downloadMelodyWav(
  notes: AudioNoteData[],
  promptTitle: string = 'Somotoz Melodic Composition',
  tempoBpm: number = 120
): void {
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;

  // Calculate total sample count
  const totalSeconds = notes.reduce((acc, n) => acc + (n.duration || 0.5), 0) + 0.5; // add 0.5s tail for natural decay
  const totalSamples = Math.ceil(totalSeconds * sampleRate);
  const sampleBuffer = new Float32Array(totalSamples);

  let currentSampleOffset = Math.floor(sampleRate * 0.05); // 50ms initial silence

  notes.forEach((note) => {
    const durationSec = note.duration || 0.5;
    const noteSampleCount = Math.floor(durationSec * sampleRate);
    const freq = note.freq || 440;
    const waveType = note.type || 'sine';

    for (let i = 0; i < noteSampleCount; i++) {
      const idx = currentSampleOffset + i;
      if (idx >= totalSamples) break;

      const t = i / sampleRate;
      let sample = 0;

      // Waveform generation
      if (waveType === 'triangle') {
        sample = (2 / Math.PI) * Math.asin(Math.sin(2 * Math.PI * freq * t));
      } else if (waveType === 'square') {
        sample = Math.sin(2 * Math.PI * freq * t) >= 0 ? 0.7 : -0.7;
      } else if (waveType === 'sawtooth') {
        sample = 2 * (t * freq - Math.floor(0.5 + t * freq));
      } else {
        // Pure Sine with gentle 2nd harmonic
        sample = Math.sin(2 * Math.PI * freq * t) * 0.85 + Math.sin(4 * Math.PI * freq * t) * 0.15;
      }

      // Smooth ADSR Envelope (10% attack, 70% sustain, 20% release)
      const attackSamples = Math.floor(noteSampleCount * 0.1);
      const releaseSamples = Math.floor(noteSampleCount * 0.25);
      let envelope = 1.0;

      if (i < attackSamples) {
        envelope = i / attackSamples;
      } else if (i > noteSampleCount - releaseSamples) {
        envelope = (noteSampleCount - i) / releaseSamples;
      }

      sampleBuffer[idx] += sample * envelope * 0.4;
    }

    currentSampleOffset += noteSampleCount;
  });

  // Encode PCM 16-bit WAV ArrayBuffer
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = totalSamples * (bitsPerSample / 8);
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');

  // fmt chunk
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);

  // data chunk
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM audio samples (clamped to 16-bit signed integer -32768 to 32767)
  let offset = 44;
  for (let i = 0; i < totalSamples; i++) {
    const s = Math.max(-1, Math.min(1, sampleBuffer[i]));
    const int16 = s < 0 ? s * 0x8000 : s * 0x7fff;
    view.setInt16(offset, int16, true);
    offset += 2;
  }

  // Create Blob & Trigger Instant Download
  const blob = new Blob([buffer], { type: 'audio/wav' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const cleanTitle = promptTitle
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .slice(0, 25);
  anchor.download = `somotoz-music-${cleanTitle || 'track'}-${Date.now()}.wav`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/**
 * Downloads note data as JSON/text composition script
 */
export function downloadMelodySheet(
  notes: AudioNoteData[],
  promptTitle: string,
  genre?: string,
  bpm?: number
): void {
  const sheetData = {
    title: promptTitle,
    genre: genre || 'Ambient 432Hz',
    tempoBpm: bpm || 120,
    generatedBy: 'Somotoz AI Suite',
    developer: 'Som Maurya',
    timestamp: new Date().toISOString(),
    notesCount: notes.length,
    compositionNotes: notes.map((n, i) => ({
      step: i + 1,
      frequencyHz: n.freq,
      durationSec: n.duration,
      waveform: n.type || 'sine',
    })),
  };

  const blob = new Blob([JSON.stringify(sheetData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `somotoz-composition-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function writeString(view: DataView, offset: number, string: string): void {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}
