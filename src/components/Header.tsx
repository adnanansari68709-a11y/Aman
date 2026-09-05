import React, { useState } from 'react';
import { Search, Menu, X, Shield, Sparkles, FolderTree } from 'lucide-react';
import { AdminUser } from '../types';

interface HeaderProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  adminUser: AdminUser | null;
  onOpenSearch: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentRoute,
  onNavigate,
  adminUser,
  onOpenSearch
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Home', route: '/' },
    { label: 'Library', route: '/library' },
    { label: 'Categories', route: '/categories' },
    { label: 'About', route: '/about' },
    { label: 'Contact', route: '/contact' }
  ];

  const handleNav = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#D4AF37]/20 bg-black/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => handleNav('/')}
          className="flex items-center gap-3 group text-left transition-transform active:scale-95"
        >
          <div className="w-10 h-10 bg-gradient-to-br from-[#D4AF37] to-[#8A6D3B] flex items-center justify-center rounded-xl shadow-[0_0_20px_rgba(212,175,55,0.35)] group-hover:shadow-[0_0_25px_rgba(212,175,55,0.5)] transition-all">
            <span className="text-black font-black text-2xl tracking-tighter">V</span>
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-extrabold tracking-widest text-white leading-none group-hover:text-[#F3E5AB] transition-colors">
              VELORA
            </span>
            <span className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mt-1">
              Digital Archive
            </span>
          </div>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          {navLinks.map((item) => {
            const isActive = currentRoute === item.route;
            return (
              <button
                key={item.route}
                id={`nav-link-${item.label.toLowerCase()}`}
                onClick={() => handleNav(item.route)}
                className={`transition-colors relative py-1 ${
                  isActive
                    ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]'
                    : 'text-zinc-300 hover:text-[#D4AF37]'
                }`}
              >
                {item.label}
              </button>
            );
          })}

          <div className="h-4 w-[1px] bg-white/20 mx-1"></div>

          {/* Quick Search Button */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-3 py-1.5 rounded-xl hover:bg-white/5 transition-all text-xs"
            title="Search resources (Ctrl+K)"
          >
            <Search className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden lg:inline">Search archive...</span>
            <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] bg-white/10 border border-white/15 rounded text-zinc-400">
              /
            </kbd>
          </button>

          {/* Admin Portal Entry */}
          <button
            id="nav-admin-btn"
            onClick={() => handleNav(adminUser ? '/admin' : '/admin/login')}
            className="flex items-center gap-2.5 bg-[#D4AF37]/10 border border-[#D4AF37]/30 px-4 py-2 rounded-full text-[#D4AF37] hover:bg-[#D4AF37]/20 transition-all active:scale-95 text-xs font-semibold tracking-wider uppercase"
          >
            <div className={`w-2 h-2 rounded-full ${adminUser ? 'bg-emerald-400' : 'bg-[#D4AF37]'} animate-pulse`}></div>
            <span>{adminUser ? 'Dashboard' : 'Admin Portal'}</span>
            <Shield className="w-3.5 h-3.5 opacity-80" />
          </button>
        </nav>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-3">
          <button
            id="mobile-search-btn"
            onClick={onOpenSearch}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-[#D4AF37]"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#070709] px-6 py-6 space-y-4">
          <div className="flex flex-col space-y-3">
            {navLinks.map((item) => (
              <button
                key={item.route}
                onClick={() => handleNav(item.route)}
                className={`text-left text-base font-medium py-2 px-3 rounded-lg transition-colors ${
                  currentRoute === item.route
                    ? 'bg-[#D4AF37]/15 text-[#D4AF37] font-semibold'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <button
              onClick={() => handleNav(adminUser ? '/admin' : '/admin/login')}
              className="w-full flex items-center justify-center gap-2.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 py-3 rounded-xl text-[#D4AF37] text-sm font-semibold tracking-wider uppercase"
            >
              <div className={`w-2 h-2 rounded-full ${adminUser ? 'bg-emerald-400' : 'bg-[#D4AF37]'} animate-pulse`}></div>
              <span>{adminUser ? 'Admin Dashboard (Active)' : 'Admin Portal Login'}</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
