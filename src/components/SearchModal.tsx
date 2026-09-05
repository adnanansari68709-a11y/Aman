import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Loader2, FileText, ArrowRight } from 'lucide-react';
import { FileResource } from '../types';
import { api } from '../services/api';
import { formatBytes } from '../utils/formatters';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFile: (slug: string) => void;
  onViewAllResults: (query: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectFile,
  onViewAllResults
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<FileResource[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await api.getFiles({ search: query.trim(), limit: 6 });
        setResults(data?.files || []);
      } catch (err) {
        console.error('Search query error:', err);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onViewAllResults(query.trim());
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        id="search-dialog"
        className="w-full max-w-2xl bg-[#0b0b0e] border border-white/10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.8)] overflow-hidden"
      >
        {/* Input Header */}
        <form onSubmit={handleSubmit} className="relative flex items-center px-6 py-5 border-b border-white/10">
          <Search className="w-5 h-5 text-[#D4AF37] mr-3" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search across files, tags, whitepapers, formats..."
            className="w-full bg-transparent text-white placeholder-zinc-500 text-base focus:outline-none"
          />
          {loading ? (
            <Loader2 className="w-5 h-5 text-[#D4AF37] animate-spin ml-2" />
          ) : query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={onClose}
            className="ml-3 p-1.5 rounded-lg border border-white/10 text-xs text-zinc-400 hover:text-white"
          >
            ESC
          </button>
        </form>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-4 space-y-2">
          {(results || []).length > 0 ? (
            <>
              <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-semibold px-3 py-1">
                Top Matches ({(results || []).length})
              </div>
              {(results || []).map((file) => (
                <div
                  key={file.id}
                  onClick={() => {
                    onSelectFile(file.slug);
                    onClose();
                  }}
                  className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 border border-transparent hover:border-[#D4AF37]/30 cursor-pointer transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#D4AF37] font-mono text-xs font-bold">
                      {file.fileName.split('.').pop()?.toUpperCase() || 'FILE'}
                    </div>
                    <div>
                      <div className="text-white text-sm font-medium group-hover:text-[#D4AF37] transition-colors line-clamp-1">
                        {file.title}
                      </div>
                      <div className="text-xs text-zinc-500 flex items-center gap-2">
                        <span>{file.categoryName}</span>
                        <span>•</span>
                        <span>{formatBytes(file.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
                </div>
              ))}

              <div className="pt-2 border-t border-white/5">
                <button
                  onClick={() => {
                    onViewAllResults(query.trim());
                    onClose();
                  }}
                  className="w-full py-2 text-center text-xs font-semibold text-[#D4AF37] hover:underline"
                >
                  View all results in Library &rarr;
                </button>
              </div>
            </>
          ) : query.trim() && !loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No resources found matching &quot;{query}&quot;. Try a different keyword or category.
            </div>
          ) : (
            <div className="py-8 text-center text-zinc-500 text-xs">
              Type keywords such as <span className="text-[#D4AF37]">&quot;Blueprint&quot;</span>,{' '}
              <span className="text-[#D4AF37]">&quot;Vector&quot;</span>, or{' '}
              <span className="text-[#D4AF37]">&quot;Protocol&quot;</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
