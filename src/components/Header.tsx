import React, { useState } from 'react';
import { Search, Menu, X, ArrowRight, User, Shield } from 'lucide-react';
import { AdminUser } from '../types';
import { AmanxLogo } from './AmanxLogo';

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
    { label: 'Collections', route: '/library?collection=featured' },
    { label: 'Resources', route: '/library' },
    { label: 'About', route: '/about' }
  ];

  const handleNav = (route: string) => {
    onNavigate(route);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#060709]/90 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-18 flex items-center justify-between gap-3 sm:gap-4">
        
        {/* Brand: AMANX ARCHIVE A/X Monogram Logo */}
        <button
          id="nav-logo-btn"
          onClick={() => handleNav('/')}
          className="flex items-center group text-left transition-transform active:scale-95 focus:outline-none flex-shrink-0"
          aria-label="AMANX ARCHIVE - Return to Home"
        >
          <AmanxLogo size="md" compactOnMobile={true} />
        </button>

        {/* Desktop Navigation Links: Home, Library, Categories, Collections, Resources, About */}
        <nav className="hidden lg:flex items-center gap-5 xl:gap-7 text-xs font-medium tracking-wide">
          {navLinks.map((item) => {
            const isActive =
              item.route === '/'
                ? currentRoute === '/'
                : item.route === '/library?collection=featured'
                ? currentRoute.includes('collection=featured')
                : currentRoute.startsWith(item.route);

            return (
              <button
                key={item.label}
                id={`nav-link-${item.label.toLowerCase()}`}
                onClick={() => handleNav(item.route)}
                className={`transition-all py-1 font-light tracking-wider hover:text-[#d4af37] ${
                  isActive
                    ? 'text-[#d4af37] font-medium'
                    : 'text-zinc-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Actions on Desktop: Search, Sign In, Get Started */}
        <div className="hidden md:flex items-center gap-2.5 lg:gap-3.5 flex-shrink-0">
          {/* Search Trigger */}
          <button
            id="header-search-btn"
            onClick={onOpenSearch}
            className="flex items-center gap-2 text-zinc-400 hover:text-white px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] transition-all text-xs"
            title="Search archive (Press /)"
          >
            <Search className="w-3.5 h-3.5 text-[#d4af37]" />
            <span className="hidden xl:inline text-zinc-300 text-xs">Search...</span>
            <kbd className="hidden xl:inline-block px-1.5 py-0.5 text-[9px] bg-white/10 rounded text-zinc-400 font-mono">
              /
            </kbd>
          </button>

          {/* Sign In Button */}
          <button
            id="nav-signin-btn"
            onClick={() => handleNav(adminUser ? '/admin' : '/admin/login')}
            className="flex items-center gap-1.5 text-xs text-zinc-300 hover:text-white px-2.5 py-1.5 transition-colors font-medium"
          >
            {adminUser ? (
              <>
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Admin</span>
              </>
            ) : (
              <>
                <User className="w-3.5 h-3.5 text-zinc-400" />
                <span>Sign In</span>
              </>
            )}
          </button>

          {/* Get Started Button */}
          <button
            id="nav-get-started-btn"
            onClick={() => handleNav(adminUser ? '/admin/upload' : '/library')}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c29831] text-black text-xs font-semibold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_15px_rgba(212,175,55,0.25)] flex items-center gap-1.5"
          >
            <span>{adminUser ? 'Ingest Asset' : 'Get Started'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Mobile controls */}
        <div className="flex md:hidden items-center gap-2">
          <button
            id="mobile-search-btn"
            onClick={onOpenSearch}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-[#d4af37]"
            aria-label="Search"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            id="mobile-menu-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-300 hover:text-white"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-white/10 bg-[#07080c] px-5 py-5 space-y-4">
          <div className="flex flex-col space-y-2">
            {navLinks.map((item) => (
              <button
                key={item.label}
                onClick={() => handleNav(item.route)}
                className={`text-left text-xs uppercase tracking-wider py-2 px-3 rounded-lg transition-colors ${
                  currentRoute === item.route
                    ? 'bg-[#d4af37]/15 text-[#d4af37] font-semibold'
                    : 'text-zinc-300 hover:bg-white/5'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
            <button
              onClick={() => handleNav(adminUser ? '/admin' : '/admin/login')}
              className="w-full flex items-center justify-center gap-2 bg-white/5 border border-white/10 py-2.5 rounded-xl text-zinc-200 text-xs font-semibold tracking-wider uppercase"
            >
              <User className="w-3.5 h-3.5 text-[#d4af37]" />
              <span>{adminUser ? 'Dashboard' : 'Sign In'}</span>
            </button>
            <button
              onClick={() => handleNav(adminUser ? '/admin/upload' : '/library')}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-[#d4af37] to-[#caa446] text-black py-2.5 rounded-xl text-xs font-bold tracking-wider uppercase shadow-[0_0_15px_rgba(212,175,55,0.25)]"
            >
              <span>{adminUser ? 'Ingest Asset' : 'Get Started'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
