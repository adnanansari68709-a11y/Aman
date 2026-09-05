import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { SearchModal } from './components/SearchModal';
import { Home } from './pages/Home';
import { Library } from './pages/Library';
import { FileDetail } from './pages/FileDetail';
import { CategoriesPage } from './pages/CategoriesPage';
import { About } from './pages/About';
import { Contact } from './pages/Contact';
import { Legal } from './pages/Legal';
import { NotFound } from './pages/NotFound';
import { AdminLogin } from './pages/admin/AdminLogin';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AdminUpload } from './pages/admin/AdminUpload';
import { AdminFiles } from './pages/admin/AdminFiles';
import { AdminCategories } from './pages/admin/AdminCategories';
import { AdminUser, SiteStats } from './types';
import { api } from './services/api';

export function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname || '/');
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [stats, setStats] = useState<SiteStats | null>(null);

  // Sync browser popstate (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname || '/');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Check existing admin session
  useEffect(() => {
    async function checkAuth() {
      try {
        const user = await api.getMe();
        setAdminUser(user);
      } catch {
        setAdminUser(null);
      }
    }
    checkAuth();
  }, []);

  // Load telemetry stats for footer & navigation
  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getPublicStats();
        setStats({
          ...data,
          totalStorageBytes: 0,
          popularFiles: [],
          recentActivity: [],
          categoryDistribution: [],
          downloadsOverTime: []
        });
      } catch {
        // ignore
      }
    }
    loadStats();
  }, [currentPath]);

  // Global keyboard shortcut '/' to open search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navigate = (to: string) => {
    window.history.pushState({}, '', to);
    setCurrentPath(to);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    try {
      await api.logout();
    } catch {
      // ignore
    }
    setAdminUser(null);
    navigate('/');
  };

  // Route matching helper
  const renderContent = () => {
    // Exact routes
    if (currentPath === '/') {
      return (
        <Home
          onNavigate={navigate}
          onSelectCategory={(slug) => navigate(`/library?category=${slug}`)}
          onOpenDetails={(slug) => navigate(`/file/${slug}`)}
        />
      );
    }

    if (currentPath.startsWith('/library')) {
      const urlParams = new URLSearchParams(window.location.search);
      const catParam = urlParams.get('category') || undefined;
      const searchParam = urlParams.get('search') || undefined;
      return (
        <Library
          initialCategory={catParam}
          initialSearch={searchParam}
          onOpenDetails={(slug) => navigate(`/file/${slug}`)}
          onCategorySelect={(slug) => {
            const newUrl = slug ? `/library?category=${slug}` : '/library';
            window.history.replaceState({}, '', newUrl);
          }}
        />
      );
    }

    if (currentPath === '/categories') {
      return (
        <CategoriesPage
          onSelectCategory={(slug) => navigate(`/library?category=${slug}`)}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath === '/about') {
      return <About onNavigate={navigate} />;
    }

    if (currentPath === '/contact') {
      return <Contact />;
    }

    if (currentPath === '/privacy') {
      return <Legal type="privacy" />;
    }

    if (currentPath === '/terms') {
      return <Legal type="terms" />;
    }

    // Dynamic file details route: /file/:slug
    if (currentPath.startsWith('/file/')) {
      const slug = currentPath.replace('/file/', '').split('?')[0];
      return (
        <FileDetail
          slug={slug}
          onNavigate={navigate}
          onOpenCategory={(catSlug) => navigate(`/library?category=${catSlug}`)}
        />
      );
    }

    // Admin routes
    if (currentPath === '/admin/login') {
      if (adminUser) {
        navigate('/admin');
        return null;
      }
      return (
        <AdminLogin
          onLoginSuccess={(user) => {
            setAdminUser(user);
            navigate('/admin');
          }}
          onNavigate={navigate}
        />
      );
    }

    if (currentPath === '/admin') {
      if (!adminUser) {
        return (
          <AdminLogin
            onLoginSuccess={(user) => {
              setAdminUser(user);
              navigate('/admin');
            }}
            onNavigate={navigate}
          />
        );
      }
      return <AdminDashboard onNavigate={navigate} onLogout={handleLogout} />;
    }

    if (currentPath === '/admin/upload') {
      if (!adminUser) {
        return (
          <AdminLogin
            onLoginSuccess={(user) => {
              setAdminUser(user);
              navigate('/admin/upload');
            }}
            onNavigate={navigate}
          />
        );
      }
      return (
        <AdminUpload
          onNavigate={navigate}
          onUploaded={(file) => {
            // Optional callback
          }}
        />
      );
    }

    if (currentPath === '/admin/files') {
      if (!adminUser) {
        return (
          <AdminLogin
            onLoginSuccess={(user) => {
              setAdminUser(user);
              navigate('/admin/files');
            }}
            onNavigate={navigate}
          />
        );
      }
      return <AdminFiles onNavigate={navigate} />;
    }

    if (currentPath === '/admin/categories') {
      if (!adminUser) {
        return (
          <AdminLogin
            onLoginSuccess={(user) => {
              setAdminUser(user);
              navigate('/admin/categories');
            }}
            onNavigate={navigate}
          />
        );
      }
      return <AdminCategories onNavigate={navigate} />;
    }

    return <NotFound onNavigate={navigate} />;
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#F5F5F7] flex flex-col font-sans selection:bg-[#D4AF37] selection:text-black">
      {/* Universal Luxury Header */}
      <Header
        currentRoute={currentPath}
        onNavigate={navigate}
        adminUser={adminUser}
        onOpenSearch={() => setIsSearchOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 flex flex-col w-full relative">
        {renderContent()}
      </main>

      {/* Luxury Footer with Live Telemetry */}
      <Footer onNavigate={navigate} stats={stats || undefined} />

      {/* Global Quick Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectFile={(slug) => navigate(`/file/${slug}`)}
        onViewAllResults={(query) => navigate(`/library?search=${encodeURIComponent(query)}`)}
      />
    </div>
  );
}
export default App;
