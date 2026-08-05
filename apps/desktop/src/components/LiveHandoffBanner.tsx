import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { HandoffState } from '@syncnotes/types';

const Smartphone = (LucideIcons as Record<string, any>).Smartphone || LucideIcons.Sun;
const Monitor = (LucideIcons as Record<string, any>).Monitor || LucideIcons.Sun;
const ArrowRight = (LucideIcons as Record<string, any>).ArrowRight || LucideIcons.Sun;
const X = (LucideIcons as Record<string, any>).X || LucideIcons.Sun;

interface LiveHandoffBannerProps {
  handoffState: HandoffState | null;
  onOpenHandoffNote: (noteId: string) => void;
  onDismiss: () => void;
}

export const LiveHandoffBanner: React.FC<LiveHandoffBannerProps> = ({
  handoffState,
  onOpenHandoffNote,
  onDismiss,
}) => {
  if (!handoffState) return null;

  return (
    <div className="shimmer-gradient border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs transition-all animate-scale-in">
      <div className="flex items-center gap-3 text-amber-300 font-medium">
        <div className="relative">
          {handoffState.originDeviceType === 'iPhone' ? (
            <Smartphone className="w-4 h-4 text-amber-400 animate-bounce" />
          ) : (
            <Monitor className="w-4 h-4 text-amber-400 animate-bounce" />
          )}
          <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </div>
        <span>
          <strong className="text-amber-400 font-bold uppercase tracking-wider text-[11px]">TwinSpace Handoff:</strong> Continue working from <strong>{handoffState.originDeviceType}</strong> on{' '}
          <span className="italic font-semibold text-white">“{handoffState.noteTitle}”</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenHandoffNote(handoffState.noteId)}
          className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-3 py-1 rounded-xl text-[11px] font-bold transition-all duration-200 active:scale-95 shadow-md hover:shadow-amber-500/20"
        >
          <span>Jump to note</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-white/10 hover:text-white transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
