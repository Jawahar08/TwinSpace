import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { Note } from '@syncnotes/types';
import { getReadableDeviceName } from '@syncnotes/utils';

const Pin = (LucideIcons as Record<string, any>).Pin || LucideIcons.Sun;
const Archive = (LucideIcons as Record<string, any>).Archive || LucideIcons.Sun;
const Trash2 = (LucideIcons as Record<string, any>).Trash2 || LucideIcons.Sun;
const RotateCcw = (LucideIcons as Record<string, any>).RotateCcw || LucideIcons.Sun;
const FileText = (LucideIcons as Record<string, any>).FileText || LucideIcons.Sun;
const Smartphone = (LucideIcons as Record<string, any>).Smartphone || LucideIcons.Sun;
const Monitor = (LucideIcons as Record<string, any>).Monitor || LucideIcons.Sun;

export type ViewFilter = 'ALL' | 'PINNED' | 'ARCHIVED' | 'TRASH';

interface NotesListProps {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  filter: ViewFilter;
  onFilterChange: (f: ViewFilter) => void;
  onTogglePin: (id: string, e: React.MouseEvent) => void;
  onToggleArchive: (id: string, e: React.MouseEvent) => void;
  onSoftDelete: (id: string, e: React.MouseEvent) => void;
  onRestore: (id: string, e: React.MouseEvent) => void;
}

export const NotesList: React.FC<NotesListProps> = ({
  notes,
  selectedNoteId,
  onSelectNote,
  filter,
  onFilterChange,
  onTogglePin,
  onToggleArchive,
  onSoftDelete,
  onRestore,
}) => {
  const filteredNotes = notes.filter((note) => {
    if (filter === 'PINNED') return note.pinned && !note.archived && !note.deleted;
    if (filter === 'ARCHIVED') return note.archived && !note.deleted;
    if (filter === 'TRASH') return note.deleted;
    return !note.archived && !note.deleted;
  });

  // Strip HTML tags for clean text preview snippet
  const getPreviewText = (htmlOrText: string) => {
    const tmp = document.createElement('DIV');
    tmp.innerHTML = htmlOrText;
    const text = tmp.textContent || tmp.innerText || '';
    return text.trim() || 'No additional text';
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <div className="w-80 border-r border-continuum-borderLight dark:border-continuum-borderDark bg-continuum-sidebarLight dark:bg-continuum-sidebarDark flex flex-col shrink-0 select-none overflow-hidden">
      {/* Category Navigation Bar */}
      <div className="p-2 border-b border-continuum-borderLight dark:border-continuum-borderDark flex items-center justify-around gap-1 text-[11px] font-medium text-continuum-subtextLight dark:text-continuum-subtextDark">
        {(['ALL', 'PINNED', 'ARCHIVED', 'TRASH'] as ViewFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-3 py-1.5 rounded-xl transition-all duration-200 ${
              filter === f
                ? 'bg-continuum-cardLight dark:bg-continuum-cardDark text-continuum-amber font-bold shadow-xs border border-continuum-amber/30 scale-105'
                : 'hover:bg-black/5 dark:hover:bg-white/5 hover:text-continuum-textDark'
            }`}
          >
            {f === 'ALL' ? 'Notes' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Notes Stream */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredNotes.length === 0 ? (
          <div className="h-44 flex flex-col items-center justify-center text-center p-4 text-continuum-subtextLight dark:text-continuum-subtextDark">
            <FileText className="w-8 h-8 stroke-[1.5] mb-2 opacity-40 text-continuum-amber animate-pulse" />
            <p className="text-xs font-semibold">No notes in this view</p>
            <p className="text-[10px] opacity-70 mt-0.5">Create a note to start typing</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            const originDevice = getReadableDeviceName(note.deviceId);

            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-3.5 rounded-2xl cursor-pointer transition-all duration-200 border ${
                  isSelected
                    ? 'bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border-amber-500/50 text-continuum-textLight dark:text-continuum-textDark shadow-lg shadow-amber-500/5 translate-x-1'
                    : 'bg-continuum-cardLight dark:bg-continuum-cardDark border-continuum-borderLight dark:border-continuum-borderDark hover:border-amber-500/30 hover:bg-white/5 text-continuum-textLight dark:text-continuum-textDark hover:translate-x-0.5'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-1.5 truncate flex-1">
                    {note.pinned && (
                      <Pin className="w-3.5 h-3.5 text-continuum-amber fill-continuum-amber shrink-0 animate-bounce" />
                    )}
                    <h3 className="font-bold text-xs truncate tracking-tight">
                      {note.title.trim() || 'Untitled Note'}
                    </h3>
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {filter !== 'TRASH' ? (
                      <>
                        <button
                          onClick={(e) => onTogglePin(note.id, e)}
                          title={note.pinned ? 'Unpin' : 'Pin'}
                          className={`p-1 rounded-lg hover:bg-white/10 transition ${
                            note.pinned ? 'text-continuum-amber' : 'text-continuum-subtextLight dark:text-continuum-subtextDark'
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => onToggleArchive(note.id, e)}
                          title={note.archived ? 'Unarchive' : 'Archive'}
                          className="p-1 rounded-lg text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-white/10 transition"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => onSoftDelete(note.id, e)}
                          title="Delete"
                          className="p-1 rounded-lg text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-rose-500/20 hover:text-rose-500 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => onRestore(note.id, e)}
                        title="Restore Note"
                        className="p-1 rounded-lg hover:bg-emerald-500/20 text-emerald-500 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between gap-2 mt-2">
                  <p className="text-[11px] truncate flex-1 text-continuum-subtextLight dark:text-continuum-subtextDark leading-normal">
                    {getPreviewText(note.content)}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] font-semibold text-continuum-subtextLight dark:text-continuum-subtextDark whitespace-nowrap">
                    {originDevice === 'iPhone' ? (
                      <Smartphone className="w-3 h-3 text-amber-400" title="Created/updated on iPhone" />
                    ) : (
                      <Monitor className="w-3 h-3 text-sky-400" title="Created/updated on Windows" />
                    )}
                    <span>{formatDate(note.updatedAt)}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
