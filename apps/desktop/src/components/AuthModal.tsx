import React, { useState } from 'react';
import * as LucideIcons from 'lucide-react';

const Lock = LucideIcons.Lock;
const Mail = LucideIcons.Mail;
const UserPlus = LucideIcons.UserPlus;
const LogIn = LucideIcons.LogIn;
const KeyRound = (LucideIcons as Record<string, any>).KeyRound || LucideIcons.Sun;
const Smartphone = (LucideIcons as Record<string, any>).Smartphone || LucideIcons.Sun;
const Laptop = (LucideIcons as Record<string, any>).Laptop || LucideIcons.Sun;

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
  error?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLogin, onRegister, error }) => {
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
      // Map 6-digit pairing code to deterministic account credentials
      const cleanCode = syncCode.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
      const derivedEmail = `device_${cleanCode}@twinspace.com`;
      const derivedPass = `Pass_${cleanCode}_123!`;
      try {
        await onLogin(derivedEmail, derivedPass);
      } catch (err) {
        // If account doesn't exist yet, auto-register it so both devices link seamlessly
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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-continuum-cardDark border border-continuum-borderDark rounded-3xl p-8 w-full max-w-md shadow-2xl animate-scale-in text-continuum-textDark">
        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-amber-400 via-continuum-amber to-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 text-white font-black text-xl animate-glow-pulse">
            TS
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-amber-400 bg-clip-text text-transparent">
            {authMode === 'CODE'
              ? 'Pair Devices with Sync Code'
              : authMode === 'REGISTER'
              ? 'Create TwinSpace Account'
              : 'Sign in to TwinSpace'}
          </h2>
          <p className="text-xs text-continuum-subtextDark mt-1 font-medium">
            Enter identical code or credentials on Windows & iPhone to view same content in real-time
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex rounded-xl bg-continuum-bgDark p-1 mb-6 border border-continuum-borderDark text-xs font-bold">
          <button
            type="button"
            onClick={() => setAuthMode('CODE')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'CODE' ? 'bg-continuum-amber text-white shadow-xs' : 'text-continuum-subtextDark hover:text-white'
            }`}
          >
            Pairing Code
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('LOGIN')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'LOGIN' ? 'bg-continuum-amber text-white shadow-xs' : 'text-continuum-subtextDark hover:text-white'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setAuthMode('REGISTER')}
            className={`flex-1 py-2 rounded-lg transition ${
              authMode === 'REGISTER' ? 'bg-continuum-amber text-white shadow-xs' : 'text-continuum-subtextDark hover:text-white'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-500/15 border border-rose-500/30 rounded-xl text-rose-400 text-xs text-center font-medium animate-scale-in">
            {error}
          </div>
        )}

        {/* MODE 1: 6-Digit Pairing Code */}
        {authMode === 'CODE' ? (
          <form onSubmit={handleSyncCodeSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-continuum-subtextDark mb-1">
                Enter 6-Digit Sync Key or Pairing Code
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3.5 top-3.5 text-continuum-amber" />
                <input
                  type="text"
                  required
                  maxLength={12}
                  value={syncCode}
                  onChange={(e) => setSyncCode(e.target.value)}
                  placeholder="e.g. 777888 or TS-102938"
                  className="w-full bg-continuum-bgDark border border-continuum-borderDark rounded-xl pl-10 pr-4 py-3 text-center tracking-widest font-mono text-base font-bold outline-none focus:ring-2 focus:ring-continuum-amber/50 text-continuum-textDark placeholder-continuum-subtextDark transition-all shadow-xs"
                />
              </div>
              <p className="text-[10px] text-continuum-subtextDark mt-1 text-center">
                Use this exact code on your second device to link them instantly.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-[0.99] text-white font-bold py-3 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <span className="text-xs font-medium">Linking devices...</span>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" /> Link & Sync Devices
                </>
              )}
            </button>

            {/* Quick Demo Pairing Section */}
            <div className="pt-3 border-t border-continuum-borderDark text-center">
              <span className="text-[10px] text-continuum-subtextDark font-semibold uppercase block mb-2">
                Quick Demo 1-Click Pairing Codes:
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickDemoPairing('777888')}
                  className="flex-1 bg-continuum-bgDark hover:bg-white/5 border border-continuum-borderDark text-continuum-amber font-mono text-xs py-2 rounded-xl transition font-bold"
                >
                  Pair Code: 777888
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoPairing('999111')}
                  className="flex-1 bg-continuum-bgDark hover:bg-white/5 border border-continuum-borderDark text-sky-400 font-mono text-xs py-2 rounded-xl transition font-bold"
                >
                  Pair Code: 999111
                </button>
              </div>
            </div>
          </form>
        ) : (
          /* MODE 2 & 3: Email & Password Sign In / Register */
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-continuum-subtextDark mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-continuum-subtextDark" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full bg-continuum-bgDark border border-continuum-borderDark rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-continuum-amber/50 text-continuum-textDark placeholder-continuum-subtextDark transition-all shadow-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-continuum-subtextDark mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-continuum-subtextDark" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-continuum-bgDark border border-continuum-borderDark rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-continuum-amber/50 text-continuum-textDark placeholder-continuum-subtextDark transition-all shadow-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 active:scale-[0.99] text-white font-bold py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-amber-500/25"
            >
              {loading ? (
                <span className="text-xs font-medium">Authenticating...</span>
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

        {/* Footer Note */}
        <div className="mt-6 text-center text-[11px] text-continuum-subtextDark flex items-center justify-center gap-2">
          <Laptop className="w-3.5 h-3.5 text-sky-400" />
          <span>Windows</span>
          <span>⚡</span>
          <Smartphone className="w-3.5 h-3.5 text-amber-400" />
          <span>iPhone</span>
        </div>
      </div>
    </div>
  );
};
