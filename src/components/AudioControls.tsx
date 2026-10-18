import React from 'react';
import { Gauge, Sliders, RotateCcw } from 'lucide-react';

interface AudioControlsProps {
  speed: number;
  pitch: number;
  onChangeSpeed: (speed: number) => void;
  onChangePitch: (pitch: number) => void;
  onReset: () => void;
}

export const AudioControls: React.FC<AudioControlsProps> = ({
  speed,
  pitch,
  onChangeSpeed,
  onChangePitch,
  onReset,
}) => {
  const speedPresets = [0.75, 1.0, 1.25, 1.5, 2.0];
  const pitchPresets = [
    { label: 'ভারী / Deep', val: -4 },
    { label: 'স্বাভাবিক / Normal', val: 0 },
    { label: 'মিষ্টি / High', val: 3 },
    { label: 'কিউট / Squeaky', val: 6 },
  ];

  return (
    <div className="p-4 rounded-2xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-500" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            স্পিড ও পিচ কন্ট্রোল (Speed & Pitch Tuning)
          </span>
        </div>

        {(speed !== 1.0 || pitch !== 0) && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
          >
            <RotateCcw className="w-3 h-3" />
            <span>রিসেট (Reset)</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Speed Control (0.5x - 2.0x) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400 font-medium font-bengali">
              <Gauge className="w-3.5 h-3.5 text-indigo-500" />
              ভয়েস স্পিড (Speaking Speed):
            </span>
            <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-xs border border-indigo-200/50 dark:border-indigo-800/50">
              {speed.toFixed(2)}x
            </span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={speed}
            onChange={(e) => onChangeSpeed(parseFloat(e.target.value))}
            className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {speedPresets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => onChangeSpeed(val)}
                className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                  Math.abs(speed - val) < 0.01
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {val}x
              </button>
            ))}
          </div>
        </div>

        {/* Pitch Control (-12 to +12 semitones) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-600 dark:text-slate-400 font-medium font-bengali">
              ভয়েস পিচ (Voice Pitch):
            </span>
            <span className="font-mono font-bold text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-xs border border-purple-200/50 dark:border-purple-800/50">
              {pitch > 0 ? `+${pitch}` : pitch} semitones
            </span>
          </div>

          <input
            type="range"
            min="-12"
            max="12"
            step="1"
            value={pitch}
            onChange={(e) => onChangePitch(parseInt(e.target.value, 10))}
            className="w-full accent-purple-600 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none"
          />

          <div className="flex items-center justify-between gap-1 pt-1">
            {pitchPresets.map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => onChangePitch(p.val)}
                className={`flex-1 py-1 px-1 text-[10px] font-semibold rounded-md truncate transition-colors font-bengali ${
                  pitch === p.val
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
