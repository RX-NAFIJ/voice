import React, { useState } from 'react';
import { VoiceOption } from '../data/voices';
import { Check, Sparkles, User, Plus, Trash2, Volume2, ShieldCheck } from 'lucide-react';

interface VoiceSelectorProps {
  voices: VoiceOption[];
  selectedVoiceId: string;
  onSelectVoice: (voice: VoiceOption) => void;
  onOpenCloneModal: () => void;
  onDeleteClonedVoice?: (id: string) => void;
}

export const VoiceSelector: React.FC<VoiceSelectorProps> = ({
  voices,
  selectedVoiceId,
  onSelectVoice,
  onOpenCloneModal,
  onDeleteClonedVoice,
}) => {
  const [filter, setFilter] = useState<'all' | 'preset' | 'cloned'>('all');

  const filteredVoices = voices.filter((v) => {
    if (filter === 'preset') return v.category === 'preset';
    if (filter === 'cloned') return v.category === 'cloned';
    return true;
  });

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];

  return (
    <div className="space-y-3">
      {/* Label and Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <User className="w-3.5 h-3.5 text-purple-500" />
          <span>ভয়েস নির্বাচন (Select Voice)</span>
        </label>

        <div className="flex items-center gap-1 text-xs">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filter === 'all'
                ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            সব ({voices.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('preset')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filter === 'preset'
                ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            মডেল ভয়েস
          </button>
          <button
            type="button"
            onClick={() => setFilter('cloned')}
            className={`px-2 py-0.5 rounded-md transition-colors ${
              filter === 'cloned'
                ? 'bg-purple-100 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 font-semibold'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            ক্লোনড ভয়েস ({voices.filter((v) => v.category === 'cloned').length})
          </button>
        </div>
      </div>

      {/* Voice Selection Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        {filteredVoices.map((voice) => {
          const isSelected = voice.id === selectedVoiceId;
          const isCloned = voice.category === 'cloned';

          return (
            <div
              key={voice.id}
              onClick={() => onSelectVoice(voice)}
              className={`group relative p-3 rounded-2xl cursor-pointer transition-all duration-200 text-left border ${
                isSelected
                  ? 'bg-gradient-to-br from-purple-500/10 via-indigo-500/5 to-transparent border-purple-500 shadow-md shadow-purple-500/10 ring-2 ring-purple-500/30 dark:ring-purple-500/50'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800/80 hover:border-purple-300 dark:hover:border-purple-800/60 shadow-sm'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {/* Voice Avatar Badge */}
                <div
                  className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${
                    voice.avatarColor || 'from-purple-600 to-indigo-600'
                  } flex items-center justify-center text-white shrink-0 shadow-sm`}
                >
                  {isCloned ? (
                    <Sparkles className="w-5 h-5 text-amber-300" />
                  ) : (
                    <Volume2 className="w-5 h-5" />
                  )}
                </div>

                {/* Details */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {voice.name}
                    </h4>
                    {isSelected && (
                      <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  <p className="text-xs text-purple-600 dark:text-purple-400 font-medium font-bengali truncate">
                    {voice.bengaliName}
                  </p>

                  <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {voice.tag}
                    </span>
                    {isCloned && voice.clarityScore && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                        <ShieldCheck className="w-2.5 h-2.5" />
                        {voice.clarityScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Bengali Description */}
              <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 font-bengali line-clamp-2 leading-relaxed">
                {voice.bengaliDescription || voice.description}
              </p>

              {/* Cloned Delete Button */}
              {isCloned && onDeleteClonedVoice && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`Remove cloned voice "${voice.name}"?`)) {
                      onDeleteClonedVoice(voice.id);
                    }
                  }}
                  title="Remove Cloned Voice"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Quick Clone Button Card */}
        <button
          type="button"
          onClick={onOpenCloneModal}
          className="p-3 rounded-2xl border-2 border-dashed border-purple-300 dark:border-purple-800/60 bg-purple-50/40 dark:bg-purple-950/20 hover:bg-purple-100/60 dark:hover:bg-purple-900/30 text-purple-700 dark:text-purple-300 flex flex-col items-center justify-center gap-1.5 text-center transition-all group cursor-pointer min-h-[100px]"
        >
          <div className="w-9 h-9 rounded-xl bg-purple-600 text-white flex items-center justify-center group-hover:scale-105 transition-transform shadow-md shadow-purple-500/20">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-xs font-bold font-bengali">নতুন ভয়েস ক্লোন করুন</span>
          <span className="text-[10px] text-slate-500 dark:text-slate-400">
            Upload audio or record
          </span>
        </button>
      </div>
    </div>
  );
};
