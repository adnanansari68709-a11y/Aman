import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Trash2,
  Edit,
  RefreshCw,
  ExternalLink,
  Plus,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Sparkles,
  ArrowLeft,
  X
} from 'lucide-react';
import { Category, FileResource } from '../../types';
import { api } from '../../services/api';
import { formatBytes, formatDate, formatDownloadCount, getFileExtension } from '../../utils/formatters';

interface AdminFilesProps {
  onNavigate: (route: string) => void;
}

export const AdminFiles: React.FC<AdminFilesProps> = ({ onNavigate }) => {
  const [files, setFiles] = useState<FileResource[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Edit State
  const [editingFile, setEditingFile] = useState<FileResource | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCategoryId, setEditCategoryId] = useState('');
  const [editTags, setEditTags] = useState('');
  const [editVersion, setEditVersion] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editFeatured, setEditFeatured] = useState(false);
  const [editPublished, setEditPublished] = useState(true);
  const [savingEdit, setSavingEdit] = useState(false);

  // Replace Binary State
  const [replacingFile, setReplacingFile] = useState<FileResource | null>(null);
  const [replacementBinary, setReplacementBinary] = useState<File | null>(null);
  const [replacing, setReplacing] = useState(false);

  // Delete State
  const [deletingFile, setDeletingFile] = useState<FileResource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [filesRes, catsRes] = await Promise.all([
        api.getAdminFiles({ limit: 100, category: selectedCategory || undefined, search: search.trim() || undefined }),
        api.getAdminCategories()
      ]);
      setFiles(filesRes.files);
      setCategories(catsRes);
    } catch (err) {
      console.error('Failed to load files:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategory, search]);

  const handleOpenEdit = (file: FileResource) => {
    setEditingFile(file);
    setEditTitle(file.title);
    setEditDescription(file.description);
    setEditCategoryId(file.categoryId);
    setEditTags(file.tags ? file.tags.join(', ') : '');
    setEditVersion(file.version || '');
    setEditThumbnailUrl(file.thumbnailUrl || '');
    setEditFeatured(file.featured);
    setEditPublished(file.published);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFile) return;

    setSavingEdit(true);
    try {
      const updated = await api.updateFile(editingFile.id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        categoryId: editCategoryId,
        tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        version: editVersion.trim(),
        thumbnailUrl: editThumbnailUrl.trim() || '',
        featured: editFeatured,
        published: editPublished
      });

      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setEditingFile(null);
      showNotification('Metadata modifications committed successfully.');
    } catch (err: any) {
      alert(err.message || 'Update failed.');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleExecuteReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replacingFile || !replacementBinary) return;

    setReplacing(true);
    try {
      const updated = await api.replaceFileBinary(replacingFile.id, replacementBinary);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      setReplacingFile(null);
      setReplacementBinary(null);
      showNotification(`Binary payload for "${updated.title}" replaced.`);
    } catch (err: any) {
      alert(err.message || 'Replacement failed.');
    } finally {
      setReplacing(false);
    }
  };

  const handleExecuteDelete = async () => {
    if (!deletingFile) return;

    setDeleting(true);
    try {
      await api.deleteFile(deletingFile.id);
      setFiles((prev) => prev.filter((f) => f.id !== deletingFile.id));
      showNotification(`Asset "${deletingFile.title}" purged from storage.`);
      setDeletingFile(null);
    } catch (err: any) {
      alert(err.message || 'Deletion failed.');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFeatured = async (file: FileResource) => {
    try {
      const updated = await api.toggleFeatured(file.id);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showNotification(`Featured state updated for "${file.title}".`);
    } catch (err: any) {
      alert(err.message || 'Toggle failed');
    }
  };

  const handleTogglePublished = async (file: FileResource) => {
    try {
      const updated = await api.togglePublished(file.id);
      setFiles((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      showNotification(`Visibility status set to ${updated.published ? 'Published' : 'Draft'} for "${file.title}".`);
    } catch (err: any) {
      alert(err.message || 'Toggle failed');
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b0b0e] border border-[#D4AF37] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-[#D4AF37]" />
          <span className="text-xs font-medium">{notification}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-white/5">
        <div>
          <button
            onClick={() => onNavigate('/admin')}
            className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 mb-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Operations
          </button>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            Asset Registry &amp; Inventory
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Edit metadata, hot-swap payloads, toggle public visibility, or purge items.
          </p>
        </div>

        <button
          onClick={() => onNavigate('/admin/upload')}
          className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Ingest New File</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-[#D4AF37] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter files by keyword..."
            className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-10 pr-3 text-xs text-white focus:outline-none focus:border-[#D4AF37]/50"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-black/60 border border-white/10 text-white rounded-xl text-xs py-2 px-3 focus:outline-none focus:border-[#D4AF37]/50 cursor-pointer"
          >
            <option value="">All Sectors</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <span className="text-xs text-zinc-400 font-mono">
            {files.length} Assets Registered
          </span>
        </div>
      </div>

      {/* Files Table */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
          <span className="text-sm font-light">Loading file ledger...</span>
        </div>
      ) : files.length === 0 ? (
        <div className="py-16 text-center bg-white/5 border border-white/10 rounded-3xl p-8">
          <p className="text-zinc-400 text-sm mb-4">No resources found matching filter criteria.</p>
          <button
            onClick={() => {
              setSearch('');
              setSelectedCategory('');
            }}
            className="text-xs text-[#D4AF37] hover:underline"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-300">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-zinc-400 font-semibold border-b border-white/10">
                <tr>
                  <th className="py-4 px-6">Resource Asset</th>
                  <th className="py-4 px-4">Sector</th>
                  <th className="py-4 px-4">Size / Format</th>
                  <th className="py-4 px-4 text-center">Transfers</th>
                  <th className="py-4 px-4 text-center">Featured</th>
                  <th className="py-4 px-4 text-center">Published</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {files.map((file) => {
                  const ext = getFileExtension(file.fileName);
                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-white/[0.02] transition-colors group"
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center font-mono font-bold text-[#D4AF37] text-[11px] shrink-0">
                            {ext}
                          </div>
                          <div>
                            <div className="text-white font-medium line-clamp-1 max-w-xs sm:max-w-sm">
                              {file.title}
                            </div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              {file.fileName}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap">
                        <span className="text-zinc-300">{file.categoryName}</span>
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap font-mono text-zinc-400">
                        {formatBytes(file.fileSize)}
                      </td>

                      <td className="py-4 px-4 whitespace-nowrap text-center font-mono text-emerald-400 font-medium">
                        {formatDownloadCount(file.downloadCount)}
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleToggleFeatured(file)}
                          className={`w-7 h-7 rounded-lg border transition-all inline-flex items-center justify-center ${
                            file.featured
                              ? 'bg-[#D4AF37]/20 border-[#D4AF37] text-[#D4AF37]'
                              : 'bg-white/5 border-white/10 text-zinc-600 hover:text-zinc-400'
                          }`}
                          title="Toggle featured showcase"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <button
                          onClick={() => handleTogglePublished(file)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider transition-all ${
                            file.published
                              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                              : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {file.published ? 'Live' : 'Draft'}
                        </button>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Public View */}
                          <button
                            onClick={() => onNavigate(`/file/${file.slug}`)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                            title="Inspect public page"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Edit Metadata */}
                          <button
                            onClick={() => handleOpenEdit(file)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10"
                            title="Edit metadata"
                          >
                            <Edit className="w-4 h-4" />
                          </button>

                          {/* Replace Binary */}
                          <button
                            onClick={() => {
                              setReplacingFile(file);
                              setReplacementBinary(null);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-sky-400 hover:bg-sky-400/10"
                            title="Hot-swap binary payload"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => setDeletingFile(file)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-400/10"
                            title="Purge asset from vault"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT METADATA MODAL */}
      {editingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-2xl bg-[#0b0b0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-6">
              <h3 className="text-lg font-medium text-white">Edit Resource Metadata</h3>
              <button
                onClick={() => setEditingFile(null)}
                className="text-zinc-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Sector / Category
                </label>
                <select
                  value={editCategoryId}
                  onChange={(e) => setEditCategoryId(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Tags (comma separated)
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>

                <div>
                  <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                    Version
                  </label>
                  <input
                    type="text"
                    value={editVersion}
                    onChange={(e) => setEditVersion(e.target.value)}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                  />
                </div>
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Custom Thumbnail URL
                </label>
                <input
                  type="url"
                  value={editThumbnailUrl}
                  onChange={(e) => setEditThumbnailUrl(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="flex gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editFeatured}
                    onChange={(e) => setEditFeatured(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF37] rounded"
                  />
                  <span>Featured Status</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-zinc-300">
                  <input
                    type="checkbox"
                    checked={editPublished}
                    onChange={(e) => setEditPublished(e.target.checked)}
                    className="w-4 h-4 text-[#D4AF37] rounded"
                  />
                  <span>Published for Downloads</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingFile(null)}
                  className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-6 py-2.5 bg-[#D4AF37] text-black font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] flex items-center gap-2"
                >
                  {savingEdit ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  <span>Save Modifications</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REPLACE FILE BINARY MODAL */}
      {replacingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0b0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-medium text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-sky-400" /> Hot-Swap Binary Payload
              </h3>
              <button
                onClick={() => setReplacingFile(null)}
                className="text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-zinc-400 text-xs mb-4">
              Replacing binary file for <span className="text-white font-medium">&quot;{replacingFile.title}&quot;</span>. Download counts and slug links remain preserved.
            </p>

            <form onSubmit={handleExecuteReplace} className="space-y-4">
              <input
                type="file"
                required
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    setReplacementBinary(e.target.files[0]);
                  }
                }}
                className="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[#D4AF37] file:text-black hover:file:bg-[#E5C158]"
              />

              {replacementBinary && (
                <div className="p-3 bg-black/50 border border-white/5 rounded-xl text-xs font-mono text-zinc-300">
                  New file: {replacementBinary.name} ({formatBytes(replacementBinary.size)})
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setReplacingFile(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!replacementBinary || replacing}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-black text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2"
                >
                  {replacing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Execute Swap</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0b0e] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-lg font-medium text-white text-center mb-2">
              Confirm Resource Deletion
            </h3>
            <p className="text-zinc-400 text-xs text-center leading-relaxed mb-6">
              Are you sure you want to delete <span className="text-white font-medium">&quot;{deletingFile.title}&quot;</span>? This will permanently delete the binary file from disk and purge its metadata.
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingFile(null)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
