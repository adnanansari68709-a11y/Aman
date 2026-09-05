import React, { useState } from 'react';
import { Download, ExternalLink, Loader2, Sparkles, CheckCircle2 } from 'lucide-react';
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

  const extension = getFileExtension(file.fileName);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (downloading) return;

    setDownloading(true);
    try {
      // Create a hidden anchor pointing directly to the download endpoint
      // This validates the file on server, increments downloadCount in database, and streams the payload
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
      className="bg-white/5 border border-white/10 p-6 rounded-3xl hover:border-[#D4AF37]/40 transition-all duration-300 group relative overflow-hidden flex flex-col h-full cursor-pointer hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
    >
      {/* Featured Star Badge */}
      {file.featured && (
        <div className="absolute top-3 right-3 z-10 flex items-center gap-1 bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-md">
          <Sparkles className="w-2.5 h-2.5" /> Featured
        </div>
      )}

      {/* Media / Preview container */}
      <div className="h-32 bg-black/40 rounded-2xl mb-4 flex items-center justify-center border border-white/5 overflow-hidden relative group-hover:border-[#D4AF37]/30 transition-all">
        {file.thumbnailUrl ? (
          <img
            src={file.thumbnailUrl}
            alt={file.title}
            loading="lazy"
            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
          />
        ) : (
          <div className="w-12 h-12 border-2 border-[#D4AF37]/20 rounded-full flex items-center justify-center group-hover:scale-110 group-hover:border-[#D4AF37]/60 transition-transform duration-300">
            <span className="text-[#D4AF37] text-sm font-bold tracking-wider font-mono">
              {extension}
            </span>
          </div>
        )}

        {/* Hover overlay hint */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <span className="text-xs text-white font-medium flex items-center gap-1">
            View Details <ExternalLink className="w-3 h-3 text-[#D4AF37]" />
          </span>
        </div>
      </div>

      {/* Meta Top Line */}
      <div className="flex justify-between items-start mb-2">
        <span className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold">
          {file.categoryName || 'Resource'}
        </span>
        <span className="text-[10px] text-white/40 font-mono">
          {formatBytes(file.fileSize)}
        </span>
      </div>

      {/* Resource Title */}
      <h3 className="text-white font-medium mb-2 text-base leading-snug group-hover:text-[#D4AF37] transition-colors line-clamp-1">
        {file.title}
      </h3>

      {/* Snippet */}
      <p className="text-[#A0A0A0] text-xs font-light leading-relaxed mb-4 line-clamp-2">
        {file.description || 'Verified cryptographic asset stored in the VELORA primary archive.'}
      </p>

      {/* Card Footer with Download Counter and Action Button */}
      <div className="flex items-center justify-between mt-auto pt-4 border-t border-white/5">
        <div className="flex items-center gap-1.5 text-[10px] text-white/50 font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>{formatDownloadCount(currentDownloads)} Downloads</span>
        </div>

        <button
          id={`download-btn-${file.id}`}
          onClick={handleDownload}
          disabled={downloading}
          className={`p-2.5 rounded-xl border transition-all flex items-center justify-center ${
            downloadSuccess
              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
              : 'bg-white/5 border-white/10 hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] text-white'
          }`}
          title="Download resource"
        >
          {downloading ? (
            <Loader2 className="w-4 h-4 animate-spin text-[#D4AF37]" />
          ) : downloadSuccess ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Download className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  );
};
