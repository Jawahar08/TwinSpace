import React from 'react';
import type { Note } from '@syncnotes/types';
import { Pin, Archive, Trash2, RotateCcw, FileText } from 'lucide-react';

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
    <div className="w-80 border-r border-gray-200 dark:border-gray-800 bg-apple-sidebarLight dark:bg-apple-sidebarDark flex flex-col shrink-0 select-none">
      {/* Category Filter Pills */}
      <div className="p-2 border-b border-gray-200 dark:border-gray-800/80 flex items-center justify-around gap-1 text-[11px] font-medium text-apple-subtextLight dark:text-apple-subtextDark">
        {(['ALL', 'PINNED', 'ARCHIVED', 'TRASH'] as ViewFilter[]).map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-2.5 py-1 rounded-lg transition ${
              filter === f
                ? 'bg-apple-cardLight dark:bg-apple-cardDark text-apple-yellow font-semibold shadow-xs'
                : 'hover:bg-gray-200/50 dark:hover:bg-gray-800/50'
            }`}
          >
            {f === 'ALL' ? 'Notes' : f.charAt(0) + f.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {/* Notes Items List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredNotes.length === 0 ? (
          <div className="h-40 flex flex-col items-center justify-center text-center p-4 text-apple-subtextLight dark:text-apple-subtextDark">
            <FileText className="w-8 h-8 stroke-[1.5] mb-2 opacity-50" />
            <p className="text-xs font-medium">No notes found</p>
          </div>
        ) : (
          filteredNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;
            return (
              <div
                key={note.id}
                onClick={() => onSelectNote(note.id)}
                className={`group relative p-3 rounded-xl cursor-pointer transition-all duration-150 ${
                  isSelected
                    ? 'bg-apple-yellow text-white shadow-md'
                    : 'bg-apple-cardLight dark:bg-apple-cardDark hover:bg-white/80 dark:hover:bg-gray-800/80 text-apple-textLight dark:text-apple-textDark'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3
                    className={`font-semibold text-xs truncate flex-1 ${
                      isSelected ? 'text-white' : 'text-apple-textLight dark:text-apple-textDark'
                    }`}
                  >
                    {note.title.trim() || 'Untitled Note'}
                  </h3>

                  {/* Actions Bar */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {filter !== 'TRASH' ? (
                      <>
                        <button
                          onClick={(e) => onTogglePin(note.id, e)}
                          title={note.pinned ? 'Unpin' : 'Pin'}
                          className={`p-1 rounded hover:bg-black/10 transition ${
                            note.pinned ? 'text-apple-yellow fill-apple-yellow' : ''
                          }`}
                        >
                          <Pin className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => onToggleArchive(note.id, e)}
                          title={note.archived ? 'Unarchive' : 'Archive'}
                          className="p-1 rounded hover:bg-black/10 transition"
                        >
                          <Archive className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => onSoftDelete(note.id, e)}
                          title="Delete"
                          className="p-1 rounded hover:bg-black/10 hover:text-red-500 transition"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={(e) => onRestore(note.id, e)}
                        title="Restore Note"
                        className="p-1 rounded hover:bg-black/10 text-emerald-500 transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline gap-2 mt-1">
                  <span
                    className={`text-[10px] whitespace-nowrap font-medium ${
                      isSelected ? 'text-white/80' : 'text-apple-subtextLight dark:text-apple-subtextDark'
                    }`}
                  >
                    {formatDate(note.updatedAt)}
                  </span>
                  <p
                    className={`text-[11px] truncate flex-1 ${
                      isSelected ? 'text-white/90' : 'text-apple-subtextLight dark:text-apple-subtextDark'
                    }`}
                  >
                    {getPreviewText(note.content)}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
