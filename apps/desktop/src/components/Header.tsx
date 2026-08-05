import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { SyncState } from '../sync/syncEngine';

const SquarePen = (LucideIcons as Record<string, any>).SquarePen || LucideIcons.Sun;
const Search = LucideIcons.Search;
const Sun = LucideIcons.Sun;
const Moon = LucideIcons.Moon;
const LogOut = LucideIcons.LogOut;
const Wifi = LucideIcons.Wifi;
const WifiOff = LucideIcons.WifiOff;
const RefreshCw = LucideIcons.RefreshCw;
const PanelRight = (LucideIcons as Record<string, any>).PanelRight || LucideIcons.Sun;
const Eye = (LucideIcons as Record<string, any>).Eye || LucideIcons.Sun;
const Command = (LucideIcons as Record<string, any>).Command || LucideIcons.Sun;

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewNote: () => void;
  syncState: SyncState;
  updatedJustNow: boolean;
  updatedFromDevice?: 'Windows' | 'iPhone' | 'Device';
  darkMode: boolean;
  onToggleTheme: () => void;
  onSignOut: () => void;
  userEmail?: string;
  onOpenCommandPalette: () => void;
  onToggleFocusMode: () => void;
  isRightDrawerOpen: boolean;
  onToggleRightDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onNewNote,
  syncState,
  updatedJustNow,
  updatedFromDevice = 'iPhone',
  darkMode,
  onToggleTheme,
  onSignOut,
  userEmail,
  onOpenCommandPalette,
  onToggleFocusMode,
  isRightDrawerOpen,
  onToggleRightDrawer,
}) => {
  return (
    <header className="h-14 border-b border-continuum-borderLight dark:border-continuum-borderDark bg-continuum-sidebarLight dark:bg-continuum-sidebarDark px-4 flex items-center justify-between gap-4 select-none shrink-0">
      {/* Brand Identity & Quick Create */}
      <div className="flex items-center gap-3">
        <div className="relative group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-continuum-amber to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-lg tracking-tight transition-transform duration-300 group-hover:scale-105 animate-glow-pulse">
            TS
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-continuum-sidebarDark animate-ping" />
        </div>

        <div className="hidden sm:flex flex-col">
          <span className="font-extrabold text-sm tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent">
            TwinSpace
          </span>
          <span className="text-[9px] font-bold text-continuum-amber tracking-widest uppercase">
            Continuum
          </span>
        </div>

        <button
          onClick={onNewNote}
          title="New Note (Ctrl+N)"
          className="p-1.5 rounded-xl bg-continuum-amber/15 text-continuum-amber hover:bg-continuum-amber/25 active:scale-95 transition-all duration-200 flex items-center gap-1 text-xs font-bold border border-continuum-amber/30 shadow-xs hover:shadow-md"
        >
          <SquarePen className="w-4 h-4" />
          <span className="hidden md:inline">Note</span>
        </button>
      </div>

      {/* Global Search & Command Palette Trigger */}
      <div className="flex-1 max-w-sm relative flex items-center">
        <Search className="w-3.5 h-3.5 absolute left-3 text-continuum-subtextLight dark:text-continuum-subtextDark pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          onClick={onOpenCommandPalette}
          placeholder="Search notes or press Ctrl+K..."
          className="w-full bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark rounded-xl pl-9 pr-12 py-1.5 text-xs outline-none focus:ring-2 focus:ring-continuum-amber/50 hover:border-continuum-amber/40 text-continuum-textLight dark:text-continuum-textDark placeholder-continuum-subtextLight dark:placeholder-continuum-subtextDark transition-all cursor-pointer shadow-xs"
        />
        <button
          onClick={onOpenCommandPalette}
          className="absolute right-2 px-1.5 py-0.5 rounded-md bg-black/10 dark:bg-white/10 text-[10px] font-semibold text-continuum-subtextLight dark:text-continuum-subtextDark flex items-center gap-0.5 hover:bg-continuum-amber/20 hover:text-continuum-amber transition"
        >
          <Command className="w-2.5 h-2.5" />
          <span>K</span>
        </button>
      </div>

      {/* Status & Actions Bar */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Remote Device Update Toast */}
        {updatedJustNow && (
          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-md animate-scale-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Updated from {updatedFromDevice}
          </span>
        )}

        {/* Realtime Connection State Badge */}
        <div className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark text-continuum-subtextLight dark:text-continuum-subtextDark shadow-xs">
          {syncState === 'CONNECTED' ? (
            <>
              <Wifi className="w-3 h-3 text-emerald-500 animate-pulse" />
              <span className="text-[11px] font-semibold text-emerald-500 hidden sm:inline">Synced</span>
            </>
          ) : syncState === 'CONNECTING' || syncState === 'RECONNECTING' ? (
            <>
              <RefreshCw className="w-3 h-3 text-continuum-amber animate-spin" />
              <span className="text-[11px] font-semibold text-continuum-amber hidden sm:inline">Syncing</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3 h-3 text-amber-500" />
              <span className="text-[11px] font-semibold text-amber-500 hidden sm:inline">Offline</span>
            </>
          )}
        </div>

        {/* Focus Mode Trigger */}
        <button
          onClick={onToggleFocusMode}
          title="Distraction-Free Focus Mode"
          className="p-1.5 rounded-xl text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-sky-500/15 hover:text-sky-400 transition-all duration-200 active:scale-90"
        >
          <Eye className="w-4 h-4 text-sky-400" />
        </button>

        {/* Right Drawer Toggle */}
        <button
          onClick={onToggleRightDrawer}
          title="Toggle Note Details & Attachments Fabric"
          className={`p-1.5 rounded-xl transition-all duration-200 active:scale-90 ${
            isRightDrawerOpen
              ? 'bg-continuum-amber/20 text-continuum-amber font-bold border border-continuum-amber/30'
              : 'text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-white/10'
          }`}
        >
          <PanelRight className="w-4 h-4" />
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleTheme}
          title="Toggle Theme"
          className="p-1.5 rounded-xl text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-white/10 transition-all duration-200 active:scale-90"
        >
          {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Sign Out */}
        {userEmail && (
          <button
            onClick={onSignOut}
            title={`Sign out (${userEmail})`}
            className="p-1.5 rounded-xl text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-rose-500/15 hover:text-rose-500 transition-all duration-200 active:scale-90"
          >
            <LogOut className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
};
