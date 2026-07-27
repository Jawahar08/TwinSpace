import React, { useState } from 'react';
import { Lock, Mail, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onLogin: (email: string, pass: string) => Promise<void>;
  onRegister: (email: string, pass: string) => Promise<void>;
  error?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onLogin, onRegister, error }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onLogin(email, password);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-apple-cardLight dark:bg-apple-cardDark border border-gray-200 dark:border-gray-700/50 rounded-2xl p-8 w-full max-w-md shadow-2xl transition-all">
        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-apple-yellow/20 text-apple-yellow rounded-2xl flex items-center justify-center mx-auto mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-apple-textLight dark:text-apple-textDark">
            {isRegister ? 'Create Account' : 'Sign in to SyncNotes'}
          </h2>
          <p className="text-xs text-apple-subtextLight dark:text-apple-subtextDark mt-1">
            Private, minimal note synchronization across Windows and iPhone
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs text-center font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-apple-subtextLight dark:text-apple-subtextDark mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full bg-apple-bgLight dark:bg-apple-bgDark border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-apple-yellow/50 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-apple-subtextLight dark:text-apple-subtextDark mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-apple-bgLight dark:bg-apple-bgDark border border-gray-200 dark:border-gray-700 rounded-xl pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-apple-yellow/50 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-apple-yellow hover:bg-yellow-600 active:scale-[0.99] text-white font-semibold py-2.5 rounded-xl transition duration-150 flex items-center justify-center gap-2 shadow-lg shadow-apple-yellow/20"
          >
            {loading ? (
              <span className="text-xs">Processing...</span>
            ) : isRegister ? (
              <>
                <UserPlus className="w-4 h-4" /> Create Account
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4" /> Sign In
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => setIsRegister(!isRegister)}
            className="text-xs text-apple-subtextLight dark:text-apple-subtextDark hover:text-apple-yellow transition"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>
      </div>
    </div>
  );
};
