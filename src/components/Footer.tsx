import React from 'react';
import { ShieldCheck, Database, ArrowUpRight } from 'lucide-react';
import { formatDownloadCount } from '../utils/formatters';

interface FooterProps {
  onNavigate: (route: string) => void;
  stats?: {
    totalFiles: number;
    totalDownloads: number;
    totalCategories: number;
  };
}

export const Footer: React.FC<FooterProps> = ({ onNavigate, stats }) => {
  const activeItems = stats?.totalFiles ?? 1245;
  const globalDownloads = stats?.totalDownloads ?? 85420;

  return (
    <footer className="border-t border-white/5 bg-black/80 mt-auto text-zinc-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
          {/* Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-gradient-to-br from-[#D4AF37] to-[#8A6D3B] flex items-center justify-center rounded-lg shadow-[0_0_12px_rgba(212,175,55,0.25)]">
                <span className="text-black font-black text-lg tracking-tighter">V</span>
              </div>
              <span className="text-lg font-bold tracking-widest text-white">VELORA</span>
            </div>
            <p className="text-sm text-zinc-400 max-w-md font-light leading-relaxed">
              Engineered digital repository curated for executives, software engineers, and visual designers. Uncompromising security, verified payload delivery, and lossless archive storage.
            </p>
            <div className="flex items-center gap-4 text-xs text-zinc-500 pt-2">
              <span className="flex items-center gap-1.5 text-[#D4AF37]">
                <ShieldCheck className="w-4 h-4" /> Single-Owner Enterprise Architecture
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Explore Archive
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/library')}
                  className="hover:text-[#D4AF37] transition-colors flex items-center gap-1"
                >
                  Resource Library <ArrowUpRight className="w-3 h-3 opacity-60" />
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/categories')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  All Categories
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/about')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  System Architecture
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/contact')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Executive Concierge
                </button>
              </li>
            </ul>
          </div>

          {/* Legal & Governance */}
          <div>
            <h4 className="text-xs uppercase tracking-[0.2em] text-white font-semibold mb-4">
              Governance &amp; Trust
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  onClick={() => onNavigate('/privacy')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/terms')}
                  className="hover:text-[#D4AF37] transition-colors"
                >
                  Terms of Distribution
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('/admin/login')}
                  className="hover:text-[#D4AF37] transition-colors text-xs text-zinc-500 hover:text-zinc-300 flex items-center gap-1"
                >
                  Administrative Gateway
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Live Synchronized Telemetry Banner */}
        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between text-xs text-white/40 tracking-widest uppercase font-semibold gap-4">
          <div>
            &copy; {new Date().getFullYear()} VELORA PREMIUM ARCHIVE. ALL RIGHTS RESERVED.
          </div>

          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[#D4AF37] font-mono text-sm tracking-normal">
                {activeItems.toLocaleString()} Active Items
              </span>
              <span className="text-[9px] text-zinc-500 tracking-wider flex items-center gap-1">
                <Database className="w-2.5 h-2.5 text-emerald-400" /> Database Synced
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-white/80 font-mono text-sm tracking-normal">
                {formatDownloadCount(globalDownloads)} Global Downloads
              </span>
              <span className="text-[9px] text-zinc-500 tracking-wider">
                Live Telemetry
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
