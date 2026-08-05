import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { TwinSpaceMetrics } from '../sync/syncEngine';
import { TwinSpaceLiveModule } from './TwinSpaceLiveModule';
import type { ThemeMode } from '@syncnotes/utils';

const SquarePen = (LucideIcons as Record<string, any>).SquarePen || LucideIcons.Sun;
const Search = LucideIcons.Search;
const Sun = LucideIcons.Sun;
const Moon = LucideIcons.Moon;
const Laptop = (LucideIcons as Record<string, any>).Laptop || LucideIcons.Sun;
const LogOut = LucideIcons.LogOut;
const PanelRight = (LucideIcons as Record<string, any>).PanelRight || LucideIcons.Sun;
const Eye = (LucideIcons as Record<string, any>).Eye || LucideIcons.Sun;
const Command = (LucideIcons as Record<string, any>).Command || LucideIcons.Sun;

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onNewNote: () => void;
  metrics: TwinSpaceMetrics;
  onOpenTwinSpacePanel: () => void;
  updatedJustNow: boolean;
  updatedFromDevice?: 'Windows' | 'iPhone' | 'Device';
  themeMode: ThemeMode;
  onCycleTheme: () => void;
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
  metrics,
  onOpenTwinSpacePanel,
  updatedJustNow,
  updatedFromDevice = 'iPhone',
  themeMode,
  onCycleTheme,
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
      <div className="flex items-center gap-3 shrink-0">
        <div className="relative group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-continuum-amber to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-lg tracking-tight transition-transform duration-300 group-hover:scale-105 animate-glow-pulse">
            TS
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-continuum-sidebarDark animate-ping" />
        </div>

        <div className="hidden sm:flex flex-col">
          <span className="font-extrabold text-sm tracking-tight text-continuum-textLight dark:text-continuum-textDark">
            Twin<span className="text-continuum-amber">Space</span>
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

      {/* Center Prominent TwinSpace Live Module */}
      <div className="flex-1 flex justify-center items-center max-w-md">
        <TwinSpaceLiveModule metrics={metrics} onClick={onOpenTwinSpacePanel} />
      </div>

      {/* Status & Actions Bar */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Remote Device Update Toast */}
        {updatedJustNow && (
          <span className="text-[10px] font-bold bg-amber-500/20 text-amber-400 px-3 py-1 rounded-full border border-amber-500/40 flex items-center gap-1.5 shadow-md animate-scale-in">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            Updated from {updatedFromDevice}
          </span>
        )}

        {/* Global Search Button */}
        <button
          onClick={onOpenCommandPalette}
          title="Search Notes (Ctrl+K)"
          className="p-1.5 rounded-xl text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-black/10 dark:hover:bg-white/10 transition"
        >
          <Search className="w-4 h-4" />
        </button>

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

        {/* Theme Cycle Button (Dark / Light / System) */}
        <button
          onClick={onCycleTheme}
          title={`Current theme: ${themeMode.toUpperCase()}. Click to cycle.`}
          aria-label={`Current theme: ${themeMode}. Click to switch.`}
          className="p-1.5 rounded-xl text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-black/10 dark:hover:bg-white/10 transition-all duration-200 active:scale-90 flex items-center gap-1 text-xs font-semibold"
        >
          {themeMode === 'dark' ? (
            <Moon className="w-4 h-4 text-amber-400" />
          ) : themeMode === 'light' ? (
            <Sun className="w-4 h-4 text-amber-500" />
          ) : (
            <Laptop className="w-4 h-4 text-sky-400" />
          )}
          <span className="text-[10px] uppercase font-bold hidden xl:inline">{themeMode}</span>
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
