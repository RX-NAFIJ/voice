import React from 'react';
import { Play, Download, Trash2, Clock, Volume2, Sparkles } from 'lucide-react';
import { base64ToArrayBuffer, audioBufferToMp3, downloadBlob, renderProcessedAudio } from '../utils/audioUtils';

export interface HistoryItem {
  id: string;
  text: string;
  voiceName: string;
  emotion: string;
  speed: number;
  pitch: number;
  audioBase64: string;
  createdAt: string;
}

interface HistoryListProps {
  history: HistoryItem[];
  onPlayItem: (item: HistoryItem) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryList: React.FC<HistoryListProps> = ({
  history,
  onPlayItem,
  onDeleteItem,
  onClearAll,
}) => {
  const handleDownload = async (item: HistoryItem) => {
    try {
      const arrayBuffer = base64ToArrayBuffer(item.audioBase64);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const processed = await renderProcessedAudio(decodedBuffer, item.speed, item.pitch);
      const mp3Blob = audioBufferToMp3(processed, 192);
      downloadBlob(mp3Blob, `RX_NAFIJ_${item.voiceName}_${Date.now()}.mp3`);
      audioCtx.close();
    } catch (err) {
      console.error('Failed to download from history:', err);
    }
  };

  if (history.length === 0) {
    return (
      <div className="p-8 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
        <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mx-auto">
          <Clock className="w-6 h-6" />
        </div>
        <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 font-bengali">
          কোনো পূর্ববর্তী রেকর্ড নেই
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 font-bengali max-w-sm mx-auto">
          টেক্সট ইনপুট বক্সে বাংলা বা ইংরেজি টেক্সট লিখে "Generate Voice" এ ক্লিক করলে অডিও এখানে সংরক্ষিত থাকবে।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-purple-500" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            পূর্ববর্তী অডিও লাইব্রেরি (Generation History) ({history.length})
          </h3>
        </div>

        <button
          type="button"
          onClick={onClearAll}
          className="text-[11px] font-semibold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
        >
          সব মুছুন (Clear All)
        </button>
      </div>

      <div className="space-y-2.5">
        {history.map((item) => (
          <div
            key={item.id}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-purple-300 dark:hover:border-purple-800 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm group"
          >
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() => onPlayItem(item)}
                className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center hover:bg-purple-700 shrink-0 shadow-sm transition-transform group-hover:scale-105"
              >
                <Play className="w-4 h-4 fill-current translate-x-0.5" />
              </button>

              <div className="min-w-0 flex-1 space-y-1">
                <p className="text-xs sm:text-sm font-bengali text-slate-800 dark:text-slate-200 line-clamp-2 leading-relaxed">
                  "{item.text}"
                </p>

                <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {item.voiceName}
                  </span>
                  <span>•</span>
                  <span className="capitalize">{item.emotion}</span>
                  <span>•</span>
                  <span>{item.speed}x</span>
                  <span>•</span>
                  <span>{new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => handleDownload(item)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/60 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>MP3</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteItem(item.id)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 transition-colors"
                title="Delete item"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
