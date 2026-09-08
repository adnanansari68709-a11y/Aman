import React, { useState } from 'react';
import { 
  ShieldCheck, Database, ArrowRight, ArrowUpRight, 
  Instagram, Twitter, Github, Disc as Discord, CheckCircle2, Sparkles 
} from 'lucide-react';
import { formatDownloadCount } from '../utils/formatters';
import { INSTAGRAM_PROFILE_URL } from '../config/social';
import { AmanxLogo } from './AmanxLogo';

interface FooterProps {
  onNavigate: (route: string) => void;
  stats?: {
    totalFiles: number;
    totalDownloads: number;
    totalCategories: number;
  };
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, stats }) => {
  const activeItems = stats?.totalFiles ?? 12450;
  const globalDownloads = stats?.totalDownloads ?? 85420;

  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  return (
    <footer className="border-t border-white/[0.08] bg-[#050608] mt-auto text-zinc-400 relative overflow-hidden">
      {/* Subtle atmospheric ambient glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-[#d4af37]/5 blur-[120px] rounded-full pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-12 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand & Mission (Col 1 & 2) */}
          <div className="lg:col-span-2 space-y-4">
            <button
              onClick={() => onNavigate('/')}
              className="flex items-center group text-left transition-transform active:scale-95 focus:outline-none"
              aria-label="AMANX ARCHIVE - Return to Home"
            >
              <AmanxLogo size="lg" compactOnMobile={false} />
            </button>

            <p className="text-xs sm:text-sm text-zinc-400 font-light leading-relaxed max-w-sm">
              Engineered digital repository curated for software engineers, architects, and visual directors. Uncompromising cryptographic security, verified payload delivery, and lossless archival standards.
            </p>

            {/* Social Icons */}
            <div className="flex items-center gap-3 pt-2">
              <a
                href={INSTAGRAM_PROFILE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] transition-all"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] transition-all"
                aria-label="Twitter / X"
              >
                <Twitter className="w-4 h-4" />
              </a>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] transition-all"
                aria-label="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noopener noreferrer"
                className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] hover:border-[#d4af37]/50 hover:bg-[#d4af37]/10 flex items-center justify-center text-zinc-400 hover:text-[#d4af37] transition-all"
                aria-label="Discord"
              >
                <Discord className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links (Col 3) */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Quick Links
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/library')}
                  className="hover:text-[#d4af37] transition-colors flex items-center gap-1"
                >
                  Library <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/categories')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/library?collection=featured')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Collections
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  About Archive
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Contact Concierge
                </button>
              </li>
            </ul>
          </div>

          {/* Support & Governance (Col 4) */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Support &amp; Trust
            </h4>
            <ul className="space-y-2 text-xs sm:text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Documentation
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-[#d4af37] transition-colors flex items-center gap-1.5"
                >
                  <span>System Status</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Security &amp; Governance
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-[#d4af37] transition-colors"
                >
                  Terms of Distribution
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin/login')}
                  className="hover:text-[#d4af37] transition-colors text-zinc-500 hover:text-zinc-300"
                >
                  Administrative Gateway
                </button>
              </li>
            </ul>
          </div>

          {/* Subscribe to Updates (Col 5) */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white font-semibold mb-3">
              Subscribe to Updates
            </h4>
            <p className="text-xs text-zinc-400 font-light mb-3">
              Receive confidential dispatches on newly ingested high-tier releases.
            </p>

            {subscribed ? (
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                <span>Subscription confirmed.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email address..."
                  required
                  className="w-full bg-white/[0.04] border border-white/[0.1] rounded-xl py-2.5 pl-3.5 pr-10 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#d4af37]/60 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1.5 bottom-1.5 px-2.5 bg-[#d4af37] hover:bg-[#e5c158] text-black rounded-lg transition-colors flex items-center justify-center"
                  aria-label="Subscribe"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </form>
            )}

            <div className="mt-4 flex items-center gap-2 text-[10px] text-zinc-500">
              <ShieldCheck className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>Strictly zero spam. Unsubscribe anytime.</span>
            </div>
          </div>
        </div>

        {/* Live Synchronized Telemetry Banner & Copyright */}
        <div className="pt-8 border-t border-white/[0.06] flex flex-col md:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <div>
            &copy; 2026 AMANX ARCHIVE. ALL RIGHTS RESERVED.
          </div>

          <div className="flex items-center gap-6 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-zinc-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="text-[#d4af37]">{activeItems.toLocaleString()}</span>
              <span>Assets Online</span>
            </div>
            <div className="flex items-center gap-1.5 text-zinc-400">
              <Database className="w-3 h-3 text-[#d4af37]" />
              <span>{formatDownloadCount(globalDownloads)} Downloads</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
