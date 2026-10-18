import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Volume2,
  Mic2,
  Languages,
  Trash2,
  ClipboardPaste,
  Wand2,
  AlertCircle,
  CheckCircle2,
  Clock,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { PRESET_VOICES, VoiceOption, SAMPLE_TEXTS, SampleText } from './data/voices';
import { Header } from './components/Header';
import { VoiceSelector } from './components/VoiceSelector';
import { EmotionSelector } from './components/EmotionSelector';
import { AudioControls } from './components/AudioControls';
import { AudioPlayer } from './components/AudioPlayer';
import { VoiceCloningModal } from './components/VoiceCloningModal';
import { HistoryList, HistoryItem } from './components/HistoryList';
import {
  base64ToArrayBuffer,
  speakWithBrowserSynthesis,
} from './utils/audioUtils';

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('rx_voice_theme');
    if (saved === 'light' || saved === 'dark') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'dark';
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'tts' | 'clone' | 'history'>('tts');

  // Input text & language settings
  const [inputText, setInputText] = useState(
    'নমস্কার এবং আসসালামু আলাইকুম। আরএক্স নাফিজ এআই ভয়েস স্টুডিওতে আপনাকে স্বাগতম।'
  );
  const [language, setLanguage] = useState<'bn' | 'en'>('bn');
  const [autoTranslate, setAutoTranslate] = useState(true);

  // Voice & Emotion settings
  const [voices, setVoices] = useState<VoiceOption[]>(() => {
    const savedClones = localStorage.getItem('rx_voice_clones');
    if (savedClones) {
      try {
        const parsed = JSON.parse(savedClones);
        return [...PRESET_VOICES, ...parsed];
      } catch {
        return PRESET_VOICES;
      }
    }
    return PRESET_VOICES;
  });

  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('female');
  const [selectedEmotion, setSelectedEmotion] = useState<
    'normal' | 'happy' | 'sad' | 'angry' | 'excited'
  >('happy');

  // Tuning controls
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(0);

  // Audio generation output state
  const [isGenerating, setIsGenerating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [spokenText, setSpokenText] = useState<string>('');

  // Voice cloning modal state
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);

  // Generation history
  const [history, setHistory] = useState<HistoryItem[]>(() => {
    const saved = localStorage.getItem('rx_voice_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  // API key health status
  const [apiKeyMissing, setApiKeyMissing] = useState(false);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.hasKey === false) {
          setApiKeyMissing(true);
        }
      })
      .catch(() => {});
  }, []);

  // Sync theme to document element
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
    localStorage.setItem('rx_voice_theme', theme);
  }, [theme]);

  // Persist cloned voices
  const saveClonedVoice = (newVoice: VoiceOption) => {
    const updated = [...voices, newVoice];
    setVoices(updated);
    const clonedOnly = updated.filter((v) => v.category === 'cloned');
    localStorage.setItem('rx_voice_clones', JSON.stringify(clonedOnly));
    setSelectedVoiceId(newVoice.id);
  };

  const deleteClonedVoice = (id: string) => {
    const updated = voices.filter((v) => v.id !== id);
    setVoices(updated);
    const clonedOnly = updated.filter((v) => v.category === 'cloned');
    localStorage.setItem('rx_voice_clones', JSON.stringify(clonedOnly));
    if (selectedVoiceId === id) {
      setSelectedVoiceId('male');
    }
  };

  // Persist history
  const addHistoryItem = (item: HistoryItem) => {
    const updated = [item, ...history.slice(0, 19)]; // keep latest 20
    setHistory(updated);
    localStorage.setItem('rx_voice_history', JSON.stringify(updated));
  };

  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem('rx_voice_history', JSON.stringify(updated));
  };

  const clearAllHistory = () => {
    setHistory([]);
    localStorage.removeItem('rx_voice_history');
  };

  // Find currently selected voice
  const activeVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  // Primary Generate Voice handler
  const handleGenerateVoice = async () => {
    if (!inputText.trim()) {
      setErrorMessage('অনুগ্রহ করে কথা বলার জন্য টেক্সট লিখুন।');
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMessage(null);

      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: inputText.trim(),
          voiceId: activeVoice.id,
          voiceName: activeVoice.baseVoice,
          emotion: selectedEmotion,
          language,
          autoTranslate,
          customPromptStyle: activeVoice.stylePrompt,
        }),
      });

      if (!response.ok) {
        let errMessage = 'ভয়েস জেনারেট করতে সমস্যা হয়েছে';
        try {
          const errorData = await response.json();
          errMessage = errorData.error || errMessage;
        } catch {
          try {
            const errorText = await response.text();
            errMessage = errorText.substring(0, 150) || `HTTP ${response.status}`;
          } catch {
            errMessage = `HTTP ${response.status} ${response.statusText}`;
          }
        }
        throw new Error(errMessage);
      }

      const data = await response.json();
      const rawB64 = data.audioBase64;
      const arrayBuf = base64ToArrayBuffer(rawB64);

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuf);
      audioCtx.close();

      setAudioBuffer(decodedBuffer);
      setAudioBase64(rawB64);
      setSpokenText(data.spokenText || inputText);

      // Add to history
      addHistoryItem({
        id: `gen_${Date.now()}`,
        text: data.spokenText || inputText,
        voiceName: activeVoice.name,
        emotion: selectedEmotion,
        speed,
        pitch,
        audioBase64: rawB64,
        createdAt: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Backend TTS failed, trying fallback synthesis:', err);
      // Fallback to browser SpeechSynthesis
      try {
        await speakWithBrowserSynthesis(
          inputText,
          speed,
          pitch > 0 ? 1.3 : pitch < 0 ? 0.7 : 1.0,
          activeVoice.gender
        );
        setErrorMessage(
          `এআই সার্ভার ত্রুটি (${err.message})। আপনার ব্রাউজারের স্পিচ সিন্থেসাইজার ব্যবহার করে অডিও বাজানো হলো।`
        );
      } catch (synthErr: any) {
        setErrorMessage(err.message || 'ভয়েস তৈরি করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplySample = (sample: SampleText) => {
    setInputText(sample.text);
    setSelectedEmotion(sample.suggestedEmotion);
    const matchedVoice = voices.find((v) => v.id === sample.suggestedVoiceId);
    if (matchedVoice) setSelectedVoiceId(matchedVoice.id);
  };

  const handlePasteClipboard = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) setInputText(clipText);
    } catch {
      // clipboard permission denied
    }
  };

  const handlePlayFromHistory = async (item: HistoryItem) => {
    try {
      const arrayBuf = base64ToArrayBuffer(item.audioBase64);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuf);
      audioCtx.close();

      setAudioBuffer(decodedBuffer);
      setAudioBase64(item.audioBase64);
      setSpokenText(item.text);
      setSpeed(item.speed);
      setPitch(item.pitch);
      setActiveTab('tts');
      window.scrollTo({ top: 400, behavior: 'smooth' });
    } catch (e) {
      console.error('Failed to load history audio:', e);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col selection:bg-purple-500 selection:text-white transition-colors duration-200">
      {/* Background Ambient Glow Gradients */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-600/15 dark:bg-purple-600/25 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-blue-600/15 dark:bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <Header
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        clonedCount={voices.filter((v) => v.category === 'cloned').length}
      />

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Banner Section */}
        <div className="text-center space-y-2 max-w-3xl mx-auto pt-2 pb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 border border-purple-500/20 text-xs font-semibold text-purple-700 dark:text-purple-300">
            <Sparkles className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span>Next-Gen Bengali Speech Synthesis</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-600 via-indigo-500 to-blue-500 bg-clip-text text-transparent">
            RX NAFIJ AI VOICE STUDIO
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 font-bengali max-w-2xl mx-auto">
            প্রাকৃতিক এবং জীবন্ত মানব কণ্ঠের বাংলা এআই স্পিচ জেনারেটর। কাস্টম ভয়েস ক্লোনিং, স্পিড, পিচ ও ইমোশন নিয়ন্ত্রণ করে তৈরি করুন উচ্চমানের অডিও।
          </p>
        </div>

        {/* API Key Missing Warning Banner */}
        {apiKeyMissing && (
          <div className="max-w-3xl mx-auto p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 text-xs sm:text-sm font-bengali shadow-md flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold text-sm block">
                সতর্কতা: Vercel-এ GEMINI_API_KEY পাওয়া যাচ্ছে না!
              </span>
              <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                আপনার Vercel ড্যাশবোর্ডে গিয়ে <strong>Project Settings &gt; Environment Variables</strong>-এ Key হিসেবে <code>GEMINI_API_KEY</code> এবং Value হিসেবে আপনার API Key পেস্ট করে সেভ করুন। এরপর <strong>Deployments</strong> ট্যাবে গিয়ে ৩-ডটে চাপ দিয়ে <strong>Redeploy</strong> বাটনে ক্লিক করুন।
              </p>
            </div>
          </div>
        )}

        {/* View Switching */}
        {activeTab === 'history' ? (
          <div className="max-w-4xl mx-auto">
            <HistoryList
              history={history}
              onPlayItem={handlePlayFromHistory}
              onDeleteItem={deleteHistoryItem}
              onClearAll={clearAllHistory}
            />
          </div>
        ) : activeTab === 'clone' ? (
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-purple-500/20 shadow-xl space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-5">
                <div>
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2 font-bengali">
                    <Mic2 className="w-5 h-5 text-purple-600" />
                    <span>বাংলা এআই ভয়েস ক্লোনিং স্টুডিও</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali mt-1">
                    যেকোনো অডিও ফাইল অথবা নিজের লাইভ কথা রেকর্ড করে তৈরি করুন নিজস্ব এআই ভয়েস মডেল
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsCloneModalOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs sm:text-sm shadow-md hover:shadow-purple-500/25 hover:scale-105 transition-all cursor-pointer self-start sm:self-auto"
                >
                  + নতুন ভয়েস ক্লোন করুন
                </button>
              </div>

              {/* Cloned Voices Showcase */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  আপনার সংরক্ষিত ক্লোনড ভয়েস সমূহ (My Cloned Voices)
                </h3>

                {voices.filter((v) => v.category === 'cloned').length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/50 dark:border-purple-800/40 space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
                      <Mic2 className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 font-bengali">
                      এখনো কোনো ভয়েস ক্লোন করা হয়নি
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali max-w-md mx-auto">
                      "নতুন ভয়েস ক্লোন করুন" এ ক্লিক করে আপনার ১০-৩০ সেকেন্ডের অডিও আপলোড করুন। এআই স্বয়ংক্রিয়ভাবে আপনার কণ্ঠের গুণাবলী বিশ্লেষণ করবে।
                    </p>
                    <button
                      type="button"
                      onClick={() => setIsCloneModalOpen(true)}
                      className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold text-xs shadow-sm hover:bg-purple-700 transition-colors"
                    >
                      ভয়েস ক্লোনিং শুরু করুন
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {voices
                      .filter((v) => v.category === 'cloned')
                      .map((voice) => (
                        <div
                          key={voice.id}
                          className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3 shadow-sm relative group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center">
                              <Sparkles className="w-5 h-5 text-amber-300" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                {voice.name}
                              </h4>
                              <p className="text-[11px] text-purple-600 dark:text-purple-400 font-medium">
                                Base: {voice.baseVoice}
                              </p>
                            </div>
                          </div>

                          <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-1 font-bengali">
                            <div>Timbre: {voice.timbre || 'Natural'}</div>
                            {voice.clarityScore && <div>Clarity Score: {voice.clarityScore}%</div>}
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedVoiceId(voice.id);
                                setActiveTab('tts');
                              }}
                              className="text-xs font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 font-bengali"
                            >
                              <span>এই ভয়েসটি ব্যবহার করুন</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>

                            <button
                              type="button"
                              onClick={() => deleteClonedVoice(voice.id)}
                              className="p-1 text-slate-400 hover:text-rose-500"
                              title="Delete cloned voice"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Main TTS Studio Screen */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Main Studio Panel (7 cols) */}
            <div className="lg:col-span-7 space-y-5">
              {/* Text Input Card */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl space-y-4">
                {/* Language Mode & Translation Switches */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/80 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Languages className="w-3.5 h-3.5 text-purple-500" />
                      <span>ভাষা (Language)</span>
                    </span>

                    <div className="flex p-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setLanguage('bn')}
                        className={`px-2.5 py-1 rounded-md font-semibold font-bengali transition-colors ${
                          language === 'bn'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        বাংলা (BD)
                      </button>
                      <button
                        type="button"
                        onClick={() => setLanguage('en')}
                        className={`px-2.5 py-1 rounded-md font-semibold transition-colors ${
                          language === 'en'
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        English
                      </button>
                    </div>
                  </div>

                  {/* Auto-Translate English to Bengali Toggle */}
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-600 dark:text-slate-300 font-bengali">
                    <input
                      type="checkbox"
                      checked={autoTranslate}
                      onChange={(e) => setAutoTranslate(e.target.checked)}
                      className="accent-purple-600 w-3.5 h-3.5 rounded"
                    />
                    <span>ইংরেজি থেকে খাঁটি বাংলায় রূপান্তর (Auto-Translate)</span>
                  </label>
                </div>

                {/* Large Textarea */}
                <div className="relative">
                  <textarea
                    rows={6}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="এখানে আপনার বাংলা বা ইংরেজি টেক্সট লিখুন..."
                    className="w-full p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 text-slate-900 dark:text-slate-100 text-sm sm:text-base font-bengali leading-relaxed resize-y placeholder:text-slate-400"
                  />

                  {/* Textarea Quick Action Buttons */}
                  <div className="flex items-center justify-between text-xs text-slate-400 pt-1.5 px-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handlePasteClipboard}
                        className="flex items-center gap-1 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        <ClipboardPaste className="w-3.5 h-3.5" />
                        <span>পেস্ট করুন</span>
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        onClick={() => setInputText('')}
                        className="flex items-center gap-1 hover:text-rose-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>মুছুন</span>
                      </button>
                    </div>

                    <div className="font-mono text-[11px]">
                      {inputText.trim().length} অক্ষর •{' '}
                      {inputText.trim() ? inputText.trim().split(/\s+/).length : 0} শব্দ
                    </div>
                  </div>
                </div>

                {/* Quick Sample Prompts Chips */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                    <Wand2 className="w-3 h-3 text-purple-500" />
                    <span>দ্রুত পরীক্ষা করার নমুনা টেক্সট (Sample Prompts):</span>
                  </span>

                  <div className="flex flex-wrap gap-1.5">
                    {SAMPLE_TEXTS.map((sample) => (
                      <button
                        key={sample.id}
                        type="button"
                        onClick={() => handleApplySample(sample)}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-purple-100 dark:hover:bg-purple-950/60 hover:text-purple-700 dark:hover:text-purple-300 text-[11px] font-bengali transition-colors border border-slate-200/50 dark:border-slate-700/50"
                      >
                        {sample.title}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Error Alert */}
              {errorMessage && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3 text-rose-800 dark:text-rose-200 text-xs sm:text-sm font-bengali shadow-sm">
                  <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                  <div className="flex-1 leading-relaxed">{errorMessage}</div>
                </div>
              )}

              {/* Audio Player Card (Renders generated speech) */}
              {audioBuffer && (
                <AudioPlayer
                  audioBuffer={audioBuffer}
                  rawBase64={audioBase64}
                  spokenText={spokenText}
                  voiceName={activeVoice.name}
                  emotion={selectedEmotion}
                  speed={speed}
                  pitch={pitch}
                />
              )}
            </div>

            {/* Right Configuration Panel (5 cols) */}
            <div className="lg:col-span-5 space-y-5">
              {/* Voice Selection */}
              <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900/90 border border-slate-200/80 dark:border-slate-800/80 shadow-xl backdrop-blur-xl space-y-5">
                <VoiceSelector
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  onSelectVoice={(v) => {
                    setSelectedVoiceId(v.id);
                    if (v.speedMultiplier) setSpeed(v.speedMultiplier);
                    if (v.pitchSemitones) setPitch(v.pitchSemitones);
                  }}
                  onOpenCloneModal={() => setIsCloneModalOpen(true)}
                  onDeleteClonedVoice={deleteClonedVoice}
                />

                {/* Emotion Selector */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <EmotionSelector
                    selectedEmotion={selectedEmotion}
                    onSelectEmotion={setSelectedEmotion}
                  />
                </div>

                {/* Speed & Pitch Controls */}
                <div className="border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <AudioControls
                    speed={speed}
                    pitch={pitch}
                    onChangeSpeed={setSpeed}
                    onChangePitch={setPitch}
                    onReset={() => {
                      setSpeed(1.0);
                      setPitch(0);
                    }}
                  />
                </div>

                {/* Primary Action Button: Generate Voice */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateVoice}
                    disabled={isGenerating || !inputText.trim()}
                    className="w-full relative group overflow-hidden py-4 px-6 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 text-white font-extrabold text-sm sm:text-base shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <div className="relative flex items-center justify-center gap-2">
                      {isGenerating ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span className="font-bengali">এআই কণ্ঠ তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Volume2 className="w-5 h-5 group-hover:animate-bounce" />
                          <span className="font-bengali">ভয়েস তৈরি করুন (Generate Voice)</span>
                        </>
                      )}
                    </div>
                  </button>
                  <p className="text-[11px] text-center text-slate-400 dark:text-slate-500 mt-2 font-bengali">
                    ElevenLabs স্টাইল এইচডি কোয়ালিটি • রিয়েলটাইম প্লেয়ার ও সরাসরি MP3 ডাউনলোড
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Voice Cloning Modal */}
      <VoiceCloningModal
        isOpen={isCloneModalOpen}
        onClose={() => setIsCloneModalOpen(false)}
        onSaveClonedVoice={(voice) => {
          saveClonedVoice(voice);
          setActiveTab('tts');
        }}
      />

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-500 dark:text-slate-400 font-bengali">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-extrabold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">
              RX NAFIJ AI VOICE
            </span>
            <span>•</span>
            <span>Professional Bengali AI Speech & Voice Cloning Engine</span>
          </div>
          <div>
            <span>Developed for Bengali Text-to-Speech Creators</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
