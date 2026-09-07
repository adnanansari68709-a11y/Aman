import React, { useState, useEffect } from 'react';
import { 
  ArrowRight, Sparkles, Play, Shield, CheckCircle2,
  X, ArrowUpRight, Award
} from 'lucide-react';
import { FileResource } from '../types';
import { FileCard } from '../components/FileCard';
import { InstagramSection } from '../components/InstagramSection';
import { api } from '../services/api';

export const MAIN_CATEGORIES = [
  { name: 'Apps', slug: 'apps' },
  { name: 'Videos', slug: 'videos' },
  { name: 'Photos', slug: 'photos' },
  { name: 'Music', slug: 'music' },
  { name: 'Documents', slug: 'documents' },
  { name: 'Templates', slug: 'templates' },
  { name: 'Software', slug: 'software' },
  { name: 'Games', slug: 'games' },
];

const CURATED_CATEGORIES = [
  {
    title: 'Videos',
    slug: 'videos',
    description: 'Cinematic 8K drone reels, editorial motion plates, and studio LUT grades.',
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?q=80&w=1000&auto=format&fit=crop',
    tag: 'Motion & Film',
    count: '2.4K+ Assets'
  },
  {
    title: 'Templates',
    slug: 'templates',
    description: 'Executive pitch decks, architectural schematics, and editorial master layouts.',
    image: 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1000&auto=format&fit=crop',
    tag: 'Design Systems',
    count: '1.8K+ Assets'
  },
  {
    title: 'Source Code',
    slug: 'software',
    description: 'High-concurrency servers, cryptographic utilities, and low-latency engines.',
    image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=1000&auto=format&fit=crop',
    tag: 'Engineering',
    count: '3.1K+ Assets'
  },
  {
    title: 'UI/UX Assets',
    slug: 'apps',
    description: 'Vector token libraries, luxury UI wireframes, and production Figma components.',
    image: 'https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?q=80&w=1000&auto=format&fit=crop',
    tag: 'Interfaces',
    count: '1.5K+ Assets'
  },
  {
    title: 'Documents',
    slug: 'documents',
    description: 'Archival whitepapers, engineering specifications, and strategic treatises.',
    image: 'https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=1000&auto=format&fit=crop',
    tag: 'Whitepapers',
    count: '980+ Assets'
  },
  {
    title: '3D & Graphics',
    slug: 'photos',
    description: 'Lossless Octane shaders, dark metallic sculptures, and procedural geometries.',
    image: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?q=80&w=1000&auto=format&fit=crop',
    tag: 'Spatial Assets',
    count: '2.6K+ Assets'
  }
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
  const [featuredFiles, setFeaturedFiles] = useState<FileResource[]>([]);
  const [stats, setStats] = useState<{
    totalFiles: number;
    totalDownloads: number;
    totalCategories: number;
    recentlyUpdatedCount: number;
  }>({
    totalFiles: 12450,
    totalDownloads: 85420,
    totalCategories: 52,
    recentlyUpdatedCount: 24
  });
  const [loading, setLoading] = useState(true);
  const [showcaseOpen, setShowcaseOpen] = useState(false);
  const [premiumModalOpen, setPremiumModalOpen] = useState(false);

  useEffect(() => {
    async function loadHomeData() {
      try {
        const [featRes, latestRes, statsRes] = await Promise.all([
          api.getFiles({ featured: true, limit: 8 }),
          api.getFiles({ sort: 'latest', limit: 8 }),
          api.getPublicStats()
        ]);

        const feat = featRes?.files || [];
        const latest = latestRes?.files || [];
        const combined: FileResource[] = [...latest];
        for (const item of feat) {
          if (!combined.some(c => c.id === item.id)) {
            combined.push(item);
          }
        }
        setFeaturedFiles(combined.slice(0, 8));
        if (statsRes) {
          setStats({
            totalFiles: statsRes.totalFiles || 12450,
            totalDownloads: statsRes.totalDownloads || 85420,
            totalCategories: statsRes.totalCategories || 52,
            recentlyUpdatedCount: statsRes.recentlyUpdatedCount || 24
          });
        }
      } catch (err) {
        console.error('Failed to load home data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadHomeData();
  }, []);

  return (
    <div className="flex flex-col w-full relative bg-[#060709] text-zinc-100 overflow-hidden">
      {/* Ambient background illumination */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[350px] bg-[#0c1a30]/30 blur-[160px] rounded-full pointer-events-none -z-0" />
      <div className="absolute top-40 right-10 w-[500px] h-[400px] bg-[#d4af37]/6 blur-[180px] rounded-full pointer-events-none -z-0" />

      {/* 1. CINEMATIC DARK HERO SECTION */}
      <section className="relative pt-6 pb-10 sm:pt-10 sm:pb-16 lg:pt-14 lg:pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-12 items-center">
          
          {/* Left Column: Reference Layout */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Tag chip: PREMIUM DIGITAL ARCHIVE */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-zinc-300 text-xs font-medium mb-3 sm:mb-6 backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d4af37] shadow-[0_0_8px_#d4af37]"></span>
              <span className="uppercase tracking-[0.25em] text-[10px] sm:text-[11px] text-zinc-300 font-semibold font-mono">
                PREMIUM DIGITAL ARCHIVE
              </span>
            </div>

            {/* Editorial Serif Headline: Exact Reference Structure */}
            <h1 className="font-editorial text-[36px] xs:text-[42px] sm:text-5xl md:text-6xl lg:text-[68px] xl:text-[76px] font-normal tracking-tight text-white mb-3 sm:mb-6 leading-[1.08] sm:leading-[1.04]">
              <span className="block">Knowledge Resources</span>
              <span className="block italic text-transparent bg-clip-text bg-gradient-to-r from-[#fff7d6] via-[#e6c875] to-[#c29831]">
                Without Limits.
              </span>
            </h1>

            {/* Short premium description */}
            <p className="text-zinc-400 text-xs sm:text-base lg:text-lg font-light leading-relaxed max-w-lg mb-5 sm:mb-8">
              Explore an exclusive sanctuary of verified architectural blueprints, high-definition cinematography, developer frameworks, and lossless digital assets.
            </p>

            {/* Buttons: Explore Library & Watch Showcase */}
            <div className="flex flex-col xs:flex-row items-stretch xs:items-center gap-3 sm:gap-4 mb-6 sm:mb-8 w-full sm:w-auto">
              <button
                id="hero-explore-btn"
                onClick={() => onNavigate('/library')}
                className="px-6 sm:px-7 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#c29831] text-black text-xs font-semibold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2"
              >
                <span>Explore Library</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                id="hero-showcase-btn"
                onClick={() => setShowcaseOpen(true)}
                className="px-5 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.12] text-zinc-200 text-xs font-semibold uppercase tracking-wider transition-all flex items-center justify-center gap-2 group active:scale-95"
              >
                <div className="w-5 h-5 rounded-full bg-[#d4af37]/20 border border-[#d4af37]/40 flex items-center justify-center text-[#d4af37] group-hover:scale-110 transition-transform">
                  <Play className="w-2.5 h-2.5 fill-current ml-0.5" />
                </div>
                <span>Watch Showcase</span>
              </button>
            </div>

            {/* Subtle creator / trust indicator */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/[0.06] w-full max-w-lg mb-4 lg:mb-0">
              <div className="flex -space-x-2">
                <div className="w-7 h-7 rounded-full bg-[#181922] border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-[#d4af37]">
                  VA
                </div>
                <div className="w-7 h-7 rounded-full bg-[#252634] border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-[#f3e5ab]">
                  01
                </div>
                <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#d4af37] to-[#8a6d3b] border-2 border-[#060709] flex items-center justify-center text-[10px] font-bold text-black">
                  ★
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-zinc-300 font-medium">
                  Curated by Master Archivists
                </span>
                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                  <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" /> 100% Cryptographically Verified &amp; Lossless
                </span>
              </div>
            </div>
          </div>

          {/* Right Column: Architectural interior with huge window opening, moonlit landscape & cinematic dark lighting */}
          <div className="lg:col-span-5 relative w-full flex items-center justify-center">
            <div className="relative w-full rounded-2xl sm:rounded-3xl p-[1px] bg-gradient-to-b from-white/15 via-[#d4af37]/25 to-transparent shadow-[0_20px_50px_rgba(0,0,0,0.85)]">
              <div className="relative w-full h-[220px] sm:h-[340px] md:h-[400px] lg:h-[480px] xl:h-[500px] rounded-[15px] sm:rounded-[23px] overflow-hidden bg-[#090a0f]">
                {/* Architectural interior looking onto moonlit mountain panorama */}
                <img
                  src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=1600&auto=format&fit=crop"
                  alt="Velora Sanctuary Vault"
                  className="w-full h-full object-cover object-center opacity-85 scale-100 hover:scale-105 transition-transform duration-700 ease-out"
                />

                {/* Cinematic ambient shadows & gradients */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-black/20 to-black/30" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-black/40" />

                {/* Subtle gold edge linear light beam */}
                <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-[#d4af37]/70 to-transparent" />

                {/* Top Status Pill */}
                <div className="absolute top-3.5 left-3.5 sm:top-4 sm:left-4 px-2.5 py-1.5 rounded-lg sm:rounded-xl bg-black/60 backdrop-blur-md border border-white/10 flex items-center gap-2 shadow-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                  <span className="text-[9px] sm:text-[10px] uppercase font-mono tracking-wider text-zinc-300">
                    Vault Synchronized • AES-256
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. STATS BAR: ONE PREMIUM HORIZONTAL GLASS PANEL */}
      <section className="px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-10 sm:mb-16 relative z-10">
        <div className="subtle-glass rounded-2xl p-4 sm:p-7 relative overflow-hidden shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 divide-y-0 divide-x-0 sm:divide-x sm:divide-white/[0.08]">
            <div className="flex flex-col items-center text-center p-2">
              <span className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-white mb-0.5">
                12.4K+
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                Premium Resources
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5">
                Lossless architecture
              </span>
            </div>

            <div className="flex flex-col items-center text-center p-2">
              <span className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-white mb-0.5">
                4.3K+
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                Global Users
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5">
                Executive &amp; Tech tiers
              </span>
            </div>

            <div className="flex flex-col items-center text-center p-2">
              <span className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-white mb-0.5">
                50+
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                Categories
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5">
                Curated domain sectors
              </span>
            </div>

            <div className="flex flex-col items-center text-center p-2">
              <span className="font-editorial text-2xl sm:text-3xl lg:text-4xl font-normal text-emerald-400 mb-0.5">
                99.9%
              </span>
              <span className="text-[10px] sm:text-xs uppercase tracking-widest text-[#d4af37] font-semibold">
                Uptime
              </span>
              <span className="text-[9px] sm:text-[10px] text-zinc-500 mt-0.5">
                Verified zero downtime
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CATEGORY SECTION: EXPLORE BY CATEGORY / Discover What You Need */}
      <section id="categories-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-white/[0.06] gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
              EXPLORE BY CATEGORY
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight mt-1">
              Discover What You Need
            </h2>
          </div>
          <button
            id="home-view-all-categories-btn"
            onClick={() => onNavigate('/categories')}
            className="text-xs uppercase tracking-wider font-semibold text-[#d4af37] hover:text-[#f3e5ab] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>All Categories</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Six Visual Cards: Responsive 2-column mobile grid preserving same card design */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
          {CURATED_CATEGORIES.map((cat) => (
            <div
              key={cat.slug}
              id={`category-card-${cat.slug}`}
              onClick={() => onSelectCategory(cat.slug)}
              className="group relative h-40 sm:h-56 lg:h-64 rounded-xl sm:rounded-2xl overflow-hidden border border-white/[0.08] hover:border-[#d4af37]/50 transition-all duration-500 cursor-pointer shadow-[0_10px_25px_rgba(0,0,0,0.6)] hover:shadow-[0_20px_40px_rgba(0,0,0,0.8),0_0_25px_rgba(212,175,55,0.18)]"
            >
              {/* Background Image */}
              <img
                src={cat.image}
                alt={cat.title}
                loading="lazy"
                className="absolute inset-0 w-full h-full object-cover object-center filter brightness-[0.6] group-hover:brightness-85 group-hover:scale-105 transition-all duration-700 ease-out"
              />

              {/* Dark Gradient Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#060709] via-black/40 to-transparent" />

              {/* Tag & Counter Badge */}
              <div className="absolute top-2.5 left-2.5 right-2.5 sm:top-3.5 sm:left-3.5 sm:right-3.5 flex items-center justify-between">
                <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[8px] sm:text-[9px] uppercase font-mono tracking-wider text-[#d4af37]">
                  {cat.tag}
                </span>
                <span className="hidden xs:inline-block text-[9px] sm:text-[10px] text-zinc-300 font-mono bg-black/50 backdrop-blur-md px-1.5 py-0.5 rounded-full border border-white/5">
                  {cat.count}
                </span>
              </div>

              {/* Bottom Content with Title, Description, and Arrow Button */}
              <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:bottom-3.5 sm:left-3.5 sm:right-3.5 flex items-end justify-between gap-2">
                <div>
                  <h3 className="text-sm sm:text-lg lg:text-xl font-medium text-white group-hover:text-[#f3e5ab] transition-colors leading-tight mb-0.5 sm:mb-1">
                    {cat.title}
                  </h3>
                  <p className="hidden sm:block text-zinc-400 text-xs font-light line-clamp-2 leading-relaxed max-w-[240px]">
                    {cat.description}
                  </p>
                </div>

                {/* Subtle Arrow Action Button */}
                <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-white/[0.08] group-hover:bg-[#d4af37] border border-white/10 group-hover:border-[#d4af37] flex items-center justify-center text-zinc-300 group-hover:text-black transition-all flex-shrink-0">
                  <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. FEATURED RESOURCES: FEATURED RESOURCES / Handpicked for You */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-12 w-full relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 sm:mb-8 pb-3 border-b border-white/[0.06] gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#d4af37] font-semibold">
              FEATURED RESOURCES
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight mt-1">
              Handpicked for You
            </h2>
          </div>
          <button
            onClick={() => onNavigate('/library?sort=latest')}
            className="text-xs uppercase tracking-wider font-semibold text-[#d4af37] hover:text-[#f3e5ab] flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          >
            <span>View Full Archive</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Real Database Featured Resources Grid with upgraded FileCard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {(featuredFiles && featuredFiles.length > 0) ? (
            featuredFiles.map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onOpenDetails={onOpenDetails}
              />
            ))
          ) : (
            <div className="col-span-full py-16 text-center text-zinc-500 font-light">
              Loading verified repository assets...
            </div>
          )}
        </div>
      </section>

      {/* 5. PREMIUM CTA: GO PREMIUM / Unlock Exclusive Resources */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-16 w-full relative z-10">
        <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden border border-[#d4af37]/30 bg-gradient-to-br from-[#0c0d13] via-[#090a0f] to-[#12131b] p-5 sm:p-10 lg:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(212,175,55,0.12)]">
          {/* Subtle gold ambient glow in corner */}
          <div className="absolute top-0 right-0 w-[400px] h-[300px] bg-[#d4af37]/8 blur-[120px] rounded-full pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-center relative z-10">
            {/* Left: Abstract premium 3D visual */}
            <div className="lg:col-span-4 flex items-center justify-center">
              <div className="relative w-full max-w-[220px] sm:max-w-[280px] h-[160px] sm:h-[240px] rounded-2xl overflow-hidden border border-white/10 shadow-2xl group">
                <img
                  src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=800&auto=format&fit=crop"
                  alt="Velora Premium 3D Artifact"
                  className="w-full h-full object-cover filter contrast-125 brightness-90 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                <div className="absolute bottom-2.5 left-2.5 right-2.5 text-center">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.25em] text-[#d4af37] font-mono font-semibold">
                    Master Cryptographic Token
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Premium Value Proposition */}
            <div className="lg:col-span-8 flex flex-col items-start">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d4af37]/10 border border-[#d4af37]/30 text-[#d4af37] text-[10px] uppercase font-bold tracking-[0.25em] mb-2.5 sm:mb-3">
                <Sparkles className="w-3 h-3" />
                <span>GO PREMIUM</span>
              </div>

              <h3 className="text-xl sm:text-3xl lg:text-4xl font-light text-white tracking-tight mb-2.5 sm:mb-3">
                Unlock Exclusive Resources
              </h3>

              <p className="text-zinc-400 text-xs sm:text-base font-light leading-relaxed max-w-xl mb-5 sm:mb-6">
                Gain unrestricted high-throughput access to master-grade assets, uncompressed developer packages, and lossless media vaults curated specifically for high-tier creators.
              </p>

              {/* Benefits Checklist */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mb-6 sm:mb-8 w-full max-w-xl">
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <span>Unlimited High-Speed Transmission</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <span>Lossless Master File Formats</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <span>Priority Ingestion &amp; API Access</span>
                </div>
                <div className="flex items-center gap-2.5 text-xs text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-[#d4af37] flex-shrink-0" />
                  <span>Direct Concierge Technical Support</span>
                </div>
              </div>

              {/* Get Premium CTA Button */}
              <button
                id="premium-banner-cta"
                onClick={() => setPremiumModalOpen(true)}
                className="w-full sm:w-auto px-7 sm:px-8 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-[#d4af37] via-[#e5c158] to-[#caa446] text-black text-xs font-bold uppercase tracking-wider hover:brightness-110 active:scale-95 transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2"
              >
                <span>Get Premium</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 6. CONNECT WITH ME: INSTAGRAM PROFILE DIRECT LINK */}
      <InstagramSection />

      {/* SHOWCASE MODAL (WATCH SHOWCASE) */}
      {showcaseOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-3xl rounded-3xl bg-[#0a0b10] border border-[#d4af37]/30 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/[0.08]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37]">
                  <Play className="w-3.5 h-3.5 fill-current" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-medium text-white">
                    VELORA Cinematic Vault Showcase
                  </h3>
                  <span className="text-[9px] sm:text-[10px] text-zinc-400 uppercase tracking-widest font-mono">
                    High-Definition Architectural Tour
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowcaseOpen(false)}
                className="p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Showcase Visual */}
            <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
              <img
                src="https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=1200&auto=format&fit=crop"
                alt="Vault Showcase"
                className="w-full h-full object-cover opacity-75"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />
              <div className="absolute text-center px-4 sm:px-6">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#d4af37] text-black mx-auto flex items-center justify-center shadow-[0_0_30px_rgba(212,175,55,0.6)] mb-2 sm:mb-3 animate-pulse">
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 fill-current ml-0.5" />
                </div>
                <h4 className="text-base sm:text-xl font-medium text-white mb-1">
                  Engineered for Absolute Precision
                </h4>
                <p className="text-zinc-400 text-[11px] sm:text-xs max-w-md mx-auto">
                  Featuring ultra-low latency CDN edge delivery, SHA-256 cryptographic verification, and lossless master formats.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3.5 sm:p-6 flex items-center justify-between bg-white/[0.02]">
              <span className="text-[11px] sm:text-xs text-zinc-400 font-mono">
                Lossless 4K Stream • 60 FPS
              </span>
              <button
                onClick={() => {
                  setShowcaseOpen(false);
                  onNavigate('/library');
                }}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl bg-[#d4af37] text-black text-xs font-bold uppercase tracking-wider hover:bg-[#e5c158] transition-colors"
              >
                Enter Archive Vault
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PREMIUM CONCIERGE MODAL */}
      {premiumModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0b0c12] border border-[#d4af37]/40 p-5 sm:p-8 shadow-2xl">
            <button
              onClick={() => setPremiumModalOpen(false)}
              className="absolute top-4 right-4 sm:top-5 sm:right-5 p-1.5 sm:p-2 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-[#d4af37]/10 border border-[#d4af37]/30 flex items-center justify-center text-[#d4af37] mb-3 sm:mb-4">
              <Award className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>

            <h3 className="text-lg sm:text-2xl font-light text-white mb-2">
              Velora Executive Tier
            </h3>
            <p className="text-zinc-400 text-xs sm:text-sm font-light leading-relaxed mb-4 sm:mb-5">
              Our master vault includes enterprise-level throughput, raw uncompressed production master files, and dedicated single-owner ingestion channels.
            </p>

            <div className="space-y-2 mb-5 sm:mb-6 bg-white/[0.02] border border-white/[0.06] p-3 sm:p-4 rounded-xl sm:rounded-2xl">
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Instant access to all verified archival releases</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Zero rate limits or bandwidth throttling</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-zinc-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#d4af37]" />
                <span>Direct API keys for automated programmatic ingestion</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setPremiumModalOpen(false);
                  onNavigate('/contact');
                }}
                className="flex-1 py-2.5 sm:py-3 bg-[#d4af37] hover:bg-[#e5c158] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_20px_rgba(212,175,55,0.3)] text-center"
              >
                Contact Concierge
              </button>
              <button
                onClick={() => setPremiumModalOpen(false)}
                className="px-4 sm:px-5 py-2.5 sm:py-3 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-semibold rounded-xl border border-white/10"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
