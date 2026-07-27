import React, { useRef } from 'react';
import type { Attachment } from '@syncnotes/types';
import { Paperclip, File, Image as ImageIcon, FileArchive, FileText, Trash2, Download, Plus } from 'lucide-react';

interface AttachmentListProps {
  attachments: Attachment[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => Promise<void>;
}

export const AttachmentList: React.FC<AttachmentListProps> = ({
  attachments,
  onUploadFile,
  onDeleteAttachment,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      await onUploadFile(file);
      e.target.value = '';
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-sky-500" />;
    if (mime.includes('zip') || mime.includes('compressed')) return <FileArchive className="w-4 h-4 text-amber-500" />;
    if (mime.includes('pdf') || mime.includes('document')) return <FileText className="w-4 h-4 text-emerald-500" />;
    return <File className="w-4 h-4 text-indigo-500" />;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <div className="border-t border-gray-200 dark:border-gray-800 p-4 bg-apple-sidebarLight/40 dark:bg-apple-sidebarDark/40">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-apple-subtextLight dark:text-apple-subtextDark">
          <Paperclip className="w-3.5 h-3.5" />
          <span>Attachments ({attachments.length})</span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs font-medium text-apple-yellow hover:text-yellow-600 transition"
        >
          <Plus className="w-3.5 h-3.5" /> Add Attachment
        </button>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {attachments.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-apple-cardLight dark:bg-apple-cardDark border border-gray-200 dark:border-gray-800 text-xs shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(att.mimeType)}
                <div className="truncate">
                  <p className="font-medium text-apple-textLight dark:text-apple-textDark truncate">
                    {att.originalName}
                  </p>
                  <p className="text-[10px] text-apple-subtextLight dark:text-apple-subtextDark">
                    {formatSize(att.byteSize)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {att.downloadUrl && (
                  <a
                    href={att.downloadUrl}
                    download={att.originalName}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 text-apple-subtextLight dark:text-apple-subtextDark hover:text-apple-yellow transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => onDeleteAttachment(att.id)}
                  className="p-1 rounded hover:bg-red-500/10 text-apple-subtextLight dark:text-apple-subtextDark hover:text-red-500 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
