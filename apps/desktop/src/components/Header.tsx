import React from 'react';
import { SquarePen, Search, Sun, Moon, LogOut, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import type { SyncState } from '../sync/syncEngine';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewNote: () => void;
  syncState: SyncState;
  updatedJustNow: boolean;
  darkMode: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  userEmail?: string;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNewNote,
  syncState,
  updatedJustNow,
  darkMode,
  onToggleTheme,
  onSignOut,
  userEmail,
}) => {
  return (
    <header className="h-14 border-b border-gray-200 dark:border-gray-800 bg-apple-sidebarLight dark:bg-apple-sidebarDark px-4 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Brand & New Note */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-xl bg-apple-yellow flex items-center justify-center text-white shadow-sm font-bold text-sm">
          SN
        </div>
        <span className="font-semibold text-sm tracking-tight text-apple-textLight dark:text-apple-textDark hidden sm:inline">
          SyncNotes
        </span>
        <button
          onClick={onNewNote}
          title="New Note (Ctrl+N)"
          className="p-1.5 rounded-lg bg-apple-yellow/10 text-apple-yellow hover:bg-apple-yellow/20 active:scale-95 transition"
        >
          <SquarePen className="w-4 h-4" />
        </button>
      </div>

      {/* Search Input */}
      <div className="flex-1 max-w-sm relative">
        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-apple-subtextLight dark:text-apple-subtextDark" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search notes and attachments..."
          className="w-full bg-apple-cardLight dark:bg-apple-cardDark border border-gray-200 dark:border-gray-700/60 rounded-xl pl-9 pr-3 py-1.5 text-xs outline-none focus:ring-2 focus:ring-apple-yellow/50 text-apple-textLight dark:text-apple-textDark placeholder-apple-subtextLight dark:placeholder-apple-subtextDark transition"
        />
      </div>

      {/* Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Remote Update Toast Badge */}
        {updatedJustNow && (
          <span className="text-[11px] font-medium bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 px-2.5 py-0.5 rounded-full animate-pulse border border-emerald-500/20">
            Updated just now
          </span>
        )}

        {/* Sync Status Badge */}
        <div className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full bg-gray-200/50 dark:bg-gray-800 text-apple-subtextLight dark:text-apple-subtextDark">
          {syncState === 'CONNECTED' ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-500" />
              <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">Synced</span>
            </>
          ) : syncState === 'CONNECTING' || syncState === 'RECONNECTING' ? (
            <>
              <RefreshCw className="w-3 h-3 text-apple-yellow animate-spin" />
              <span className="text-[11px] font-medium text-apple-yellow">Syncing</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-medium text-amber-500">Offline</span>
            </>
          )}
        </div>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          className="p-1.5 rounded-lg text-apple-subtextLight dark:text-apple-subtextDark hover:bg-gray-200 dark:hover:bg-gray-800 transition"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-gray-600" />}
        </button>

        {/* Sign Out */}
        {userEmail && (
          <button
            onClick={onSignOut}
            title={`Sign out (${userEmail})`}
            className="p-1.5 rounded-lg text-apple-subtextLight dark:text-apple-subtextDark hover:bg-red-500/10 hover:text-red-500 transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
