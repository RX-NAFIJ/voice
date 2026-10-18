import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Download,
  RotateCcw,
  Volume2,
  VolumeX,
  Copy,
  Check,
  FileAudio,
  Sparkles,
} from 'lucide-react';
import {
  audioBufferToMp3,
  audioBufferToWav,
  downloadBlob,
  renderProcessedAudio,
} from '../utils/audioUtils';

interface AudioPlayerProps {
  audioBuffer: AudioBuffer | null;
  rawBase64: string | null;
  spokenText: string;
  voiceName: string;
  emotion: string;
  speed: number;
  pitch: number;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioBuffer,
  rawBase64,
  spokenText,
  voiceName,
  emotion,
  speed,
  pitch,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLooping, setIsLooping] = useState(false);
  const [isDownloadingMp3, setIsDownloadingMp3] = useState(false);
  const [isDownloadingWav, setIsDownloadingWav] = useState(false);
  const [copied, setCopied] = useState(false);

  // Web Audio Context refs
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const pauseOffsetRef = useRef<number>(0);
  const animFrameRef = useRef<number | null>(null);

  // Clean up audio on unmount or audioBuffer change
  const stopAudio = () => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
        sourceNodeRef.current.disconnect();
      } catch {
        // already stopped
      }
      sourceNodeRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    setIsPlaying(false);
  };

  useEffect(() => {
    stopAudio();
    pauseOffsetRef.current = 0;
    setCurrentTime(0);

    if (audioBuffer) {
      // Adjusted duration based on speed
      const adjustedDuration = audioBuffer.duration / speed;
      setDuration(adjustedDuration);
    } else {
      setDuration(0);
    }

    return () => {
      stopAudio();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [audioBuffer, speed, pitch]);

  const getAudioContext = () => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  };

  const playFromOffset = (offsetSeconds: number) => {
    if (!audioBuffer) return;
    const ctx = getAudioContext();
    stopAudio();

    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.playbackRate.value = speed;
    if (pitch !== 0) {
      source.detune.value = pitch * 100;
    }
    source.loop = isLooping;

    const gain = ctx.createGain();
    gain.gain.value = isMuted ? 0 : volume;
    gainNodeRef.current = gain;

    source.connect(gain);
    gain.connect(ctx.destination);
    sourceNodeRef.current = source;

    // Buffer offset in original audio timeline: offsetSeconds * speed
    const bufferOffset = Math.min(audioBuffer.duration - 0.05, Math.max(0, offsetSeconds * speed));
    source.start(0, bufferOffset);
    startTimeRef.current = ctx.currentTime - offsetSeconds;
    pauseOffsetRef.current = offsetSeconds;
    setIsPlaying(true);

    source.onended = () => {
      if (!isLooping) {
        setIsPlaying(false);
        pauseOffsetRef.current = 0;
        setCurrentTime(0);
      }
    };

    const updateProgress = () => {
      if (!sourceNodeRef.current) return;
      const effectiveDuration = audioBuffer.duration / speed;
      const elapsed = ctx.currentTime - startTimeRef.current;

      if (elapsed >= effectiveDuration) {
        if (isLooping) {
          startTimeRef.current = ctx.currentTime;
          setCurrentTime(0);
          animFrameRef.current = requestAnimationFrame(updateProgress);
        } else {
          setCurrentTime(effectiveDuration);
          setIsPlaying(false);
          pauseOffsetRef.current = 0;
        }
      } else {
        setCurrentTime(elapsed);
        animFrameRef.current = requestAnimationFrame(updateProgress);
      }
    };

    animFrameRef.current = requestAnimationFrame(updateProgress);
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      if (audioCtxRef.current) {
        pauseOffsetRef.current = currentTime;
      }
      stopAudio();
    } else {
      playFromOffset(pauseOffsetRef.current);
    }
  };

  const handleSeek = (newTime: number) => {
    pauseOffsetRef.current = newTime;
    setCurrentTime(newTime);
    if (isPlaying) {
      playFromOffset(newTime);
    }
  };

  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(
        nextMuted ? 0 : volume,
        audioCtxRef.current.currentTime
      );
    }
  };

  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(false);
    if (gainNodeRef.current && audioCtxRef.current) {
      gainNodeRef.current.gain.setValueAtTime(newVol, audioCtxRef.current.currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const s = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Download Handlers
  const handleDownloadMp3 = async () => {
    if (!audioBuffer) return;
    try {
      setIsDownloadingMp3(true);
      // Process audio with user speed & pitch settings
      const processedBuffer = await renderProcessedAudio(audioBuffer, speed, pitch);
      const mp3Blob = audioBufferToMp3(processedBuffer, 192);
      const filename = `RX_NAFIJ_${voiceName.replace(/\s+/g, '_')}_${Date.now()}.mp3`;
      downloadBlob(mp3Blob, filename);
    } catch (err) {
      console.error('Failed to encode MP3:', err);
      alert('Could not encode MP3. Downloading WAV format instead.');
      handleDownloadWav();
    } finally {
      setIsDownloadingMp3(false);
    }
  };

  const handleDownloadWav = async () => {
    if (!audioBuffer) return;
    try {
      setIsDownloadingWav(true);
      const processedBuffer = await renderProcessedAudio(audioBuffer, speed, pitch);
      const wavBlob = audioBufferToWav(processedBuffer);
      const filename = `RX_NAFIJ_${voiceName.replace(/\s+/g, '_')}_${Date.now()}.wav`;
      downloadBlob(wavBlob, filename);
    } catch (err) {
      console.error('Failed to export WAV:', err);
    } finally {
      setIsDownloadingWav(false);
    }
  };

  const handleCopyText = () => {
    if (!spokenText) return;
    navigator.clipboard.writeText(spokenText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!audioBuffer) {
    return null;
  }

  // Waveform bar heights generator
  const progressRatio = duration > 0 ? currentTime / duration : 0;
  const barCount = 42;

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-b from-purple-900/10 via-slate-900/40 to-slate-900/80 dark:from-purple-950/40 dark:via-slate-950/70 dark:to-slate-950/90 border border-purple-500/20 dark:border-purple-500/30 shadow-2xl backdrop-blur-2xl space-y-4">
      {/* Top Details Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-500/10 dark:border-purple-500/20 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
              <span>{voiceName}</span>
              <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300">
                {emotion}
              </span>
              {speed !== 1.0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {speed.toFixed(2)}x
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Bengali High-Definition AI Audio
            </p>
          </div>
        </div>

        {/* Copy text action */}
        <button
          type="button"
          onClick={handleCopyText}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 border border-slate-200 dark:border-slate-700 transition-colors shadow-sm"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span>কপি সম্পন্ন!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>টেক্সট কপি</span>
            </>
          )}
        </button>
      </div>

      {/* Spoken Text Preview Quote */}
      <div className="p-3 rounded-2xl bg-white/60 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800/50">
        <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 font-bengali leading-relaxed italic">
          "{spokenText}"
        </p>
      </div>

      {/* ElevenLabs Visual Interactive Waveform */}
      <div className="space-y-1.5">
        <div
          className="h-16 flex items-center justify-between gap-1 px-3 rounded-2xl bg-slate-950/20 dark:bg-slate-950/60 border border-purple-500/10 cursor-pointer overflow-hidden relative group"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickRatio = Math.max(0, Math.min(1, clickX / rect.width));
            handleSeek(clickRatio * duration);
          }}
        >
          {Array.from({ length: barCount }).map((_, i) => {
            const barRatio = i / barCount;
            const isPlayed = barRatio <= progressRatio;
            // Generate aesthetic waveform height variation
            const seed = (Math.sin(i * 0.45) * 0.5 + 0.5) * 0.8 + 0.2;
            const heightPercent = Math.max(15, Math.min(95, seed * 100));

            return (
              <div
                key={i}
                className="flex-1 flex items-center justify-center h-full"
              >
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full max-w-[5px] rounded-full transition-all duration-75 ${
                    isPlayed
                      ? 'bg-gradient-to-t from-purple-600 to-indigo-400 shadow-sm shadow-purple-500/50 scale-y-105'
                      : 'bg-slate-300 dark:bg-slate-700/60 group-hover:bg-slate-400 dark:group-hover:bg-slate-600'
                  } ${isPlaying && isPlayed ? 'animate-pulse' : ''}`}
                />
              </div>
            );
          })}
        </div>

        {/* Time Progress */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-mono px-1">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* Primary Player Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          {/* Main Play/Pause Button */}
          <button
            type="button"
            onClick={handlePlayPause}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center hover:shadow-lg hover:shadow-purple-500/30 hover:scale-105 transition-all cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current translate-x-0.5" />
            )}
          </button>

          {/* Replay */}
          <button
            type="button"
            onClick={() => handleSeek(0)}
            title="Replay from beginning"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-purple-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Loop Toggle */}
          <button
            type="button"
            onClick={() => setIsLooping(!isLooping)}
            title={isLooping ? 'Looping enabled' : 'Looping disabled'}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              isLooping
                ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700'
                : 'text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-800'
            }`}
          >
            Loop
          </button>

          {/* Volume Control */}
          <div className="hidden sm:flex items-center gap-1.5 pl-2 border-l border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleToggleMute}
              className="p-1 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4 text-rose-500" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
              className="w-16 accent-purple-600 h-1 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* Download Buttons */}
        <div className="flex items-center gap-2">
          {/* Prominent Download MP3 Button */}
          <button
            type="button"
            onClick={handleDownloadMp3}
            disabled={isDownloadingMp3}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-purple-500/25 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingMp3 ? 'MP3 তৈরি হচ্ছে...' : 'Download MP3'}</span>
          </button>

          {/* Download WAV button */}
          <button
            type="button"
            onClick={handleDownloadWav}
            disabled={isDownloadingWav}
            title="Download uncompressed Studio WAV"
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-700 font-semibold text-xs transition-all shadow-sm"
          >
            <FileAudio className="w-3.5 h-3.5 text-purple-500" />
            <span className="hidden sm:inline">WAV</span>
          </button>
        </div>
      </div>
    </div>
  );
};
