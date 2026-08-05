import React, { useEffect, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import type { Note } from '@syncnotes/types';

const Search = (LucideIcons as Record<string, any>).Search || LucideIcons.Sun;
const SquarePen = (LucideIcons as Record<string, any>).SquarePen || LucideIcons.Sun;
const Moon = LucideIcons.Moon;
const Eye = (LucideIcons as Record<string, any>).Eye || LucideIcons.Sun;
const X = (LucideIcons as Record<string, any>).X || LucideIcons.Sun;

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  notes: Note[];
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  onToggleFocusMode: () => void;
  onToggleTheme: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  notes,
  onSelectNote,
  onNewNote,
  onToggleFocusMode,
  onToggleTheme,
}) => {
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          setQuery('');
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredNotes = notes
    .filter((n) => !n.deleted && !n.archived)
    .filter(
      (n) =>
        n.title.toLowerCase().includes(query.toLowerCase()) ||
        n.content.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-xl bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark rounded-2xl shadow-2xl overflow-hidden text-continuum-textLight dark:text-continuum-textDark flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-continuum-borderLight dark:border-continuum-borderDark flex items-center gap-3 bg-continuum-sidebarLight/50 dark:bg-continuum-sidebarDark/50">
          <Search className="w-5 h-5 text-continuum-amber" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a note title or action command... (Esc to cancel)"
            className="w-full bg-transparent outline-none text-sm text-continuum-textLight dark:text-continuum-textDark placeholder-continuum-subtextLight dark:placeholder-continuum-subtextDark"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-black/10 dark:hover:bg-white/10 text-continuum-subtextLight dark:text-continuum-subtextDark transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Command Options & Results */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-1">
          {/* Action Commands */}
          <div className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-continuum-subtextLight dark:text-continuum-subtextDark">
            Quick Actions
          </div>

          <button
            onClick={() => {
              onNewNote();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-continuum-amber/15 text-left text-xs font-medium text-continuum-textLight dark:text-continuum-textDark hover:text-continuum-amber transition group"
          >
            <SquarePen className="w-4 h-4 text-continuum-amber" />
            <span>Create New Note</span>
            <span className="ml-auto text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark group-hover:text-continuum-amber">
              Ctrl+N
            </span>
          </button>

          <button
            onClick={() => {
              onToggleFocusMode();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-continuum-amber/15 text-left text-xs font-medium text-continuum-textLight dark:text-continuum-textDark hover:text-continuum-amber transition group"
          >
            <Eye className="w-4 h-4 text-sky-400" />
            <span>Toggle Distraction-Free Focus Mode</span>
          </button>

          <button
            onClick={() => {
              onToggleTheme();
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-continuum-amber/15 text-left text-xs font-medium text-continuum-textLight dark:text-continuum-textDark hover:text-continuum-amber transition group"
          >
            <Moon className="w-4 h-4 text-amber-400" />
            <span>Cycle Theme Mode (Dark / Light / System)</span>
          </button>

          {/* Matching Notes Section */}
          {filteredNotes.length > 0 && (
            <>
              <div className="px-3 pt-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-continuum-subtextLight dark:text-continuum-subtextDark">
                Matching Notes ({filteredNotes.length})
              </div>
              {filteredNotes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => {
                    onSelectNote(note.id);
                    onClose();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-black/5 dark:hover:bg-white/5 text-left text-xs text-continuum-textLight dark:text-continuum-textDark transition group"
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <span className="w-2 h-2 rounded-full bg-continuum-amber shrink-0" />
                    <span className="font-medium truncate">{note.title.trim() || 'Untitled Note'}</span>
                  </div>
                  <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark whitespace-nowrap">
                    {new Date(note.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
