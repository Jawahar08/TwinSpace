import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import * as LucideIcons from 'lucide-react';
import type { Note, Attachment } from '@syncnotes/types';
import { extractAutoTitle } from '@syncnotes/utils';
import { Toolbar } from './Toolbar';
import { AttachmentList } from './AttachmentList';

const EyeOff = (LucideIcons as any).EyeOff || (LucideIcons as any).Eye;
const UploadCloud = (LucideIcons as any).UploadCloud || (LucideIcons as any).Upload;

interface EditorProps {
  note: Note | null;
  onSaveNote: (id: string, title: string, content: string) => void;
  attachments: Attachment[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => Promise<void>;
  isFocusMode: boolean;
  onExitFocusMode: () => void;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  onSaveNote,
  attachments,
  onUploadFile,
  onDeleteAttachment,
  isFocusMode,
  onExitFocusMode,
}) => {
  const [title, setTitle] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
    ],
    content: note?.content || '',
    onUpdate: ({ editor }) => {
      if (!note) return;
      const html = editor.getHTML();
      const autoTitle = extractAutoTitle(html, title);
      if (autoTitle !== title && (title === 'Untitled Note' || !title)) {
        setTitle(autoTitle);
      }
      triggerDebouncedSave(autoTitle || title, html);
    },
  });

  // Sync internal state when active note changes
  useEffect(() => {
    if (note) {
      setTitle(note.title);
      if (editor && editor.getHTML() !== note.content) {
        editor.commands.setContent(note.content || '');
      }
    }
  }, [note?.id, note?.content, note?.title]);

  const triggerDebouncedSave = (newTitle: string, newContent: string) => {
    if (!note) return;
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      onSaveNote(note.id, newTitle, newContent);
    }, 400);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    if (editor) {
      triggerDebouncedSave(newTitle, editor.getHTML());
    }
  };

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editor) {
        editor.commands.focus('start');
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => onUploadFile(file));
    }
  };

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-continuum-subtextLight dark:text-continuum-subtextDark p-8 select-none bg-continuum-bgLight dark:bg-continuum-bgDark">
        <div className="w-16 h-16 rounded-2xl bg-continuum-amber/10 flex items-center justify-center mb-3 text-continuum-amber">
          <UploadCloud className="w-8 h-8 opacity-70" />
        </div>
        <p className="text-sm font-semibold text-continuum-textLight dark:text-continuum-textDark">
          Select a note or create a new one
        </p>
        <p className="text-xs text-continuum-subtextLight dark:text-continuum-subtextDark mt-1">
          Your changes will automatically sync across Windows and iPhone
        </p>
      </div>
    );
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`flex-1 flex flex-col h-full bg-continuum-cardLight dark:bg-continuum-cardDark overflow-hidden relative ${
        isDragOver ? 'ring-2 ring-continuum-amber ring-inset' : ''
      }`}
    >
      {/* Drag & Drop Visual Overlay */}
      {isDragOver && (
        <div className="absolute inset-0 z-30 bg-continuum-amber/15 backdrop-blur-xs flex flex-col items-center justify-center text-continuum-amber font-bold pointer-events-none">
          <UploadCloud className="w-12 h-12 mb-2 animate-bounce" />
          <p className="text-sm">Drop file to attach to note</p>
        </div>
      )}

      {/* Floating Exit Focus Mode Button */}
      {isFocusMode && (
        <button
          onClick={onExitFocusMode}
          className="absolute top-4 right-4 z-40 bg-continuum-amber text-white px-3 py-1.5 rounded-xl text-xs font-semibold shadow-lg flex items-center gap-1.5 hover:bg-continuum-amberDark transition active:scale-95"
        >
          <EyeOff className="w-3.5 h-3.5" />
          <span>Exit Focus Mode</span>
        </button>
      )}

      {/* Rich Text Formatting Toolbar */}
      {!isFocusMode && <Toolbar editor={editor} />}

      {/* Main Editor Canvas Body */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto flex flex-col">
        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Untitled Note"
          className="w-full text-3xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-continuum-amber/30 pb-3 mb-6 text-continuum-textLight dark:text-continuum-textDark placeholder-continuum-subtextLight dark:placeholder-continuum-subtextDark transition tracking-tight"
        />

        {/* Tiptap Editor Content */}
        <div
          className="flex-1 text-continuum-textLight dark:text-continuum-textDark text-sm cursor-text min-h-[350px]"
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Inline Attachments Section */}
      {!isFocusMode && (
        <AttachmentList
          attachments={attachments}
          onUploadFile={onUploadFile}
          onDeleteAttachment={onDeleteAttachment}
        />
      )}
    </div>
  );
};
