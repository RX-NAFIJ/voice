import React from 'react';
import { EMOTIONS, EmotionOption } from '../data/voices';
import { Smile } from 'lucide-react';

interface EmotionSelectorProps {
  selectedEmotion: 'normal' | 'happy' | 'sad' | 'angry' | 'excited';
  onSelectEmotion: (emotion: 'normal' | 'happy' | 'sad' | 'angry' | 'excited') => void;
}

export const EmotionSelector: React.FC<EmotionSelectorProps> = ({
  selectedEmotion,
  onSelectEmotion,
}) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <Smile className="w-3.5 h-3.5 text-purple-500" />
          <span>আবেগ ও মেজাজ (Emotion & Mood)</span>
        </label>
        <span className="text-[11px] text-purple-600 dark:text-purple-400 font-medium font-bengali">
          {EMOTIONS.find((e) => e.id === selectedEmotion)?.description}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {EMOTIONS.map((emotion: EmotionOption) => {
          const isSelected = emotion.id === selectedEmotion;
          return (
            <button
              key={emotion.id}
              type="button"
              onClick={() => onSelectEmotion(emotion.id)}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-600 shadow-md shadow-purple-500/20 scale-[1.02]'
                  : 'bg-white dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-700'
              }`}
            >
              <span className="text-base">{emotion.emoji}</span>
              <div className="text-left leading-tight">
                <span className="block font-bengali font-bold text-xs">
                  {emotion.bengaliName}
                </span>
                <span className={`block text-[10px] ${isSelected ? 'text-purple-200' : 'text-slate-400'}`}>
                  {emotion.name}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
