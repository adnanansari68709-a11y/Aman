import React, { useState, useEffect, useRef } from 'react';
import {
  Download,
  Calendar,
  Layers,
  HardDrive,
  Hash,
  Eye,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Share2,
  FileText,
  Play,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { FileResource } from '../types';
import { api } from '../services/api';
import { formatBytes, formatDate, formatDownloadCount, getFileExtension } from '../utils/formatters';
import { FileCard } from '../components/FileCard';

interface FileDetailProps {
  slug: string;
  onNavigate: (route: string) => void;
  onOpenCategory: (slug: string) => void;
}

export const FileDetail: React.FC<FileDetailProps> = ({
  slug,
  onNavigate,
  onOpenCategory
}) => {
  const [file, setFile] = useState<(FileResource & { related: FileResource[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [loadingPreviewText, setLoadingPreviewText] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    if (file && videoRef.current) {
      setVideoError(null);
      videoRef.current.load();
    }
  }, [file?.id]);

  useEffect(() => {
    let active = true;

    async function loadFile() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getFileBySlug(slug);
        if (active) {
          setFile(data);
          // Set dynamic SEO metadata
          document.title = `${data.title} | VELORA`;

          // If text or json or csv or md, fetch preview text snippet
          const ext = getFileExtension(data.fileName).toLowerCase();
          if (['txt', 'csv', 'json', 'md'].includes(ext)) {
            fetchPreviewText(data.id);
          }
        }
      } catch (err: any) {
        if (active) {
          setError(err.message || 'The designated resource could not be located.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadFile();
    return () => {
      active = false;
    };
  }, [slug]);

  const fetchPreviewText = async (fileId: string) => {
    setLoadingPreviewText(true);
    try {
      const res = await fetch(api.getPreviewUrl(fileId));
      if (res.ok) {
        const text = await res.text();
        setPreviewTextContent(text.slice(0, 3000));
      }
    } catch {
      // ignore
    } finally {
      setLoadingPreviewText(false);
    }
  };

  const handleDownload = () => {
    if (!file || downloading) return;

    setDownloading(true);
    try {
      const downloadUrl = api.getDownloadUrl(file.id);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', file.fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Optimistically update local download count
      setFile((prev) => (prev ? { ...prev, downloadCount: prev.downloadCount + 1 } : prev));
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error('Download execution failed:', err);
    } finally {
      setTimeout(() => setDownloading(false), 600);
    }
  };

  const handleCopyShareUrl = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-10 h-10 animate-spin text-[#D4AF37] mb-4" />
        <p className="text-sm font-light">Resolving cryptographic resource from vault...</p>
      </div>
    );
  }

  if (error || !file) {
    return (
      <div className="max-w-xl mx-auto my-20 px-6 py-14 text-center bg-white/5 border border-white/10 rounded-3xl">
        <div className="w-12 h-12 rounded-full border border-red-500/40 text-red-400 flex items-center justify-center mx-auto mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-medium text-white mb-2">Resource Unavailable</h2>
        <p className="text-zinc-400 text-xs font-light mb-6">
          {error || 'This asset may have been unlisted, moved, or deleted by the administrator.'}
        </p>
        <button
          onClick={() => onNavigate('/library')}
          className="px-6 py-2.5 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] transition-all"
        >
          Return to Library
        </button>
      </div>
    );
  }

  const ext = getFileExtension(file.fileName).toLowerCase();
  const isImage = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'].includes(ext) || (file.mimeType && file.mimeType.startsWith('image/'));
  const isAudio = ['mp3', 'wav', 'ogg', 'aac'].includes(ext) || (file.mimeType && file.mimeType.startsWith('audio/')) || file.type === 'audio';
  const isVideo = ['mp4', 'webm', 'mov', 'mkv', 'avi'].includes(ext) || (file.mimeType && file.mimeType.startsWith('video/')) || file.type === 'video' || file.categoryId === 'cat_videos' || file.categorySlug === 'videos';
  const isPdf = ext === 'pdf' || file.mimeType === 'application/pdf';
  const isText = ['txt', 'csv', 'json', 'md'].includes(ext) || (file.mimeType && file.mimeType.startsWith('text/'));
  const thumb = file.thumbnailUrl || (file as any).thumbnail;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-xs text-zinc-500 mb-8 overflow-x-auto whitespace-nowrap">
        <button onClick={() => onNavigate('/')} className="hover:text-white transition-colors">
          Home
        </button>
        <span>/</span>
        <button onClick={() => onNavigate('/library')} className="hover:text-white transition-colors">
          Library
        </button>
        <span>/</span>
        <button
          onClick={() => onOpenCategory(file.categorySlug || '')}
          className="hover:text-[#D4AF37] transition-colors"
        >
          {file.categoryName}
        </button>
        <span>/</span>
        <span className="text-zinc-300 font-medium truncate max-w-xs">{file.title}</span>
      </nav>

      {/* Main Resource Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-16">
        {/* Left Column: Visual / Preview Display */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 relative overflow-hidden backdrop-blur-md">
            {/* Header badges */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                {file.categoryName} Archive
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyShareUrl}
                  className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-300 hover:text-white hover:border-white/20 transition-all flex items-center gap-1.5"
                  title="Copy permanent resource link"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>{copiedUrl ? 'Copied Link' : 'Share'}</span>
                </button>
              </div>
            </div>

            {/* Media Presentation Box */}
            <div className="w-full bg-black/60 border border-white/5 rounded-2xl overflow-hidden flex items-center justify-center relative min-h-[280px] sm:min-h-[380px]">
              {isImage ? (
                <img
                  src={api.getPreviewUrl(file.id)}
                  alt={file.title}
                  className="max-h-[440px] w-full object-contain rounded-xl p-2"
                />
              ) : isVideo ? (
                <div className="w-full relative flex flex-col items-center justify-center">
                  <video
                    key={file.id}
                    ref={videoRef}
                    controls
                    playsInline
                    preload="metadata"
                    src={api.getPreviewUrl(file.id)}
                    className="w-full max-h-[460px] rounded-xl bg-black"
                    poster={thumb || undefined}
                    onLoadedMetadata={() => {
                      setVideoError(null);
                    }}
                    onError={(e) => {
                      const target = e.currentTarget;
                      const mediaErr = target.error;
                      let msg = 'Playback interrupted. You can retry streaming or download the video directly.';
                      if (mediaErr?.code === 1) msg = 'Video loading was aborted.';
                      else if (mediaErr?.code === 2) msg = 'A network error occurred while streaming the video.';
                      else if (mediaErr?.code === 3) msg = 'Media decode error or video stream corrupt.';
                      else if (mediaErr?.code === 4) msg = 'Video format not supported by browser or stream unavailable.';
                      setVideoError(msg);
                    }}
                  >
                    <source src={api.getPreviewUrl(file.id)} type={file.mimeType || 'video/mp4'} />
                    {file.fileUrl && file.fileUrl !== api.getPreviewUrl(file.id) && (
                      <source
                        src={file.fileUrl.startsWith('http') ? file.fileUrl : `${window.location.origin}${file.fileUrl}`}
                        type={file.mimeType || 'video/mp4'}
                      />
                    )}
                    Your browser does not support HTML5 video playback.
                  </video>

                  {videoError && (
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
                        <AlertCircle className="w-6 h-6" />
                      </div>
                      <h4 className="text-white font-medium text-sm mb-1">Playback Issue</h4>
                      <p className="text-xs text-zinc-400 max-w-sm mb-4 leading-relaxed">{videoError}</p>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setVideoError(null);
                            if (videoRef.current) {
                              videoRef.current.load();
                            }
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-xs font-medium transition-colors flex items-center gap-1.5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> Retry Stream
                        </button>
                        <button
                          type="button"
                          onClick={handleDownload}
                          className="px-3.5 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c49f2f] text-black text-xs font-semibold transition-colors flex items-center gap-1.5"
                        >
                          <Download className="w-3.5 h-3.5" /> Download Media
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : isAudio ? (
                <div className="w-full p-8 flex flex-col items-center justify-center space-y-6">
                  <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/30 flex items-center justify-center bg-[#D4AF37]/10">
                    <Play className="w-8 h-8 text-[#D4AF37] fill-[#D4AF37]/20" />
                  </div>
                  <div className="text-center">
                    <div className="text-white font-medium">{file.fileName}</div>
                    <div className="text-xs text-zinc-400 font-mono mt-1">Lossless Audio Stream</div>
                  </div>
                  <audio controls src={api.getPreviewUrl(file.id)} className="w-full max-w-md" />
                </div>
              ) : isPdf ? (
                <div className="w-full h-[400px] flex flex-col items-center justify-center p-6 text-center">
                  <div className="w-16 h-16 rounded-2xl border border-[#D4AF37]/30 bg-black/50 flex items-center justify-center mb-4 text-[#D4AF37]">
                    <FileText className="w-8 h-8" />
                  </div>
                  <h4 className="text-white font-medium text-base mb-1">Adobe PDF Document</h4>
                  <p className="text-xs text-zinc-400 max-w-xs mb-4 font-light">
                    This specification file is ready for direct inspection and verified transmission.
                  </p>
                  <a
                    href={api.getPreviewUrl(file.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-xs text-white transition-all flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#D4AF37]" /> Open in Native PDF Viewer
                  </a>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 rounded-full border-2 border-[#D4AF37]/30 flex items-center justify-center mb-4 text-[#D4AF37] font-mono text-xl font-bold bg-[#D4AF37]/5">
                    {ext.toUpperCase()}
                  </div>
                  <span className="text-white font-medium text-sm">{file.fileName}</span>
                  <span className="text-xs text-zinc-500 font-mono mt-1">{file.mimeType}</span>
                </div>
              )}
            </div>

            {/* In-browser preview for text/code snippets */}
            {isText && previewTextContent && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs uppercase tracking-wider text-zinc-400 font-semibold flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#D4AF37]" /> File Content Preview
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">First 3,000 bytes</span>
                </div>
                <pre className="p-4 bg-black/70 border border-white/10 rounded-xl text-xs font-mono text-zinc-300 overflow-x-auto max-h-56 scrollbar-thin">
                  {previewTextContent}
                </pre>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata & Verified Download Pipeline */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 flex flex-col justify-between backdrop-blur-md h-full">
            <div>
              {/* Title & Version */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight leading-snug">
                  {file.title}
                </h1>
                {file.version && (
                  <span className="px-2.5 py-1 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#D4AF37] font-mono text-xs font-semibold whitespace-nowrap">
                    {file.version}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-zinc-300 text-sm font-light leading-relaxed mb-6">
                {file.description ||
                  'Enterprise-grade digital asset verified for structural integrity, sanitized against harmful binaries, and stored on immutable persistent volumes.'}
              </p>

              {/* Tags */}
              {(file.tags || []).length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-8">
                  {(file.tags || []).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-zinc-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Technical Specifications Grid */}
              <div className="bg-black/50 border border-white/5 rounded-2xl p-4 space-y-3 mb-8">
                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <HardDrive className="w-3.5 h-3.5 text-[#D4AF37]" /> File Size
                  </span>
                  <span className="text-white font-mono font-medium">{formatBytes(file.fileSize)}</span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-[#D4AF37]" /> Format &amp; MIME
                  </span>
                  <span className="text-white font-mono font-medium truncate max-w-[180px]">
                    {ext.toUpperCase()} ({file.mimeType})
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pb-2 border-b border-white/5">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#D4AF37]" /> Ingestion Date
                  </span>
                  <span className="text-white font-mono font-medium">{formatDate(file.createdAt)}</span>
                </div>

                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-[#D4AF37]" /> Total Transmissions
                  </span>
                  <span className="text-emerald-400 font-mono font-medium">
                    {formatDownloadCount(file.downloadCount)} verified downloads
                  </span>
                </div>
              </div>
            </div>

            {/* Download Execution Button */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <button
                id="file-details-download-btn"
                onClick={handleDownload}
                disabled={downloading}
                className={`w-full py-4 px-6 rounded-2xl font-bold text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all duration-300 shadow-xl active:scale-[0.98] ${
                  downloadSuccess
                    ? 'bg-emerald-500 text-black shadow-[0_0_25px_rgba(16,185,129,0.4)]'
                    : 'bg-[#D4AF37] hover:bg-[#E5C158] text-black shadow-[0_0_25px_rgba(212,175,55,0.35)]'
                }`}
              >
                {downloading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Transmitting Payload...</span>
                  </>
                ) : downloadSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Download Initiated Successfully</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download Resource Now</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-500 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                <span>Verified Clean • Direct High-Speed Edge Delivery</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Related Resources in Same Sector */}
      {(file.related || []).length > 0 && (
        <section className="mt-16 pt-10 border-t border-white/5">
          <div className="flex items-center justify-between mb-8">
            <div>
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">
                Contextual Assets
              </span>
              <h3 className="text-2xl font-light text-white tracking-tight mt-1">
                Related {file.categoryName} Resources
              </h3>
            </div>
            <button
              onClick={() => onOpenCategory(file.categorySlug || '')}
              className="text-xs font-semibold text-[#D4AF37] hover:underline"
            >
              Browse Sector &rarr;
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {(file.related || []).map((rel) => (
              <FileCard
                key={rel.id}
                file={rel}
                onOpenDetails={(s) => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                  onNavigate(`/file/${s}`);
                }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
