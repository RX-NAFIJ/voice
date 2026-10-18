import React from 'react';
import { Sparkles, Moon, Sun, Mic2, Volume2, Globe, Download } from 'lucide-react';

interface HeaderProps {
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  activeTab: 'tts' | 'clone' | 'history';
  onSelectTab: (tab: 'tts' | 'clone' | 'history') => void;
  clonedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onToggleTheme,
  activeTab,
  onSelectTab,
  clonedCount,
}) => {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl border-b border-purple-500/10 dark:border-purple-500/20 bg-white/70 dark:bg-slate-950/70 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18">
          {/* Logo & Branding */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-lg shadow-purple-500/25 text-white">
              <Volume2 className="w-6 h-6 animate-pulse" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
                  RX NAFIJ AI VOICE
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
                  ElevenLabs Studio
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-bengali">
                প্রাকৃতিক বাংলা এআই ভয়েস ও ক্লোনিং স্টুডিও
              </p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-100/80 dark:bg-slate-900/80 border border-slate-200/60 dark:border-slate-800">
            <button
              onClick={() => onSelectTab('tts')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'tts'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>টেক্সট টু ভয়েস (TTS)</span>
            </button>
            <button
              onClick={() => onSelectTab('clone')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'clone'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>ভয়েস ক্লোনিং (Clone)</span>
              {clonedCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white">
                  {clonedCount}
                </span>
              )}
            </button>
            <button
              onClick={() => onSelectTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <span>হিস্ট্রি (Library)</span>
            </button>
          </div>

          {/* Actions: Download Project ZIP, Theme Toggle & Language Badge */}
          <div className="flex items-center gap-2">
            <a
              href="/api/download-project"
              download="rx-nafij-ai-voice.zip"
              title="Download Complete Source Code ZIP"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-xs shadow-md shadow-purple-500/20 hover:scale-105 active:scale-95 transition-all font-bengali"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">জিপ ডাউনলোড (ZIP)</span>
              <span className="sm:hidden">ZIP</span>
            </a>

            <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 text-xs border border-purple-200/50 dark:border-purple-800/40 font-bengali">
              <Globe className="w-3.5 h-3.5" />
              <span>বাংলা ও English</span>
            </div>

            <button
              onClick={onToggleTheme}
              aria-label="Toggle Theme"
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-purple-600" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-200/50 dark:border-slate-800/50">
          <button
            onClick={() => onSelectTab('tts')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'tts'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>TTS</span>
          </button>
          <button
            onClick={() => onSelectTab('clone')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'clone'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Mic2 className="w-3.5 h-3.5" />
            <span>ভয়েস ক্লোনিং</span>
            {clonedCount > 0 && (
              <span className="w-4 h-4 text-[10px] rounded-full bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 flex items-center justify-center">
                {clonedCount}
              </span>
            )}
          </button>
          <button
            onClick={() => onSelectTab('history')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-purple-600 text-white'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <span>লাইব্রেরি</span>
          </button>
        </div>
      </div>
    </header>
  );
};
