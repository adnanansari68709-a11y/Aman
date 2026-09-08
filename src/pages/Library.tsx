import React, { useState, useEffect } from 'react';
import { Search, Filter, ArrowUpDown, Loader2, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { Category, FileResource } from '../types';
import { FileCard } from '../components/FileCard';
import { api } from '../services/api';

interface LibraryProps {
  initialCategory?: string;
  initialSearch?: string;
  onOpenDetails: (slug: string) => void;
  onCategorySelect?: (slug: string) => void;
}

export const Library: React.FC<LibraryProps> = ({
  initialCategory = '',
  initialSearch = '',
  onOpenDetails,
  onCategorySelect
}) => {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sort, setSort] = useState<'latest' | 'downloads' | 'name_asc' | 'name_desc'>('latest');
  const [page, setPage] = useState(1);
  const [limit] = useState(12);

  const [files, setFiles] = useState<FileResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [allSectorsCount, setAllSectorsCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Sync initialCategory or initialSearch if props change
  useEffect(() => {
    if (initialCategory !== undefined) setSelectedCategory(initialCategory);
  }, [initialCategory]);

  useEffect(() => {
    if (initialSearch !== undefined) setSearch(initialSearch);
  }, [initialSearch]);

  // Load Categories once
  useEffect(() => {
    async function fetchCats() {
      try {
        const cats = await api.getCategories();
        const mainOrder = ['apps', 'videos', 'photos', 'music', 'documents', 'templates', 'software', 'games'];
        const sortedCats = [...cats].sort((a, b) => {
          const idxA = mainOrder.indexOf(a.slug.toLowerCase());
          const idxB = mainOrder.indexOf(b.slug.toLowerCase());
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return a.name.localeCompare(b.name);
        });
        setCategories(sortedCats);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    fetchCats();
  }, []);

  // Fetch files when filters change
  useEffect(() => {
    let cancelled = false;

    async function fetchFiles() {
      setLoading(true);
      try {
        const res = await api.getFiles({
          category: selectedCategory || undefined,
          categorySlug: selectedCategory || undefined,
          search: search.trim() || undefined,
          sort,
          page,
          limit
        });

        if (!cancelled) {
          setFiles(res?.files || []);
          setTotal(res?.total || 0);
          if (!selectedCategory && !search.trim()) {
            setAllSectorsCount(res?.total || 0);
          }
          setTotalPages(res?.totalPages || 1);
        }
      } catch (err) {
        console.error('Failed to fetch library files:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchFiles();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, search, sort, page, limit]);

  const handleCategoryChange = (slug: string) => {
    setSelectedCategory(slug);
    setPage(1);
    if (onCategorySelect) onCategorySelect(slug);
  };

  const handleClearFilters = () => {
    setSearch('');
    setSelectedCategory('');
    setSort('latest');
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full min-h-[75vh]">
      {/* Page Header */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-white/5 pb-8">
        <div>
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
            Central Repository
          </span>
          <h1 className="text-3xl sm:text-4xl font-light tracking-tight text-white mt-1">
            Resource Library
          </h1>
          <p className="text-zinc-400 text-sm font-light mt-1">
            Browse, filter, and inspect verified digital assets across all sectors.
          </p>
        </div>

        <div className="text-xs text-zinc-400 font-mono">
          Showing <span className="text-[#D4AF37] font-bold">{files.length}</span> of{' '}
          <span className="text-white font-bold">{total}</span> assets
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 sm:p-5 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            id="library-search-input"
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search resources by title, tag, or format..."
            className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-11 pr-8 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4AF37]/50"
          />
          {search && (
            <button
              onClick={() => {
                setSearch('');
                setPage(1);
              }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort and Clear */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#D4AF37]" />
            <select
              id="library-sort-select"
              value={sort}
              onChange={(e) => {
                setSort(e.target.value as any);
                setPage(1);
              }}
              className="bg-black/60 border border-white/10 text-white rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-[#D4AF37]/50 cursor-pointer"
            >
              <option value="latest">Latest Additions</option>
              <option value="downloads">Most Downloaded</option>
              <option value="name_asc">Alphabetical (A - Z)</option>
              <option value="name_desc">Alphabetical (Z - A)</option>
            </select>
          </div>

          {(selectedCategory || search) && (
            <button
              onClick={handleClearFilters}
              className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 font-semibold"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          )}
        </div>
      </div>

      {/* Category Pills Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        <button
          onClick={() => handleCategoryChange('')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
            selectedCategory === ''
              ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
              : 'bg-white/5 border border-white/10 text-zinc-300 hover:border-[#D4AF37]/40 hover:text-white'
          }`}
        >
          All Sectors ({allSectorsCount > 0 ? allSectorsCount : total})
        </button>
        {(categories || []).map((cat) => {
          const isSelected = selectedCategory.toLowerCase() === cat.slug.toLowerCase();
          return (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.slug)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-[#D4AF37] text-black shadow-[0_0_15px_rgba(212,175,55,0.3)]'
                  : 'bg-white/5 border border-white/10 text-zinc-300 hover:border-[#D4AF37]/40 hover:text-white'
              }`}
            >
              {cat.name} {cat.fileCount !== undefined ? `(${cat.fileCount})` : ''}
            </button>
          );
        })}
      </div>

      {/* File Cards Grid / States */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
          <span className="text-sm font-light">Retrieving archive payloads...</span>
        </div>
      ) : (files || []).length === 0 ? (
        <div className="py-20 text-center bg-white/5 border border-white/10 rounded-3xl p-10 max-w-lg mx-auto">
          <div className="w-12 h-12 rounded-full border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4 text-[#D4AF37]">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No resources found</h3>
          <p className="text-zinc-400 text-xs font-light mb-6">
            We could not find any verified files matching your search filters. Try broader keywords or switch categories.
          </p>
          <button
            onClick={handleClearFilters}
            className="px-6 py-2.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] transition-all"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
            {(files || []).map((file) => (
              <FileCard
                key={file.id}
                file={file}
                onOpenDetails={onOpenDetails}
              />
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-white/5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#D4AF37]/40 flex items-center gap-1"
              >
                <ChevronLeft className="w-4 h-4" /> Previous
              </button>
              <div className="text-xs text-zinc-400 font-mono px-3">
                Page <span className="text-white font-bold">{page}</span> of {totalPages}
              </div>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 disabled:opacity-30 disabled:cursor-not-allowed hover:border-[#D4AF37]/40 flex items-center gap-1"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
