import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import type { Note, Attachment } from '@syncnotes/types';
import { Toolbar } from './Toolbar';
import { AttachmentList } from './AttachmentList';

interface EditorProps {
  note: Note | null;
  onSaveNote: (id: string, title: string, content: string) => void;
  attachments: Attachment[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => Promise<void>;
}

export const Editor: React.FC<EditorProps> = ({
  note,
  onSaveNote,
  attachments,
  onUploadFile,
  onDeleteAttachment,
}) => {
  const [title, setTitle] = useState('');
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
      triggerDebouncedSave(title, html);
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
    }, 500);
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

  if (!note) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-apple-subtextLight dark:text-apple-subtextDark p-8 select-none">
        <p className="text-sm font-medium">Select a note or create a new one to start typing</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-apple-cardLight dark:bg-apple-cardDark overflow-hidden">
      {/* Rich Text Formatting Toolbar */}
      <Toolbar editor={editor} />

      {/* Main Editor Body */}
      <div className="flex-1 overflow-y-auto p-8 max-w-4xl w-full mx-auto flex flex-col">
        {/* Note Title Input */}
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          onKeyDown={handleTitleKeyDown}
          placeholder="Title"
          className="w-full text-3xl font-bold bg-transparent outline-none border-b border-transparent focus:border-gray-200 dark:focus:border-gray-800 pb-2 mb-4 text-apple-textLight dark:text-apple-textDark placeholder-apple-subtextLight dark:placeholder-apple-subtextDark transition"
        />

        {/* Tiptap Editor Content */}
        <div
          className="flex-1 text-apple-textLight dark:text-apple-textDark text-sm cursor-text min-h-[300px]"
          onClick={() => {
            if (editor && !editor.isFocused) {
              editor.commands.focus('end');
            }
          }}
        >
          <EditorContent editor={editor} />
        </div>
      </div>

      {/* Attachments Section */}
      <AttachmentList
        attachments={attachments}
        onUploadFile={onUploadFile}
        onDeleteAttachment={onDeleteAttachment}
      />
    </div>
  );
};
