import React, { useState, useEffect } from 'react';
import { 
  Search, ArrowRight, Sparkles, Folder, Download, TrendingUp, Layers, CheckCircle2, Instagram,
  LayoutGrid, Video, Image, Music, FileText, Layout, Code, Gamepad2 
} from 'lucide-react';
import { Category, FileResource } from '../types';
import { FileCard } from '../components/FileCard';
import { api } from '../services/api';
import { formatDownloadCount } from '../utils/formatters';

export const MAIN_CATEGORIES = [
  { name: 'Apps', slug: 'apps', icon: LayoutGrid },
  { name: 'Videos', slug: 'videos', icon: Video },
  { name: 'Photos', slug: 'photos', icon: Image },
  { name: 'Music', slug: 'music', icon: Music },
  { name: 'Documents', slug: 'documents', icon: FileText },
  { name: 'Templates', slug: 'templates', icon: Layout },
  { name: 'Software', slug: 'software', icon: Code },
  { name: 'Games', slug: 'games', icon: Gamepad2 },
];

interface HomeProps {
  onNavigate: (route: string) => void;
  onSelectCategory: (slug: string) => void;
  onOpenDetails: (slug: string) => void;
}

export const Home: React.FC<HomeProps> = ({
  onNavigate,
  onSelectCategory,
  onOpenDetails
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [featuredFiles, setFeaturedFiles] = useState<FileResource[]>([]);
  const [latestFiles, setLatestFiles] = useState<FileResource[]>([]);
  const [trendingFiles, setTrendingFiles] = useState<FileResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<{
    totalFiles: number;
    totalDownloads: number;
    totalCategories: number;
    recentlyUpdatedCount: number;
  }>({
    totalFiles: 0,
    totalDownloads: 0,
    totalCategories: 0,
    recentlyUpdatedCount: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featRes, latestRes, trendRes, catRes, statsRes] = await Promise.all([
          api.getFiles({ featured: true, limit: 4 }),
          api.getFiles({ sort: 'latest', limit: 4 }),
          api.getFiles({ sort: 'downloads', limit: 4 }),
          api.getCategories(),
          api.getPublicStats()
        ]);

        setFeaturedFiles(featRes.files);
        setLatestFiles(latestRes.files);
        setTrendingFiles(trendRes.files);
        setCategories(catRes);
        setStats(statsRes);
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onNavigate(`/library?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      onNavigate('/library');
    }
  };

  return (
    <div className="flex flex-col w-full relative">
      {/* Background Radial Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#D4AF37]/5 blur-[140px] rounded-full pointer-events-none -z-10" />

      {/* HERO SECTION */}
      <section className="px-4 sm:px-6 lg:px-8 pt-16 pb-14 text-center max-w-5xl mx-auto flex flex-col items-center">
        {/* Top Trust Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-zinc-300 text-xs font-medium mb-8 backdrop-blur-md">
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Curated Single-Owner Repository</span>
          <span className="w-1 h-1 rounded-full bg-[#D4AF37]"></span>
          <span className="text-[#D4AF37]">Zero Adware • Direct Streams</span>
        </div>

        {/* Large Headline */}
        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-light tracking-tight text-white mb-6">
          Discover.{' '}
          <span className="italic font-serif text-[#D4AF37] font-normal">
            Download.
          </span>{' '}
          Experience.
        </h1>

        {/* Subheadline */}
        <p className="text-[#A0A0A0] text-base sm:text-lg font-light leading-relaxed max-w-2xl mb-10">
          Your premium destination for high-end digital resources, verified architecture blueprints, developer toolkits, and cinematic assets.
        </p>

        {/* Large Premium Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="w-full max-w-2xl relative mb-8 group"
        >
          <input
            id="home-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 12,450+ premium resources, formats, tags..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-6 pr-32 text-sm sm:text-base text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/60 backdrop-blur-xl shadow-2xl transition-all"
          />
          <button
            id="home-search-submit"
            type="submit"
            className="absolute right-2.5 top-2.5 bottom-2.5 px-6 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#E5C158] transition-colors flex items-center gap-1.5 shadow-[0_0_15px_rgba(212,175,55,0.3)] active:scale-95"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </form>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 text-xs uppercase tracking-wider font-semibold">
          <button
            id="hero-explore-btn"
            onClick={() => onNavigate('/library')}
            className="px-6 py-3 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-xl transition-all flex items-center gap-2"
          >
            <span>Explore Library</span>
            <ArrowRight className="w-4 h-4 text-[#D4AF37]" />
          </button>
          <button
            id="hero-categories-btn"
            onClick={() => onNavigate('/categories')}
            className="px-6 py-3 bg-transparent hover:bg-white/5 border border-white/10 text-zinc-300 rounded-xl transition-all"
          >
            Browse Categories
          </button>
          <a
            id="home-instagram-link"
            href="https://www.instagram.com/aman_ansari__09/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-3 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/10 hover:border-[#D4AF37]/50 text-zinc-300 hover:text-[#D4AF37] rounded-xl transition-all duration-200 flex items-center gap-2.5 group shadow-[0_0_15px_rgba(0,0,0,0.4)] hover:shadow-[0_0_20px_rgba(212,175,55,0.18)] active:scale-95 cursor-pointer"
            aria-label="Instagram profile @aman_ansari__09"
          >
            <Instagram className="w-4 h-4 text-[#D4AF37] group-hover:scale-110 transition-transform duration-200" />
            <span>Instagram</span>
          </a>
        </div>
      </section>

      {/* FEATURED RESOURCES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              Curated Selection
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-1">
              Featured Resources
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/library?sort=latest')}
            className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37] hover:text-[#E5C158] flex items-center gap-1 transition-colors"
          >
            <span>View All</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredFiles.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onOpenDetails={onOpenDetails}
            />
          ))}
        </div>
      </section>

      {/* CATEGORIES BROWSER */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="flex items-end justify-between mb-8 border-b border-white/5 pb-4">
          <div>
            <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
              Categories
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-1">
              Browse Categories
            </h2>
          </div>
          <button
            id="home-view-all-categories-btn"
            onClick={() => onNavigate('/categories')}
            className="text-xs uppercase tracking-wider font-semibold text-[#D4AF37] hover:text-[#E5C158] flex items-center gap-1 transition-colors"
          >
            <span>All Categories</span> <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
          {MAIN_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.slug}
                id={`category-card-${cat.slug}`}
                onClick={() => onSelectCategory(cat.slug)}
                className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4AF37]/50 p-6 sm:p-7 rounded-2xl transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center text-center gap-4 hover:shadow-[0_0_25px_rgba(212,175,55,0.14)] active:scale-[0.98]"
              >
                <div className="w-14 h-14 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-all duration-300 shadow-inner">
                  <Icon className="w-7 h-7" />
                </div>
                <h3 className="text-white font-medium text-base sm:text-lg group-hover:text-[#D4AF37] transition-colors tracking-tight">
                  {cat.name}
                </h3>
              </div>
            );
          })}
        </div>
      </section>

      {/* LATEST UPLOADS & TRENDING */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Latest Additions */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <h3 className="text-xl font-light text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#D4AF37]" /> Latest Releases
              </h3>
              <button
                onClick={() => onNavigate('/library?sort=latest')}
                className="text-xs text-[#D4AF37] hover:underline"
              >
                Explore &rarr;
              </button>
            </div>
            <div className="space-y-3">
              {latestFiles.slice(0, 3).map((file) => (
                <div
                  key={file.id}
                  onClick={() => onOpenDetails(file.slug)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#D4AF37] text-xs font-mono font-bold">
                      {file.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-medium group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {file.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        {file.categoryName} • {formatDownloadCount(file.downloadCount)} downloads
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              ))}
            </div>
          </div>

          {/* Trending / Most Downloaded */}
          <div>
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-white/5">
              <h3 className="text-xl font-light text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> Most Downloaded
              </h3>
              <button
                onClick={() => onNavigate('/library?sort=downloads')}
                className="text-xs text-[#D4AF37] hover:underline"
              >
                Rankings &rarr;
              </button>
            </div>
            <div className="space-y-3">
              {trendingFiles.slice(0, 3).map((file) => (
                <div
                  key={file.id}
                  onClick={() => onOpenDetails(file.slug)}
                  className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-[#D4AF37]/40 transition-all flex items-center justify-between cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#D4AF37] text-xs font-mono font-bold">
                      {file.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                    <div>
                      <h4 className="text-white text-sm font-medium group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {file.title}
                      </h4>
                      <p className="text-[11px] text-zinc-500">
                        {file.categoryName} •{' '}
                        <span className="text-emerald-400 font-mono">
                          {formatDownloadCount(file.downloadCount)} downloads
                        </span>
                      </p>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* REAL DATABASE STATS SECTION */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 w-full">
        <div className="bg-gradient-to-r from-black/80 via-white/5 to-black/80 border border-white/10 rounded-3xl p-8 sm:p-12 relative overflow-hidden">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#D4AF37] font-mono mb-1">
                {stats.totalFiles.toLocaleString()}
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Total Resources
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono mb-1">
                {stats.totalDownloads.toLocaleString()}
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Total Downloads
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-[#D4AF37] font-mono mb-1">
                {stats.totalCategories.toLocaleString()}
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Curated Sectors
              </div>
            </div>
            <div>
              <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono mb-1">
                100%
              </div>
              <div className="text-xs uppercase tracking-widest text-zinc-400 font-semibold">
                Integrity Verified
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CALL TO ACTION */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">
        <h2 className="text-3xl sm:text-5xl font-light text-white tracking-tight mb-4">
          Experience the <span className="font-serif italic text-[#D4AF37]">Difference</span>
        </h2>
        <p className="text-zinc-400 text-base font-light mb-8 max-w-xl mx-auto">
          Instant high-speed transmission with no telemetry tracking, zero advertisement popups, and verified payload security.
        </p>
        <button
          onClick={() => onNavigate('/library')}
          className="px-8 py-4 bg-[#D4AF37] text-black text-sm font-bold uppercase tracking-widest rounded-2xl hover:bg-[#E5C158] transition-all shadow-[0_0_25px_rgba(212,175,55,0.4)] active:scale-95"
        >
          Explore the Entire Library
        </button>
      </section>
    </div>
  );
};
