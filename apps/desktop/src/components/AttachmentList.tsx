import React, { useRef } from 'react';
import type { Attachment } from '@syncnotes/types';
import { Paperclip, File, Image as ImageIcon, FileArchive, FileText, Trash2, Download, Plus } from 'lucide-react';
import { formatBytes } from '@syncnotes/utils';

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
    if (mime.startsWith('image/')) return <ImageIcon className="w-4 h-4 text-sky-400" />;
    if (mime.includes('zip') || mime.includes('compressed')) return <FileArchive className="w-4 h-4 text-amber-500" />;
    if (mime.includes('pdf') || mime.includes('document')) return <FileText className="w-4 h-4 text-emerald-500" />;
    return <File className="w-4 h-4 text-indigo-400" />;
  };

  return (
    <div className="border-t border-continuum-borderLight dark:border-continuum-borderDark p-4 bg-continuum-sidebarLight/50 dark:bg-continuum-sidebarDark/50 shrink-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-bold text-continuum-subtextLight dark:text-continuum-subtextDark uppercase tracking-wider">
          <Paperclip className="w-3.5 h-3.5 text-continuum-amber" />
          <span>Attachments ({attachments.length})</span>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1 text-xs font-semibold text-continuum-amber hover:text-amber-400 transition"
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
              className="flex items-center justify-between p-2.5 rounded-xl bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark text-xs shadow-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {getFileIcon(att.mimeType)}
                <div className="truncate">
                  <p className="font-semibold text-continuum-textLight dark:text-continuum-textDark truncate">
                    {att.originalName}
                  </p>
                  <p className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark">
                    {formatBytes(att.byteSize)}
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
                    className="p-1 rounded hover:bg-white/10 text-continuum-subtextLight dark:text-continuum-subtextDark hover:text-continuum-amber transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  onClick={() => onDeleteAttachment(att.id)}
                  className="p-1 rounded hover:bg-rose-500/20 text-continuum-subtextLight dark:text-continuum-subtextDark hover:text-rose-500 transition"
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
