import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  File,
  Image,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Sparkles,
  X
} from 'lucide-react';
import { Category, FileResource } from '../../types';
import { api } from '../../services/api';
import { formatBytes } from '../../utils/formatters';

interface AdminUploadProps {
  onNavigate: (route: string) => void;
  onUploaded?: (file: FileResource) => void;
}

export const AdminUpload: React.FC<AdminUploadProps> = ({ onNavigate, onUploaded }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [primaryFile, setPrimaryFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [customThumbnailUrl, setCustomThumbnailUrl] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [tags, setTags] = useState('');
  const [version, setVersion] = useState('1.0.0');
  const [featured, setFeatured] = useState(false);
  const [published, setPublished] = useState(true);

  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdResource, setCreatedResource] = useState<FileResource | null>(null);

  const [maxFileSizeMB, setMaxFileSizeMB] = useState(100);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        const [cats, cfg] = await Promise.all([
          api.getCategories(),
          api.getConfig().catch(() => null)
        ]);
        setCategories(cats);
        if (cats.length > 0 && !categoryId) {
          setCategoryId(cats[0].id);
        }
        if (cfg?.maxFileSizeMB) {
          setMaxFileSizeMB(cfg.maxFileSizeMB);
        }
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  const DANGEROUS_EXTENSIONS = ['.exe', '.bat', '.cmd', '.scr', '.vbs', '.msi', '.pif', '.application', '.gadget', '.com', '.ps1', '.sh', '.bash'];
  const maxFileSizeBytes = maxFileSizeMB * 1024 * 1024;
  const MAX_THUMB_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

  const handleFileSelect = (f: File) => {
    const ext = '.' + f.name.split('.').pop()?.toLowerCase();
    
    if (DANGEROUS_EXTENSIONS.includes(ext)) {
      setError(`Security Violation: Executable and script binaries (${ext}) cannot be uploaded.`);
      setPrimaryFile(null);
      return;
    }

    if (f.size > maxFileSizeBytes) {
      setError(`File size (${formatBytes(f.size)}) exceeds the maximum allowed threshold of ${maxFileSizeMB}MB.`);
      setPrimaryFile(null);
      return;
    }

    setPrimaryFile(f);
    setError(null);

    // Auto populate title if blank
    if (!title.trim()) {
      const cleanName = f.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
    }

    // Smart category auto-selection based on file extension
    if (categories.length > 0) {
      const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg'];
      const docExts = ['.pdf', '.doc', '.docx', '.txt', '.csv', '.md', '.xls', '.xlsx', '.ppt', '.pptx'];
      const videoExts = ['.mp4', '.webm'];
      const audioExts = ['.mp3', '.wav'];
      const archiveExts = ['.zip', '.rar', '.7z'];
      const templateExts = ['.json'];

      let targetCategorySlug = '';
      if (imageExts.includes(ext)) targetCategorySlug = 'images';
      else if (docExts.includes(ext)) targetCategorySlug = 'documents';
      else if (videoExts.includes(ext)) targetCategorySlug = 'videos';
      else if (audioExts.includes(ext)) targetCategorySlug = 'audio';
      else if (archiveExts.includes(ext)) targetCategorySlug = 'archives';
      else if (templateExts.includes(ext)) targetCategorySlug = 'templates';

      if (targetCategorySlug) {
        const matchingCat = categories.find(c => c.slug === targetCategorySlug);
        if (matchingCat) {
          setCategoryId(matchingCat.id);
        }
      }
    }
  };

  const handleThumbnailSelect = (f: File) => {
    if (!f.type.startsWith('image/')) {
      setError('Thumbnail must be an image file (PNG, JPG, WebP, SVG).');
      setThumbnailFile(null);
      return;
    }
    if (f.size > MAX_THUMB_SIZE_BYTES) {
      setError(`Thumbnail size (${formatBytes(f.size)}) exceeds maximum limit of 5MB.`);
      setThumbnailFile(null);
      return;
    }
    setThumbnailFile(f);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryFile) {
      setError('Please select a primary binary file for ingestion.');
      return;
    }
    if (!title.trim()) {
      setError('Resource title is mandatory.');
      return;
    }
    if (!categoryId) {
      setError('Category assignment is mandatory.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', primaryFile);
      if (thumbnailFile) {
        formData.append('thumbnail', thumbnailFile);
      }
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('categoryId', categoryId);
      formData.append('tags', tags.trim());
      formData.append('version', version.trim());
      formData.append('featured', String(featured));
      formData.append('published', String(published));
      if (customThumbnailUrl.trim()) {
        formData.append('customThumbnailUrl', customThumbnailUrl.trim());
      }

      const created = await api.uploadFile(formData);
      setCreatedResource(created);
      if (onUploaded) onUploaded(created);
    } catch (err: any) {
      setError(err.message || 'File ingestion rejected by storage daemon.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setPrimaryFile(null);
    setThumbnailFile(null);
    setCustomThumbnailUrl('');
    setTitle('');
    setDescription('');
    setTags('');
    setVersion('1.0.0');
    setFeatured(false);
    setPublished(true);
    setCreatedResource(null);
    setError(null);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5">
        <div>
          <button
            onClick={() => onNavigate('/admin')}
            className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            Ingest Resource into Repository
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Multipart upload with automated format classification and storage hashing.
          </p>
        </div>
      </div>

      {createdResource ? (
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 sm:p-12 text-center max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-light text-white mb-2">Ingestion Complete</h2>
          <p className="text-zinc-400 text-xs font-light mb-6">
            &quot;{createdResource.title}&quot; has been verified, stored on disk, and registered in the database.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('/')}
              className="w-full sm:w-auto px-6 py-3 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] transition-all shadow-lg"
            >
              View on Home Page
            </button>
            <button
              onClick={() => onNavigate(`/file/${createdResource.slug}`)}
              className="w-full sm:w-auto px-6 py-3 bg-white/10 text-white text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-white/20 transition-all"
            >
              View Details Page
            </button>
            <button
              onClick={resetForm}
              className="w-full sm:w-auto px-6 py-3 bg-white/5 border border-white/10 text-zinc-300 text-xs font-semibold uppercase tracking-wider rounded-xl hover:bg-white/10 transition-all"
            >
              Upload Another
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-400 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Primary File Drag-and-Drop Area */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8">
            <label className="block text-xs uppercase tracking-wider text-white font-semibold mb-3">
              Primary Binary Asset *
            </label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-[#D4AF37] bg-[#D4AF37]/5'
                  : primaryFile
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-white/15 hover:border-[#D4AF37]/50 hover:bg-white/[0.02]'
              }`}
            >
              {primaryFile ? (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
                    <File className="w-7 h-7" />
                  </div>
                  <div className="text-white font-medium text-base mb-1">{primaryFile.name}</div>
                  <div className="text-xs text-zinc-400 font-mono">
                    {formatBytes(primaryFile.size)} • {primaryFile.type || 'Custom Binary'}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimaryFile(null);
                    }}
                    className="mt-4 text-xs text-red-400 hover:underline flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" /> Remove &amp; replace
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center">
                  <div className="w-14 h-14 rounded-2xl bg-black/60 border border-white/10 flex items-center justify-center text-[#D4AF37] mb-3">
                    <UploadCloud className="w-7 h-7" />
                  </div>
                  <div className="text-white font-medium text-base mb-1">
                    Drag and drop file here, or click to browse
                  </div>
                  <p className="text-zinc-500 text-xs max-w-sm">
                    Supports PDF, DOCX, ZIP, MP4, MP3, SVG, CSV, JSON, PNG, WEBP and more up to {maxFileSizeMB}MB.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata Fields Card */}
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 sm:p-8 space-y-6">
            <h3 className="text-sm uppercase tracking-wider text-white font-semibold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Resource Metadata
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Resource Title *
                </label>
                <input
                  id="admin-upload-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Enterprise Microservices Architecture Spec"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Category Sector *
                </label>
                <select
                  id="admin-upload-category"
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50 cursor-pointer"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                Description &amp; Specifications
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Comprehensive overview of the asset, contents, and licensing specifications..."
                className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Tags (Comma Separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Security, Cloud, Python, Blueprint"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Version Identifier
                </label>
                <input
                  type="text"
                  value={version}
                  onChange={(e) => setVersion(e.target.value)}
                  placeholder="e.g. v2.4.1"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            {/* Thumbnail Upload or URL */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-white/5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Upload Cover Thumbnail (Optional)
                </label>
                <input
                  ref={thumbInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleThumbnailSelect(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => thumbInputRef.current?.click()}
                  className="w-full py-2.5 px-4 bg-black/40 border border-white/10 hover:border-[#D4AF37]/40 rounded-xl text-xs text-zinc-300 flex items-center justify-center gap-2 transition-all"
                >
                  <Image className="w-4 h-4 text-[#D4AF37]" />
                  <span>{thumbnailFile ? thumbnailFile.name : 'Choose image file...'}</span>
                </button>
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                  Or External Thumbnail Image URL
                </label>
                <input
                  type="url"
                  value={customThumbnailUrl}
                  onChange={(e) => setCustomThumbnailUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-sm text-white focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>
            </div>

            {/* Toggles */}
            <div className="flex flex-wrap gap-8 pt-4 border-t border-white/5">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={featured}
                  onChange={(e) => setFeatured(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/60 border-white/20 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-xs text-zinc-300 font-medium">Highlight in Featured section</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={published}
                  onChange={(e) => setPublished(e.target.checked)}
                  className="w-4 h-4 rounded bg-black/60 border-white/20 text-[#D4AF37] focus:ring-[#D4AF37]"
                />
                <span className="text-xs text-zinc-300 font-medium">
                  Publish immediately for visitor downloads
                </span>
              </label>
            </div>
          </div>

          <button
            id="admin-submit-upload-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold uppercase tracking-widest rounded-2xl transition-all shadow-[0_0_25px_rgba(212,175,55,0.35)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Storing and Indexing Payload...</span>
              </>
            ) : (
              <span>Commit Asset to Repository</span>
            )}
          </button>
        </form>
      )}
    </div>
  );
};
