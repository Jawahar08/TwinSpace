import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { TwinSpaceMetrics } from '../sync/syncEngine';

const Monitor = (LucideIcons as Record<string, any>).Monitor || LucideIcons.Sun;
const Smartphone = (LucideIcons as Record<string, any>).Smartphone || LucideIcons.Sun;
const ShieldCheck = (LucideIcons as Record<string, any>).ShieldCheck || LucideIcons.Sun;
const Zap = (LucideIcons as Record<string, any>).Zap || LucideIcons.Sun;
const X = (LucideIcons as Record<string, any>).X || LucideIcons.Sun;
const RefreshCw = (LucideIcons as Record<string, any>).RefreshCw || LucideIcons.Sun;

interface TwinSpacePanelProps {
  isOpen: boolean;
  onClose: () => void;
  metrics: TwinSpaceMetrics;
  onForceSync: () => void;
}

export const TwinSpacePanel: React.FC<TwinSpacePanelProps> = ({
  isOpen,
  onClose,
  metrics,
  onForceSync,
}) => {
  if (!isOpen) return null;

  const formatDate = (isoStr: string | null) => {
    if (!isoStr) return 'Never';
    return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-scale-in">
      <div className="bg-continuum-cardLight dark:bg-continuum-cardDark border border-continuum-borderLight dark:border-continuum-borderDark rounded-3xl p-6 w-full max-w-md shadow-2xl text-continuum-textLight dark:text-continuum-textDark select-none">
        {/* Panel Header */}
        <div className="flex items-center justify-between border-b border-continuum-borderLight dark:border-continuum-borderDark pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-amber-400 via-continuum-amber to-amber-600 flex items-center justify-center text-white font-black text-xs shadow-md">
              TS
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight text-continuum-textLight dark:text-continuum-textDark">
                TwinSpace Live Continuity
              </h3>
              <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark font-semibold block">
                Private 1:1 Personal Device Bridge
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-xl text-continuum-subtextLight dark:text-continuum-subtextDark hover:bg-black/10 dark:hover:bg-white/10 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Device Cards Grid */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {/* Windows Node Card */}
          <div className="bg-continuum-sidebarLight dark:bg-continuum-sidebarDark border border-continuum-borderLight dark:border-continuum-borderDark p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-sky-500/15 text-sky-400">
                <Monitor className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Active Node
              </span>
            </div>
            <p className="font-extrabold text-xs text-continuum-textLight dark:text-continuum-textDark">
              Windows Workstation
            </p>
            <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark block mt-0.5">
              Desktop Native Host
            </span>
          </div>

          {/* iPhone Node Card */}
          <div className="bg-continuum-sidebarLight dark:bg-continuum-sidebarDark border border-continuum-borderLight dark:border-continuum-borderDark p-3 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <Smartphone className="w-4 h-4" />
              </div>
              <span className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                Linked
              </span>
            </div>
            <p className="font-extrabold text-xs text-continuum-textLight dark:text-continuum-textDark">
              iPhone Mobile
            </p>
            <span className="text-[10px] text-continuum-subtextLight dark:text-continuum-subtextDark block mt-0.5">
              iOS Companion App
            </span>
          </div>
        </div>

        {/* Realtime Health & Connection Metrics */}
        <div className="space-y-2 mb-5 text-xs">
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-continuum-sidebarLight dark:bg-continuum-sidebarDark border border-continuum-borderLight dark:border-continuum-borderDark">
            <span className="text-continuum-subtextLight dark:text-continuum-subtextDark">Connection Protocol</span>
            <span className="font-bold text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5 fill-emerald-400" /> STOMP WebSocket
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-continuum-sidebarLight dark:bg-continuum-sidebarDark border border-continuum-borderLight dark:border-continuum-borderDark">
            <span className="text-continuum-subtextLight dark:text-continuum-subtextDark">Round-trip Latency</span>
            <span className="font-bold text-continuum-amber">{metrics.latencyMs} ms</span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-continuum-sidebarLight dark:bg-continuum-sidebarDark border border-continuum-borderLight dark:border-continuum-borderDark">
            <span className="text-continuum-subtextLight dark:text-continuum-subtextDark">Last Remote Sync</span>
            <span className="font-semibold text-continuum-textLight dark:text-continuum-textDark">
              {formatDate(metrics.lastSyncedAt)} (from {metrics.lastRemoteDevice})
            </span>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-continuum-sidebarLight dark:bg-continuum-sidebarDark border border-continuum-borderLight dark:border-continuum-borderDark">
            <span className="text-continuum-subtextLight dark:text-continuum-subtextDark">Pending Local Outbox</span>
            <span className="font-semibold text-continuum-textLight dark:text-continuum-textDark">
              {metrics.pendingCount} items
            </span>
          </div>
        </div>

        {/* Privacy Note */}
        <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-5 text-[11px]">
          <ShieldCheck className="w-4 h-4 text-continuum-amber shrink-0 mt-0.5" />
          <p className="text-continuum-subtextLight dark:text-continuum-subtextDark leading-normal">
            TwinSpace is your private device-to-device continuity link. Your notes and attachments sync exclusively between your authenticated devices with end-to-end user isolation.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={onForceSync}
            className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold py-2 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Force Resync Now
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-continuum-borderLight dark:border-continuum-borderDark hover:bg-black/5 dark:hover:bg-white/5 text-xs font-semibold transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
