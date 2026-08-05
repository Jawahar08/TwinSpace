import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

const Lock = LucideIcons.Lock;
const Mail = LucideIcons.Mail;
const UserPlus = LucideIcons.UserPlus;
const LogIn = LucideIcons.LogIn;
const KeyRound = (LucideIcons as Record<string, any>).KeyRound || LucideIcons.Sun;
const Smartphone = (LucideIcons as Record<string, any>).Smartphone || LucideIcons.Sun;
const Laptop = (LucideIcons as Record<string, any>).Laptop || LucideIcons.Sun;
const X = (LucideIcons as Record<string, any>).X || LucideIcons.Sun;

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
  onClose?: () => void;
  error?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLogin, onRegister, onClose, error }) => {
  const [authMode, setAuthMode] = useState<'LOGIN' | 'REGISTER' | 'CODE'>('CODE');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [syncCode, setSyncCode] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (authMode === 'REGISTER') {
        await onRegister(email, password);
      } else {
        await onLogin(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSyncCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!syncCode.trim()) return;
    setLoading(true);
    try {
      const cleanCode = syncCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const derivedEmail = `device_${cleanCode}@twinspace.com`;
      const derivedPass = `Pass_${cleanCode}_123!`;
      try {
        await onLogin(derivedEmail, derivedPass);
      } catch (err) {
        await onRegister(derivedEmail, derivedPass);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoPairing = async (code: string) => {
    setSyncCode(code);
    setLoading(true);
    try {
      const derivedEmail = `device_${code}@twinspace.com`;
      const derivedPass = `Pass_${code}_123!`;
      try {
        await onLogin(derivedEmail, derivedPass);
      } catch (err) {
        await onRegister(derivedEmail, derivedPass);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--modal-background)] backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-[var(--modal-surface)] border border-[var(--border-strong)] rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in relative text-[var(--text-primary)]">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--modal-surface-raised)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-[var(--accent-primary)] to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 text-white font-black text-xl animate-glow-pulse">
            TS
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
            {authMode === 'CODE' ? (
              <>
                Pair Devices with <span className="text-[var(--accent-primary)]">Sync Code</span>
              </>
            ) : authMode === 'REGISTER' ? (
              <>
                Create <span className="text-[var(--accent-primary)]">TwinSpace</span> Account
              </>
            ) : (
              <>
                Sign in to <span className="text-[var(--accent-primary)]">TwinSpace</span>
              </>
            )}
          </h2>
          <p className="text-xs text-[var(--text-secondary)] mt-1.5 font-medium leading-relaxed">
            Enter identical code or credentials on Windows & iPhone to view same content in real-time
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-[var(--input-background)] p-1.5 mb-6 border border-[var(--border-default)] text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => setAuthMode('CODE')}
            className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
              authMode === 'CODE'
                ? 'bg-[var(--accent-primary)] text-white shadow-md font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--modal-surface-raised)] font-bold'
            }`}
          >
            Pairing Code
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('LOGIN')}
            className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
              authMode === 'LOGIN'
                ? 'bg-[var(--accent-primary)] text-white shadow-md font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--modal-surface-raised)] font-bold'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('REGISTER')}
            className={`flex-1 py-2.5 rounded-lg transition-all duration-200 ${
              authMode === 'REGISTER'
                ? 'bg-[var(--accent-primary)] text-white shadow-md font-extrabold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--modal-surface-raised)] font-bold'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-rose-400 font-bold text-xs text-center animate-scale-in">
            {error}
          </div>
        )}

        {/* MODE 1: 6-Digit Pairing Code */}
        {authMode === 'CODE' ? (
          <form onSubmit={handleSyncCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1.5">
                Enter 6-Digit Sync Key or Pairing Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--accent-primary)]" />
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="e.g. 777888 or TS-102938"
                  className="w-full bg-[var(--input-background)] border border-[var(--border-strong)] rounded-xl pl-10 pr-4 py-3 text-center tracking-widest font-mono text-base font-extrabold outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] transition-all shadow-xs"
                />
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] mt-1.5 text-center font-medium">
                Use this exact code on your second device to link them instantly.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-[0.99] text-white font-extrabold py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <span className="text-xs font-bold">Linking devices...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Link & Sync Devices
                </>
              )}
            </button>

            {/* Quick Demo Pairing Section */}
            <div className="pt-4 border-t border-[var(--border-default)] text-center">
              <span className="text-[11px] text-[var(--text-secondary)] font-extrabold uppercase tracking-wider block mb-2">
                QUICK DEMO 1-CLICK PAIRING CODES:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoPairing('777888')}
                  className="flex-1 bg-[var(--modal-surface-raised)] hover:bg-[var(--accent-primary)]/15 border border-[var(--border-strong)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] font-mono text-xs py-2.5 rounded-xl transition font-extrabold shadow-xs"
                >
                  Pair Code: <span className="text-[var(--accent-primary)]">777888</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoPairing('999111')}
                  className="flex-1 bg-[var(--modal-surface-raised)] hover:bg-[var(--accent-primary)]/15 border border-[var(--border-strong)] hover:border-[var(--accent-primary)] text-[var(--text-primary)] font-mono text-xs py-2.5 rounded-xl transition font-extrabold shadow-xs"
                >
                  Pair Code: <span className="text-sky-400">999111</span>
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* MODE 2 & 3: Email & Password Sign In / Register */
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--text-muted)]" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-[var(--input-background)] border border-[var(--border-strong)] rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-extrabold text-[var(--text-secondary)] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-[var(--text-muted)]" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[var(--input-background)] border border-[var(--border-strong)] rounded-xl pl-10 pr-4 py-2.5 text-sm font-semibold outline-none focus:ring-2 focus:ring-[var(--focus-ring)] focus:border-[var(--accent-primary)] text-[var(--input-text)] placeholder-[var(--input-placeholder)] transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-[0.99] text-white font-extrabold py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <span className="text-xs font-bold">Authenticating...</span>
              ) : authMode === 'REGISTER' ? (
                <>
                  <UserPlus className="w-4 h-4" /> Create Account
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> Sign In & Sync Content
                </>
              )}
            </button>
          </form>
        )}

        {/* Footer Device Connectivity Note */}
        <div className="mt-6 text-center text-xs font-extrabold text-[var(--text-secondary)] flex items-center justify-center gap-2 pt-2 border-t border-[var(--border-default)]">
          <Laptop className="w-4 h-4 text-sky-400" />
          <span>Windows</span>
          <span className="text-[var(--accent-primary)]">⚡</span>
          <Smartphone className="w-4 h-4 text-amber-400" />
          <span>iPhone</span>
        </div>
      </div>
    </div>
  );
};
