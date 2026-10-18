import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Upload,
  Sparkles,
  Info,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  Trash2,
  X,
  Volume2,
  Gauge,
  Sliders,
  ShieldCheck,
  FileAudio,
} from 'lucide-react';
import { VoiceOption } from '../data/voices';
import { blobToBase64, base64ToArrayBuffer, audioBufferToWav } from '../utils/audioUtils';

interface VoiceCloningModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveClonedVoice: (voice: VoiceOption) => void;
}

export const VoiceCloningModal: React.FC<VoiceCloningModalProps> = ({
  isOpen,
  onClose,
  onSaveClonedVoice,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [voiceName, setVoiceName] = useState('');
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isLoadingDemo, setIsLoadingDemo] = useState(false);
  const [clonedResult, setClonedResult] = useState<VoiceOption | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audio playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<number | null>(null);

  // Clean up on close
  useEffect(() => {
    if (!isOpen) {
      if (isRecording) stopRecording();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      setAudioDuration(0);
      setClonedResult(null);
      setErrorMsg(null);
      setVoiceName('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|m4a|ogg|webm)$/i)) {
      setErrorMsg('অনুগ্রহ করে একটি অডিও ফাইল (.mp3, .wav, .m4a, .ogg) নির্বাচন করুন।');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('ফাইল সাইজ খুব বড়। ২৫ মেগাবাইটের কম সাইজের অডিও দিন।');
      return;
    }

    const url = URL.createObjectURL(file);
    setAudioBlob(file);
    setAudioUrl(url);
    if (!voiceName) {
      const suggested = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setVoiceName(suggested);
    }

    // Read duration
    const tempAudio = new Audio(url);
    tempAudio.onloadedmetadata = () => {
      setAudioDuration(tempAudio.duration);
    };
  };

  // Live recording handlers
  const startRecording = async () => {
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setErrorMsg(
          'আপনার ব্রাউজার বা আইফ্রেম পরিবেশে সরাসরি মাইক্রোফোন রেকর্ডিং সমর্থিত নয়। অনুগ্রহ করে উপরের "অডিও ফাইল আপলোড" ট্যাব ব্যবহার করুন।'
        );
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      recordChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mimeType = mediaRecorder.mimeType || 'audio/webm';
        const blob = new Blob(recordChunksRef.current, { type: mimeType });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
        setAudioDuration(recordSeconds);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordSeconds(0);

      recordTimerRef.current = window.setInterval(() => {
        setRecordSeconds((prev) => {
          if (prev >= 60) {
            stopRecording();
            return 60;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err: any) {
      console.warn('Microphone permission not granted or blocked by browser/iframe:', err?.name || err?.message);
      setErrorMsg(
        'মাইক্রোফোন পারমিশন ব্লক রয়েছে বা পাওয়া যায়নি। আপনি সহজেই যেকোনো অডিও ফাইল (MP3/WAV) আপলোড করতে পারেন অথবা নিচে নমুনা অডিও নির্বাচন করতে পারেন।'
      );
    }
  };

  const stopRecording = () => {
    if (recordTimerRef.current) {
      clearInterval(recordTimerRef.current);
      recordTimerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const togglePreviewPlay = () => {
    if (!audioPreviewRef.current) return;
    if (isPlaying) {
      audioPreviewRef.current.pause();
      setIsPlaying(false);
    } else {
      audioPreviewRef.current.play();
      setIsPlaying(true);
    }
  };

  // Instant demo audio loader (allows testing cloning even if mic is blocked)
  const handleLoadDemoSample = async (type: 'male' | 'female') => {
    try {
      setIsLoadingDemo(true);
      setErrorMsg(null);
      const sampleText =
        type === 'male'
          ? 'নমস্কার, আমি বাংলায় কথা বলছি। এটি আরএক্স নাফিজ এআই ভয়েস ক্লোনিং সিস্টেমের জন্য একটি প্রাকৃতিক বাংলা অডিও নমুনা।'
          : 'আসসালামু আলাইকুম, আমি বাংলায় কথা বলতে ভালোবাসি। এটি মিষ্টি এবং সুস্পষ্ট উচ্চারণের একটি এআই বাংলা ভয়েস নমুনা।';

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: sampleText,
          voiceId: type === 'male' ? 'male' : 'female',
          voiceName: type === 'male' ? 'Fenrir' : 'Kore',
          emotion: 'happy',
          language: 'bn',
        }),
      });

      if (!res.ok) {
        throw new Error('নমুনা অডিও তৈরি করা সম্ভব হয়নি');
      }

      const data = await res.json();
      if (!data.audioBase64) {
        throw new Error('অডিও ডাটা পাওয়া যায়নি');
      }

      const arrayBuffer = base64ToArrayBuffer(data.audioBase64);
      const blob = new Blob([arrayBuffer], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      setAudioBlob(blob);
      setAudioUrl(url);
      setAudioDuration(8);
      setVoiceName(
        type === 'male' ? 'নমুনা পুরুষ কণ্ঠ (Demo Male)' : 'নমুনা নারী কণ্ঠ (Demo Female)'
      );
    } catch (err: any) {
      setErrorMsg('নমুনা অডিও লোড করতে সমস্যা হয়েছে: ' + (err.message || 'Error'));
    } finally {
      setIsLoadingDemo(false);
    }
  };

  // Perform Voice Cloning
  const handleCloneSubmit = async () => {
    if (!audioBlob) {
      setErrorMsg('অনুগ্রহ করে একটি অডিও ফাইল আপলোড করুন অথবা ভয়েস রেকর্ড করুন।');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMsg(null);

      let base64 = await blobToBase64(audioBlob);
      let mimeType = audioBlob.type || 'audio/wav';

      // If file size is large (> 1.5MB), automatically trim to 15s and downsample in browser
      // to ensure fast transfer and stay well within Vercel serverless payload limits
      if (audioBlob.size > 1.5 * 1024 * 1024) {
        try {
          const arrayBuf = await audioBlob.arrayBuffer();
          const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
          const decoded = await audioCtx.decodeAudioData(arrayBuf);
          const duration = Math.min(15, decoded.duration);
          const offlineCtx = new OfflineAudioContext(1, Math.ceil(duration * 16000), 16000);
          const source = offlineCtx.createBufferSource();
          source.buffer = decoded;
          source.connect(offlineCtx.destination);
          source.start(0);
          const rendered = await offlineCtx.startRendering();
          const wavBlob = audioBufferToWav(rendered);
          base64 = await blobToBase64(wavBlob);
          mimeType = 'audio/wav';
          audioCtx.close();
        } catch (prepErr) {
          console.warn('Browser audio optimization fallback:', prepErr);
        }
      }

      const response = await fetch('/api/clone-voice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audioBase64: base64,
          mimeType,
          customName: voiceName || 'আমার ক্লোনড ভয়েস',
        }),
      });

      if (!response.ok) {
        let errMessage = 'ভয়েস ক্লোন সম্পন্ন করা সম্ভব হয়নি';
        try {
          const errorData = await response.json();
          errMessage = errorData.error || errMessage;
        } catch {
          const rawText = await response.text();
          errMessage = rawText.substring(0, 150) || `HTTP ${response.status}`;
        }
        throw new Error(errMessage);
      }

      const cloneData = await response.json();

      const newClonedVoice: VoiceOption = {
        id: cloneData.id,
        name: cloneData.name,
        bengaliName: `${cloneData.name} (ক্লোনড)`,
        gender: cloneData.gender,
        baseVoice: cloneData.baseVoice,
        category: 'cloned',
        tag: 'AI Cloned Voice',
        description: cloneData.analysisNotes || cloneData.timbre,
        bengaliDescription: `আপনার কণ্ঠের নমুনার উপর ভিত্তি করে তৈরি। স্পষ্টতা: ${cloneData.clarityScore}%`,
        avatarColor:
          cloneData.gender === 'female'
            ? 'from-pink-500 to-rose-600'
            : 'from-purple-600 to-indigo-600',
        timbre: cloneData.timbre,
        pitchSemitones: cloneData.pitchSemitones,
        speedMultiplier: cloneData.speedMultiplier,
        stylePrompt: cloneData.stylePrompt,
        clarityScore: cloneData.clarityScore,
        transcription: cloneData.transcription,
        tags: cloneData.tags,
        createdAt: cloneData.createdAt,
      };

      setClonedResult(newClonedVoice);
    } catch (err: any) {
      console.error('Clone failed:', err);
      setErrorMsg(err.message || 'ভয়েস বিশ্লেষণ করতে ত্রুটি হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleUseVoice = () => {
    if (clonedResult) {
      onSaveClonedVoice(clonedResult);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-white dark:bg-slate-900 border border-purple-500/20 dark:border-purple-500/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg sm:text-xl text-slate-900 dark:text-white flex items-center gap-2">
                <span>RX NAFIJ এআই ভয়েস ক্লোনিং</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-600 text-white">
                  PRO
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali">
                যেকোনো অডিও ফাইল বা নিজের কণ্ঠের নমুনা থেকে নতুন বাংলা এআই ভয়েস মডেল তৈরি করুন
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          {/* Instructions & Guidelines Banner (Required Feature) */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border border-indigo-500/20 space-y-2.5">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
              <h4 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white font-bengali">
                সেরা ভয়েস ক্লোনিংয়ের জন্য গুরুত্বপূর্ণ নির্দেশনাবলী (Cloning Guidelines):
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-600 dark:text-slate-300">
              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <span className="font-bold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  ⏱️ উপযুক্ত সময়কাল
                </span>
                <p className="text-[11px] font-bengali text-slate-500 dark:text-slate-400">
                  ১০ থেকে ৩০ সেকেন্ডের একটানা স্পষ্ট কথা। খুব ছোট বা ১ মিনিটের বেশি পরিহার করুন।
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <span className="font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                  🔇 পরিষ্কার পরিবেশ
                </span>
                <p className="text-[11px] font-bengali text-slate-500 dark:text-slate-400">
                  ব্যাকগ্রাউন্ডে কোনো গান, মিউজিক, গাড়ির হর্ন বা ফ্যানের অতিরিক্ত নয়েজ থাকা যাবে না।
                </p>
              </div>

              <div className="p-2.5 rounded-xl bg-white/70 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-700/60 space-y-1">
                <span className="font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1">
                  🗣️ প্রাকৃতিক উচ্চারণ
                </span>
                <p className="text-[11px] font-bengali text-slate-500 dark:text-slate-400">
                  মাইক্রোফোনের কাছাকাছি স্বাভাবিক গতি ও আবেগে বাংলা বা ইংরেজি বাক্য স্পষ্ট করে বলুন।
                </p>
              </div>
            </div>
          </div>

          {/* Sample Script Prompt for Users */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 block mb-1">
              নমুনা পাঠ্যাংশ (Sample Reading Script for Recording):
            </span>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-bengali leading-relaxed italic">
              "আমি বাংলায় কথা বলতে ভালোবাসি। আধুনিক কৃত্রিম বুদ্ধিমত্তার মাধ্যমে আমার কণ্ঠস্বরকে ডিজিটাল মাধ্যমে রূপান্তর করতে পেরে আমি আনন্দিত। প্রতিটি বাক্য হোক স্পষ্ট এবং অর্থপূর্ণ।"
            </p>
          </div>

          {/* Cloned Voice Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 font-bengali">
              ক্লোনড ভয়েসের নাম দিন (Voice Name):
            </label>
            <input
              type="text"
              value={voiceName}
              onChange={(e) => setVoiceName(e.target.value)}
              placeholder="যেমন: Nafij Personal, অথবা আমার রেডিও ভয়েস"
              className="w-full px-4 py-2.5 rounded-xl text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-white"
            />
          </div>

          {/* Method Selector: Upload vs Record */}
          <div className="space-y-3">
            <div className="flex p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'upload'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span>অডিও ফাইল আপলোড (Upload File)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('record')}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                  activeTab === 'record'
                    ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400'
                }`}
              >
                <Mic className="w-4 h-4" />
                <span>সরাসরি রেকর্ড করুন (Live Record)</span>
              </button>
            </div>

            {/* Upload Area */}
            {activeTab === 'upload' && (
              <div className="border-2 border-dashed border-purple-300 dark:border-purple-800/70 rounded-2xl p-6 text-center hover:bg-purple-50/40 dark:hover:bg-purple-950/20 transition-colors">
                <input
                  type="file"
                  id="cloneAudioFile"
                  accept="audio/*,.mp3,.wav,.m4a,.ogg,.webm"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <label
                  htmlFor="cloneAudioFile"
                  className="cursor-pointer flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                    <FileAudio className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="font-bold text-sm text-purple-600 dark:text-purple-400 hover:underline">
                      অডিও ফাইল বেছে নিন
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 text-xs block">
                      WAV, MP3, M4A, OGG, WebM (সর্বোচ্চ ২৫ এমবি)
                    </span>
                  </div>
                </label>
              </div>
            )}

            {/* Record Area */}
            {activeTab === 'record' && (
              <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-center space-y-4">
                <div className="flex flex-col items-center justify-center gap-2">
                  <div
                    className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all ${
                      isRecording
                        ? 'bg-rose-500 animate-ping'
                        : 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-lg shadow-purple-500/25'
                    }`}
                  >
                    <Mic className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <span className="font-mono text-lg font-bold text-slate-900 dark:text-white">
                      00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds} / 00:30
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali">
                      {isRecording
                        ? 'রেকর্ড হচ্ছে... স্বাভাবিক কণ্ঠে কথা বলুন'
                        : 'স্টার্ট বাটনে ক্লিক করে কথা বলা শুরু করুন'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                  {!isRecording ? (
                    <button
                      type="button"
                      onClick={startRecording}
                      className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <Mic className="w-4 h-4" />
                      <span>রেকর্ডিং শুরু করুন</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={stopRecording}
                      className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer animate-pulse"
                    >
                      <span>রেকর্ডিং বন্ধ করুন</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Instant Demo Audio Sample Option */}
            <div className="p-3 rounded-2xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="text-left">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-bengali block">
                  দ্রুত পরীক্ষার জন্য নমুনা অডিও ব্যবহার করতে চান?
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bengali">
                  মাইক্রোফোন পারমিশন বা অডিও ফাইল না থাকলেও ১-ক্লিকে টেস্ট করুন:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={isLoadingDemo}
                  onClick={() => handleLoadDemoSample('male')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-purple-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors font-bengali shadow-sm disabled:opacity-50"
                >
                  {isLoadingDemo ? 'লোড হচ্ছে...' : 'পুরুষ নমুনা (Male)'}
                </button>
                <button
                  type="button"
                  disabled={isLoadingDemo}
                  onClick={() => handleLoadDemoSample('female')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:border-purple-400 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors font-bengali shadow-sm disabled:opacity-50"
                >
                  {isLoadingDemo ? 'লোড হচ্ছে...' : 'নারী নমুনা (Female)'}
                </button>
              </div>
            </div>

            {/* Audio Preview Card */}
            {audioUrl && (
              <div className="p-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 flex items-center justify-between gap-3">
                <audio
                  ref={audioPreviewRef}
                  src={audioUrl}
                  onEnded={() => setIsPlaying(false)}
                  className="hidden"
                />

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={togglePreviewPlay}
                    className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 transition-colors shadow-sm cursor-pointer"
                  >
                    {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current translate-x-0.5" />}
                  </button>

                  <div>
                    <span className="font-bold text-xs text-slate-900 dark:text-white block">
                      নমুনা অডিও প্রিভিউ ({voiceName || 'অডিও প্রস্তুত'})
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      দৈর্ঘ্য: {audioDuration ? `${audioDuration.toFixed(1)}s` : 'প্রসেস হচ্ছে'}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setAudioBlob(null);
                    setAudioUrl(null);
                    setAudioDuration(0);
                  }}
                  className="p-2 text-slate-400 hover:text-rose-500 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Error Message with Smart Recovery Options */}
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 space-y-2 text-rose-800 dark:text-rose-200 text-xs font-bengali shadow-sm">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2 pt-1 pl-6">
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null);
                    setActiveTab('upload');
                  }}
                  className="px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-900/60 text-rose-900 dark:text-rose-100 font-bold hover:bg-rose-200 dark:hover:bg-rose-800 transition-colors text-xs"
                >
                  ফাইল আপলোড ট্যাবে যান
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadDemoSample('male')}
                  className="px-3 py-1 rounded-lg bg-purple-600 text-white font-bold hover:bg-purple-700 transition-colors text-xs"
                >
                  নমুনা অডিও দিয়ে টেস্ট করুন
                </button>
              </div>
            </div>
          )}

          {/* Cloned Analysis Result Card */}
          {clonedResult && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-500/10 via-purple-500/10 to-indigo-500/10 border border-emerald-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  <h4 className="font-bold text-sm text-slate-900 dark:text-white font-bengali">
                    ভয়েস সফলভাবে ক্লোন ও বিশ্লেষণ করা হয়েছে!
                  </h4>
                </div>
                <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 font-bold text-xs">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{clonedResult.clarityScore}% Clarity</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Timbre (কণ্ঠস্বর)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {clonedResult.timbre || 'Natural'}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Base Engine</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {clonedResult.baseVoice}
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Pitch Shift</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {clonedResult.pitchSemitones || 0} st
                  </span>
                </div>
                <div className="p-2 rounded-xl bg-white/80 dark:bg-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Speed Pace</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {(clonedResult.speedMultiplier || 1.0).toFixed(2)}x
                  </span>
                </div>
              </div>

              {clonedResult.transcription && (
                <div className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-300 font-bengali">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    নমুনার ট্রান্সক্রিপ্ট:
                  </span>{' '}
                  "{clonedResult.transcription}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold"
          >
            বাতিল (Cancel)
          </button>

          {!clonedResult ? (
            <button
              type="button"
              onClick={handleCloneSubmit}
              disabled={!audioBlob || isAnalyzing}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-bold text-xs sm:text-sm hover:shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isAnalyzing ? 'এআই বিশ্লেষণ চলছে...' : 'ভয়েস ক্লোন করুন (Clone Voice)'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleUseVoice}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md transition-all cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>এই ভয়েসটি স্টুডিওতে যুক্ত করুন</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
