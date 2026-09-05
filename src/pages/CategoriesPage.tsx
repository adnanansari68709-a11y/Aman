import React from 'react';
import { 
  LayoutGrid, Video, Image, Music, FileText, Layout, Code, Gamepad2, ArrowLeft 
} from 'lucide-react';

interface CategoriesPageProps {
  onSelectCategory: (slug: string) => void;
  onNavigate: (route: string) => void;
}

const MAIN_CATEGORIES = [
  { name: 'Apps', slug: 'apps', icon: LayoutGrid },
  { name: 'Videos', slug: 'videos', icon: Video },
  { name: 'Photos', slug: 'photos', icon: Image },
  { name: 'Music', slug: 'music', icon: Music },
  { name: 'Documents', slug: 'documents', icon: FileText },
  { name: 'Templates', slug: 'templates', icon: Layout },
  { name: 'Software', slug: 'software', icon: Code },
  { name: 'Games', slug: 'games', icon: Gamepad2 },
];

export const CategoriesPage: React.FC<CategoriesPageProps> = ({
  onSelectCategory,
  onNavigate
}) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      {/* Navigation breadcrumb */}
      <div className="mb-6">
        <button
          id="categories-back-btn"
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-xs uppercase tracking-wider font-semibold text-zinc-400 hover:text-[#D4AF37] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Overview
        </button>
      </div>

      {/* Header */}
      <div className="mb-12 text-center max-w-2xl mx-auto">
        <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
          Directory
        </span>
        <h1 className="text-3xl sm:text-5xl font-light tracking-tight text-white mt-2 mb-4">
          Categories
        </h1>
        <p className="text-zinc-400 text-sm font-light leading-relaxed">
          Explore our curated vault of digital assets organized by category.
        </p>
      </div>

      {/* Simplified Category Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {MAIN_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          return (
            <div
              key={cat.slug}
              id={`categories-page-card-${cat.slug}`}
              onClick={() => onSelectCategory(cat.slug)}
              className="bg-white/[0.03] hover:bg-white/[0.08] border border-white/10 hover:border-[#D4AF37]/50 p-6 sm:p-8 rounded-2xl transition-all duration-300 cursor-pointer group flex flex-col items-center justify-center text-center gap-4 hover:shadow-[0_0_25px_rgba(212,175,55,0.14)] active:scale-[0.98]"
            >
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-black/50 border border-white/10 flex items-center justify-center text-[#D4AF37] group-hover:scale-110 group-hover:border-[#D4AF37]/50 group-hover:bg-[#D4AF37]/10 transition-all duration-300 shadow-inner">
                <Icon className="w-7 h-7 sm:w-8 sm:h-8" />
              </div>
              <h3 className="text-white font-medium text-base sm:text-lg group-hover:text-[#D4AF37] transition-colors tracking-tight">
                {cat.name}
              </h3>
            </div>
          );
        })}
      </div>
    </div>
  );
};
