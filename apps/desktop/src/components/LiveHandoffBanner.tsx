import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { HandoffState } from '@syncnotes/types';

const Smartphone = (LucideIcons as any).Smartphone || (LucideIcons as any).Phone;
const Monitor = (LucideIcons as any).Monitor || (LucideIcons as any).Laptop;
const ArrowRight = (LucideIcons as any).ArrowRight || (LucideIcons as any).ChevronRight;
const X = (LucideIcons as any).X;

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
    <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-b border-amber-500/30 px-4 py-2 flex items-center justify-between text-xs transition-all animate-fade-in">
      <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 font-medium">
        {handoffState.originDeviceType === 'iPhone' ? (
          <Smartphone className="w-4 h-4 text-amber-500 animate-pulse" />
        ) : (
          <Monitor className="w-4 h-4 text-amber-500 animate-pulse" />
        )}
        <span>
          Live Handoff: Continue working from <strong>{handoffState.originDeviceType}</strong> on{' '}
          <span className="italic">“{handoffState.noteTitle}”</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onOpenHandoffNote(handoffState.noteId)}
          className="flex items-center gap-1 bg-amber-500 hover:bg-amber-600 text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold transition active:scale-95 shadow-xs"
        >
          <span>Jump to note</span>
          <ArrowRight className="w-3 h-3" />
        </button>
        <button
          onClick={onDismiss}
          className="p-1 rounded text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-black/10 transition"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
