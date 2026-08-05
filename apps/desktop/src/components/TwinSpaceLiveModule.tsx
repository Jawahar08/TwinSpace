import React from 'react';
import * as LucideIcons from 'lucide-react';
import type { TwinSpaceMetrics } from '../sync/syncEngine';

const Monitor = (LucideIcons as Record<string, any>).Monitor || LucideIcons.Sun;
const Smartphone = (LucideIcons as Record<string, any>).Smartphone || LucideIcons.Sun;
const Zap = (LucideIcons as Record<string, any>).Zap || LucideIcons.Sun;
const WifiOff = (LucideIcons as Record<string, any>).WifiOff || LucideIcons.Sun;
const RefreshCw = (LucideIcons as Record<string, any>).RefreshCw || LucideIcons.Sun;
const AlertCircle = (LucideIcons as Record<string, any>).AlertCircle || LucideIcons.Sun;

interface TwinSpaceLiveModuleProps {
  metrics: TwinSpaceMetrics;
  onClick: () => void;
}

export const TwinSpaceLiveModule: React.FC<TwinSpaceLiveModuleProps> = ({ metrics, onClick }) => {
  const isConnected = metrics.state === 'CONNECTED';
  const isSyncing = metrics.state === 'SYNCING';
  const isOffline = metrics.state === 'OFFLINE';
  const isReconnecting = metrics.state === 'RECONNECTING';

  return (
    <button
      onClick={onClick}
      title="TwinSpace Continuum — Click for Device Health & Sync Panel"
      className={`relative flex items-center gap-3 px-3 py-1.5 rounded-2xl border transition-all duration-300 select-none group shadow-sm hover:shadow-md cursor-pointer ${
        isSyncing
          ? 'bg-gradient-to-r from-amber-500/15 via-sky-500/15 to-amber-500/15 border-amber-500/50 shadow-amber-500/10'
          : isConnected
          ? 'bg-continuum-cardLight dark:bg-continuum-cardDark border-continuum-borderLight dark:border-continuum-borderDark hover:border-continuum-amber/50'
          : isOffline
          ? 'bg-amber-500/10 border-amber-500/30'
          : 'bg-rose-500/10 border-rose-500/30'
      }`}
    >
      {/* Node 1: Windows */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-sky-500/15 text-sky-400 font-bold">
          <Monitor className="w-3.5 h-3.5" />
          <span
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
              metrics.windowsNodeState === 'ONLINE' || metrics.windowsNodeState === 'SYNCING'
                ? 'bg-emerald-400 animate-ping'
                : 'bg-amber-500'
            }`}
          />
        </div>
        <span className="text-[11px] font-extrabold text-continuum-textLight dark:text-continuum-textDark inline-block">
          Windows
        </span>
      </div>

      {/* Animated Realtime SVG Sync Bridge */}
      <div className="relative flex items-center justify-center w-16 h-4">
        <svg className="w-full h-full overflow-visible" viewBox="0 0 64 16">
          <defs>
            <linearGradient id="bridgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>

          {/* Bridge Line */}
          <line
            x1="2"
            y1="8"
            x2="62"
            y2="8"
            stroke={isOffline ? '#f59e0b' : 'url(#bridgeGrad)'}
            strokeWidth="2.5"
            strokeDasharray={isOffline ? '3 3' : 'none'}
            strokeLinecap="round"
            className={isSyncing ? 'animate-pulse' : ''}
          />

          {/* Traveling Particle when Syncing */}
          {isSyncing && (
            <circle cx="32" cy="8" r="3.5" fill="#fbbf24" className="animate-ping">
              <animate attributeName="cx" values="2;62;2" dur="1.2s" repeatCount="indefinite" />
            </circle>
          )}

          {/* Breathing Pulse Circle when Connected */}
          {isConnected && !isSyncing && (
            <circle cx="32" cy="8" r="2.5" fill="#10b981" className="animate-node-breathe" />
          )}
        </svg>
      </div>

      {/* Node 2: iPhone */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex items-center justify-center w-6 h-6 rounded-lg bg-amber-500/15 text-amber-400 font-bold">
          <Smartphone className="w-3.5 h-3.5" />
          <span
            className={`absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full ${
              metrics.iphoneNodeState === 'ONLINE' || metrics.iphoneNodeState === 'SYNCING'
                ? 'bg-emerald-400 animate-ping'
                : 'bg-amber-500'
            }`}
          />
        </div>
        <span className="text-[11px] font-extrabold text-continuum-textLight dark:text-continuum-textDark inline-block">
          iPhone
        </span>
      </div>

      {/* Realtime Status Badge & Latency */}
      <div className="flex items-center gap-1.5 pl-1 border-l border-continuum-borderLight dark:border-continuum-borderDark">
        {isSyncing ? (
          <span className="text-[10px] font-bold text-continuum-amber flex items-center gap-1">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span className="hidden lg:inline">Syncing...</span>
          </span>
        ) : isConnected ? (
          <span className="text-[10px] font-bold text-emerald-400 flex items-center gap-1">
            <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
            <span className="hidden lg:inline">{metrics.latencyMs}ms</span>
          </span>
        ) : isOffline ? (
          <span className="text-[10px] font-bold text-amber-400 flex items-center gap-1">
            <WifiOff className="w-3 h-3" />
            <span className="hidden lg:inline">
              {metrics.pendingCount > 0 ? `${metrics.pendingCount} pending` : 'Offline'}
            </span>
          </span>
        ) : (
          <span className="text-[10px] font-bold text-rose-400 flex items-center gap-1">
            <AlertCircle className="w-3 h-3 animate-bounce" />
            <span className="hidden lg:inline">Reconnecting</span>
          </span>
        )}
      </div>
    </button>
  );
};
