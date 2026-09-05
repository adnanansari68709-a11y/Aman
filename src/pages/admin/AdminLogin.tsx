import React, { useState } from 'react';
import { Shield, Lock, Mail, Eye, EyeOff, Loader2, AlertCircle, Sparkles } from 'lucide-react';
import { api } from '../../services/api';

interface AdminLoginProps {
  onLoginSuccess: (admin: any) => void;
  onNavigate: (route: string) => void;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLoginSuccess, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please provide administrative credentials.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api.login(email.trim(), password.trim());
      onLoginSuccess(res.admin);
    } catch (err: any) {
      setError(err.message || 'Administrative authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-[#0b0b0e] border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8)] relative overflow-hidden backdrop-blur-xl">
        {/* Glow backdrop */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-[#D4AF37]/10 blur-[50px] rounded-full pointer-events-none -z-10"></div>

        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8A6D3B] flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(212,175,55,0.4)]">
            <Shield className="w-6 h-6 text-black" />
          </div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Restricted Gateway
          </span>
          <h1 className="text-2xl font-light text-white tracking-tight mt-1">
            Owner Authentication
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Authorized single-tenant access only.
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-email-input"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
              Passphrase
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="admin-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full bg-black/60 border border-white/10 rounded-xl py-2.5 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            id="admin-login-submit"
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] flex items-center justify-center gap-2 mt-2 active:scale-95"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Cryptographic Credentials...</span>
              </>
            ) : (
              <span>Unlock Admin Panel</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-white/5 text-center text-xs text-zinc-500 space-y-2">
          <div className="flex items-center justify-center gap-1 text-[11px] text-[#D4AF37]">
            <Sparkles className="w-3 h-3" />
            <span>Encrypted Token Authorization</span>
          </div>
          <p className="text-[10px]">
            Public registration is disabled by system policy.
          </p>
          <button
            onClick={() => onNavigate('/')}
            className="text-zinc-400 hover:text-white underline text-xs pt-2"
          >
            &larr; Return to Public Website
          </button>
        </div>
      </div>
    </div>
  );
};
