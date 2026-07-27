import React from 'react';
import type { Editor } from '@tiptap/react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Quote,
} from 'lucide-react';

interface ToolbarProps {
  editor: Editor | null;
}

export const Toolbar: React.FC<ToolbarProps> = ({ editor }) => {
  if (!editor) return null;

  const btnClass = (isActive: boolean) =>
    `p-1.5 rounded-lg transition ${
      isActive
        ? 'bg-apple-yellow text-white shadow-xs'
        : 'text-apple-subtextLight dark:text-apple-subtextDark hover:bg-gray-200 dark:hover:bg-gray-800'
    }`;

  return (
    <div className="h-10 border-b border-gray-200 dark:border-gray-800 px-4 flex items-center gap-1 bg-apple-cardLight dark:bg-apple-cardDark shrink-0">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={btnClass(editor.isActive('bold'))}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={btnClass(editor.isActive('italic'))}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={btnClass(editor.isActive('underline'))}
        title="Underline (Ctrl+U)"
      >
        <Underline className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={btnClass(editor.isActive('bulletList'))}
        title="Bullet List"
      >
        <List className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={btnClass(editor.isActive('orderedList'))}
        title="Numbered List"
      >
        <ListOrdered className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        className={btnClass(editor.isActive('taskList'))}
        title="Checklist"
      >
        <CheckSquare className="w-4 h-4" />
      </button>

      <div className="w-px h-4 bg-gray-300 dark:bg-gray-700 mx-1" />

      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={btnClass(editor.isActive('codeBlock'))}
        title="Code Block"
      >
        <Code className="w-4 h-4" />
      </button>

      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={btnClass(editor.isActive('blockquote'))}
        title="Quote"
      >
        <Quote className="w-4 h-4" />
      </button>
    </div>
  );
};
