import React, { useState, useEffect } from 'react';
import { Download, ExternalLink, Loader2, Sparkles, CheckCircle2, Bookmark, Star, Eye, Play } from 'lucide-react';
import { FileResource } from '../types';
import { formatBytes, formatDownloadCount, getFileExtension } from '../utils/formatters';
import { api } from '../services/api';

interface FileCardProps {
  file: FileResource;
  onOpenDetails: (slug: string) => void;
  onDownloadCompleted?: (fileId: string) => void;
}

export const FileCard: React.FC<FileCardProps> = ({
  file,
  onOpenDetails,
  onDownloadCompleted
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [currentDownloads, setCurrentDownloads] = useState(file.downloadCount);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('velora_bookmarks');
      if (saved) {
        const list: string[] = JSON.parse(saved);
        setIsBookmarked(list.includes(file.id));
      }
    } catch {
      // ignore
    }
  }, [file.id]);

  const toggleBookmark = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const saved = localStorage.getItem('velora_bookmarks');
      let list: string[] = saved ? JSON.parse(saved) : [];
      if (list.includes(file.id)) {
        list = list.filter((id) => id !== file.id);
        setIsBookmarked(false);
      } else {
        list.push(file.id);
        setIsBookmarked(true);
      }
      localStorage.setItem('velora_bookmarks', JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const extension = getFileExtension(file.fileName);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;

    setDownloading(true);
    try {
      const downloadUrl = api.getDownloadUrl(file.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setCurrentDownloads((prev) => prev + 1);
      setDownloadSuccess(true);
      if (onDownloadCompleted) {
        onDownloadCompleted(file.id);
      }
      setTimeout(() => setDownloadSuccess(false), 2500);
    } catch (err) {
      console.error('Download trigger failed:', err);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  return (
    <div
      id={`file-card-${file.id}`}
      onClick={() => onOpenDetails(file.slug)}
      className="bg-[#0b0c11]/85 border border-white/[0.08] hover:border-[#d4af37]/45 rounded-2xl p-4 sm:p-5 transition-all duration-300 group relative flex flex-col h-full cursor-pointer hover:shadow-[0_16px_36px_-10px_rgba(0,0,0,0.8),0_0_24px_-6px_rgba(212,175,55,0.18)] hover:-translate-y-1"
    >
      {/* Top badges: Bookmark & Featured / Rating */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <button
          onClick={toggleBookmark}
          className={`p-1.5 rounded-lg border transition-all ${
            isBookmarked
              ? 'bg-[#d4af37]/20 border-[#d4af37]/60 text-[#d4af37]'
              : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-[#d4af37] hover:border-[#d4af37]/30'
          }`}
          title={isBookmarked ? 'Remove bookmark' : 'Bookmark resource'}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
        </button>

        <div className="flex items-center gap-1.5">
          {file.featured && (
            <span className="inline-flex items-center gap-1 bg-[#d4af37]/15 border border-[#d4af37]/35 text-[#d4af37] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-zinc-300 font-mono bg-white/[0.05] border border-white/[0.08] px-2 py-0.5 rounded-full">
            <Star className="w-2.5 h-2.5 text-[#d4af37] fill-[#d4af37]" /> 4.9
          </span>
        </div>
      </div>

      {/* Media / Preview container */}
      {(() => {
        const thumb = file.thumbnailUrl || (file as any).thumbnail;
        const isVideo = (file.mimeType && file.mimeType.startsWith('video/')) || 
          (file.fileName && /\.(mp4|webm|mov|mkv|avi|m4v)$/i.test(file.fileName)) ||
          file.type === 'video' ||
          ((file as any).type && (file as any).type.startsWith('video/')) ||
          file.categorySlug === 'videos' ||
          file.categoryId === 'cat_videos';
        const finalThumb = thumb || (isVideo ? 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?q=80&w=800&auto=format&fit=crop' : '');

        return (
          <div className="h-36 sm:h-40 bg-[#07080b] rounded-xl mb-4 flex items-center justify-center border border-white/[0.06] overflow-hidden relative group-hover:border-[#d4af37]/30 transition-all">
            {finalThumb ? (
              <img
                src={finalThumb}
                alt={file.title}
                loading="lazy"
                className="w-full h-full object-cover opacity-85 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
              />
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-white/[0.04] border border-[#d4af37]/25 flex items-center justify-center group-hover:scale-110 group-hover:border-[#d4af37]/60 group-hover:bg-[#d4af37]/10 transition-all duration-300">
                  <span className="text-[#d4af37] text-xs font-bold tracking-widest font-mono">
                    {extension || 'BIN'}
                  </span>
                </div>
                <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">
                  {file.mimeType?.split('/')[0] || 'Resource'}
                </span>
              </div>
            )}

            {isVideo && (
              <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-black/70 border border-[#d4af37]/50 text-[#d4af37] text-[9px] font-semibold flex items-center gap-1 backdrop-blur-sm shadow-md">
                <Play className="w-2.5 h-2.5 fill-current" /> VIDEO
              </div>
            )}

            {/* Hover quick action overlay */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-[2px]">
              <span className="text-xs text-white font-medium flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#d4af37] text-black font-semibold shadow-lg">
                <Eye className="w-3.5 h-3.5 text-black" /> Preview
              </span>
            </div>
          </div>
        );
      })()}

      {/* Meta Top Line */}
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-[10px] uppercase tracking-[0.2em] text-[#d4af37] font-semibold">
          {file.categoryName || 'Resource'}
        </span>
        <span className="text-[10px] text-zinc-400 font-mono">
          {formatBytes(file.fileSize)}
        </span>
      </div>

      {/* Resource Title */}
      <h3 className="text-white font-medium mb-1.5 text-sm sm:text-base leading-snug group-hover:text-[#f3e5ab] transition-colors line-clamp-1">
        {file.title}
      </h3>

      {/* Description */}
      <p className="text-zinc-400 text-xs font-light leading-relaxed mb-4 line-clamp-2">
        {file.description || 'Verified cryptographic asset stored in the AMANX ARCHIVE primary vault.'}
      </p>

      {/* Card Footer with Download Counter and Action Button */}
      <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span>{formatDownloadCount(currentDownloads)} downloads</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`download-btn-${file.id}`}
            onClick={handleDownload}
            disabled={downloading}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition-all flex items-center gap-1.5 ${
              downloadSuccess
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-white/[0.05] border-white/10 hover:bg-[#d4af37] hover:text-black hover:border-[#d4af37] text-zinc-200'
            }`}
            title="Download verified asset"
          >
            {downloading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#d4af37]" />
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Ready</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Get</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
