import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';

const Database = (LucideIcons as Record<string, any>).Database || LucideIcons.Sun;
const Key = (LucideIcons as Record<string, any>).Key || LucideIcons.Sun;
const CheckCircle2 = (LucideIcons as Record<string, any>).CheckCircle2 || LucideIcons.Sun;
const ExternalLink = (LucideIcons as Record<string, any>).ExternalLink || LucideIcons.Sun;
const X = (LucideIcons as Record<string, any>).X || LucideIcons.Sun;

interface NotionSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NotionSettingsModal: React.FC<NotionSettingsModalProps> = ({ isOpen, onClose }) => {
  const [apiKey, setApiKey] = useState('');
  const [databaseId, setDatabaseId] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const savedKey = localStorage.getItem('twinspace_notion_key') || '';
      const savedDb = localStorage.getItem('twinspace_notion_db') || '';
      setApiKey(savedKey);
      setDatabaseId(savedDb);
      if (savedKey && savedDb) {
        setIsSaved(true);
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('twinspace_notion_key', apiKey.trim());
    localStorage.setItem('twinspace_notion_db', databaseId.trim());
    setIsSaved(true);
    setStatusMessage('✅ Notion Database integration credentials saved successfully!');
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleClear = () => {
    localStorage.removeItem('twinspace_notion_key');
    localStorage.removeItem('twinspace_notion_db');
    setApiKey('');
    setDatabaseId('');
    setIsSaved(false);
    setStatusMessage('Notion Database integration disconnected.');
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-background)] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--modal-surface)] border border-[var(--border-strong)] rounded-3xl p-8 w-full max-w-lg shadow-2xl animate-scale-in relative text-[var(--text-primary)]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--modal-surface-raised)] transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-[var(--accent-primary)] to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 text-white font-black text-xl animate-glow-pulse">
            <Database className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Notion Database Integration
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium leading-relaxed">
            Mirror 6-digit pairing codes, user accounts, and device sessions to your personal Notion Workspace.
          </p>
        </div>

        {statusMessage && (
          <div className="mb-4 p-3 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-400 font-bold text-xs text-center animate-scale-in">
            {statusMessage}
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1.5">
              Notion Integration API Secret Key
            </label>
            <div className="relative">
              <Key className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--accent-primary)]" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="secret_..."
                className="w-full bg-[var(--input-background)] border border-[var(--border-strong)] rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] transition-all shadow-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1.5">
              Notion Database ID
            </label>
            <div className="relative">
              <Database className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--accent-primary)]" />
              <input
                type="text"
                value={databaseId}
                onChange={(e) => setDatabaseId(e.target.value)}
                placeholder="32-character Notion Database ID"
                className="w-full bg-[var(--input-background)] border border-[var(--border-strong)] rounded-xl pl-10 pr-4 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] transition-all shadow-xs"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 text-white font-extrabold py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              <CheckCircle2 className="w-4 h-4" /> {isSaved ? 'Update Connection' : 'Save Notion Key'}
            </button>
            {isSaved && (
              <button
                type="button"
                onClick={handleClear}
                className="px-4 py-2.5 rounded-xl border border-rose-500/40 text-rose-400 hover:bg-rose-500/10 font-bold text-xs transition"
              >
                Disconnect
              </button>
            )}
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-[var(--border-default)] text-[11px] text-[var(--text-secondary)]">
          <span className="font-extrabold text-[var(--text-primary)] block mb-1">
            Notion Setup Guide:
          </span>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Create an integration at <a href="https://www.notion.so/my-integrations" target="_blank" rel="noreferrer" className="text-[var(--accent-primary)] underline inline-flex items-center gap-0.5">notion.so/my-integrations <ExternalLink className="w-3 h-3" /></a></li>
            <li>Create a Notion Database named <strong>TwinSpace Sync Registry</strong> with properties: <code>Pairing Code</code> (Title), <code>User Email</code> (Email), <code>Linked Devices</code> (Multi-select).</li>
            <li>Share the Notion page with your Integration connection.</li>
          </ol>
        </div>
      </div>
    </div>
  );
};
