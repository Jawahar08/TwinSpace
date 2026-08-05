import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { Note, Attachment, DeviceActivity } from '@syncnotes/types';
import { calculateReadingStats, formatBytes, getReadableDeviceName } from '@syncnotes/utils';

const X = (LucideIcons as any).X;
const FileText = (LucideIcons as any).FileText;
const Paperclip = (LucideIcons as any).Paperclip;
const Zap = (LucideIcons as any).Zap || (LucideIcons as any).Activity;
const Phone = (LucideIcons as any).Phone || (LucideIcons as any).Smartphone;
const Laptop = (LucideIcons as any).Laptop || (LucideIcons as any).Monitor;
const Book = (LucideIcons as any).Book || (LucideIcons as any).BookOpen;
const Trash2 = (LucideIcons as any).Trash2;
const Download = (LucideIcons as any).Download;
const Upload = (LucideIcons as any).Upload || (LucideIcons as any).UploadCloud;

interface RightDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  note: Note | null;
  attachments: Attachment[];
  onUploadFile: (file: File) => Promise<void>;
  onDeleteAttachment: (id: string) => Promise<void>;
  deviceActivities: DeviceActivity[];
}

export const RightDrawer: React.FC<RightDrawerProps> = ({
  isOpen,
  onClose,
  note,
  attachments,
  onUploadFile,
  onDeleteAttachment,
  deviceActivities,
}) => {
  if (!isOpen) return null;

  const readingStats = calculateReadingStats(note?.content || '');
  const originDevice = getReadableDeviceName(note?.deviceId);

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach((file) => onUploadFile(file));
    }
  };

  return (
    <aside className="w-80 border-l border-continuum-borderLight dark:border-continuum-borderDark bg-continuum-sidebarLight dark:bg-continuum-sidebarDark flex flex-col shrink-0 select-none overflow-hidden animate-slide-in">
      {/* Drawer Header */}
      <div className="h-14 px-4 border-b border-continuum-borderLight dark:border-continuum-borderDark flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-continuum-textLight dark:text-continuum-textDark">
          Note Details & Fabric
        </span>
        <button
          onClick={onClose}
          className="p-1 rounded-lg text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Section 1: Note Metadata & Typography Metrics */}
        {note && (
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-continuum-subtextLight dark:text-continuum-subtextDark flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-continuum-amber" />
              <span>Metadata & Analytics</span>
            </h4>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-continuum-cardLight dark:bg-continuum-cardDark p-2.5 rounded-xl border border-continuum-borderLight dark:border-continuum-borderDark">
                <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark block">Words</span>
                <span className="font-bold text-continuum-textLight dark:text-continuum-textDark">{readingStats.wordCount}</span>
              </div>
              <div className="bg-continuum-cardLight dark:bg-continuum-cardDark p-2.5 rounded-xl border border-continuum-borderLight dark:border-continuum-borderDark">
                <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark block">Characters</span>
                <span className="font-bold text-continuum-textLight dark:text-continuum-textDark">{readingStats.charCount}</span>
              </div>
              <div className="bg-continuum-cardLight dark:bg-continuum-cardDark p-2.5 rounded-xl border border-continuum-borderLight dark:border-continuum-borderDark col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-continuum-subtextLight dark:text-continuum-subtextDark text-[11px]">
                  <Book className="w-3.5 h-3.5 text-continuum-amber" />
                  <span>Est. Reading Time</span>
                </div>
                <span className="font-semibold text-continuum-textLight dark:text-continuum-textDark text-xs">
                  {readingStats.readingTimeMinutes} min
                </span>
              </div>
              <div className="bg-continuum-cardLight dark:bg-continuum-cardDark p-2.5 rounded-xl border border-continuum-borderLight dark:border-continuum-borderDark col-span-2 space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-continuum-subtextLight dark:text-continuum-subtextDark">Created</span>
                  <span className="text-continuum-textLight dark:text-continuum-textDark font-medium">
                    {new Date(note.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-continuum-subtextLight dark:text-continuum-subtextDark">Origin Device</span>
                  <span className="flex items-center gap-1 text-continuum-amber font-semibold">
                    {originDevice === 'iPhone' ? <Phone className="w-3 h-3" /> : <Laptop className="w-3 h-3" />}
                    {originDevice}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Section 2: Attachment Fabric Shelf */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-[11px] font-semibold uppercase tracking-wider text-continuum-subtextLight dark:text-continuum-subtextDark flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-continuum-amber" />
              <span>Attachment Fabric ({attachments.length})</span>
            </h4>
          </div>

          {/* Drag & Drop Upload Dropzone */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            className="border-2 border-dashed border-continuum-borderLight dark:border-continuum-borderDark hover:border-continuum-amber/50 rounded-xl p-3 text-center transition cursor-pointer bg-continuum-cardLight/50 dark:bg-continuum-cardDark/50"
          >
            <Upload className="w-6 h-6 text-continuum-amber mx-auto mb-1 opacity-80" />
            <p className="text-[11px] text-continuum-textLight dark:text-continuum-textDark font-medium">
              Drag & Drop files here
            </p>
            <label className="text-[10px] text-continuum-amber font-semibold underline cursor-pointer mt-0.5 inline-block">
              or Browse Computer
              <input
                type="file"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    onUploadFile(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>

          {/* Attachments List */}
          <div className="space-y-2">
            {attachments.length === 0 ? (
              <p className="text-[11px] text-continuum-subtextLight dark:text-continuum-subtextDark italic text-center py-2">
                No attachments linked
              </p>
            ) : (
              attachments.map((att) => (
                <div
                  key={att.id}
                  className="bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark p-2.5 rounded-xl flex items-center justify-between gap-2 text-xs"
                >
                  <div className="truncate flex-1">
                    <p className="font-semibold text-continuum-textLight dark:text-continuum-textDark truncate">
                      {att.originalName}
                    </p>
                    <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark">
                      {formatBytes(att.byteSize)} • {att.mimeType.split('/')[1] || 'file'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {att.downloadUrl && (
                      <a
                        href={att.downloadUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded text-continuum-subtextLight dark:text-continuum-subtextDark hover:text-continuum-amber transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => onDeleteAttachment(att.id)}
                      className="p-1 rounded text-continuum-subtextLight dark:text-continuum-subtextDark hover:text-rose-500 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Section 3: Realtime Device Sync Stream */}
        <div className="space-y-3">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-continuum-subtextLight dark:text-continuum-subtextDark flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-emerald-500" />
            <span>Device Sync Activity</span>
          </h4>

          <div className="space-y-2">
            {deviceActivities.length === 0 ? (
              <p className="text-[11px] text-continuum-subtextLight dark:text-continuum-subtextDark italic text-center py-2">
                No recent remote events
              </p>
            ) : (
              deviceActivities.slice(0, 5).map((act) => (
                <div
                  key={act.id}
                  className="bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark p-2 rounded-xl flex items-start gap-2 text-[11px]"
                >
                  {act.deviceType === 'iPhone' ? (
                    <Phone className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                  ) : (
                    <Laptop className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 truncate">
                    <p className="font-semibold text-continuum-textLight dark:text-continuum-textDark truncate">
                      {act.operation} note: {act.noteTitle}
                    </p>
                    <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark">
                      from {act.deviceType} • {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </aside>
  );
};
