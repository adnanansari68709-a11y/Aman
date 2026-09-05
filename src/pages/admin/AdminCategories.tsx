import React, { useState, useEffect } from 'react';
import {
  FolderTree,
  Plus,
  Edit,
  Trash2,
  Folder,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  X
} from 'lucide-react';
import { Category } from '../../types';
import { api } from '../../services/api';

interface AdminCategoriesProps {
  onNavigate: (route: string) => void;
}

export const AdminCategories: React.FC<AdminCategoriesProps> = ({ onNavigate }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  // Create modal state
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newIcon, setNewIcon] = useState('Folder');
  const [newColor, setNewColor] = useState('#D4AF37');
  const [creating, setCreating] = useState(false);

  // Edit modal state
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editColor, setEditColor] = useState('#D4AF37');
  const [savingEdit, setSavingEdit] = useState(false);

  // Delete modal state
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [notification, setNotification] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  const loadCategories = async () => {
    setLoading(true);
    try {
      const cats = await api.getAdminCategories();
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setCreating(true);
    setError(null);
    try {
      const created = await api.createCategory({
        name: newName.trim(),
        description: newDesc.trim(),
        icon: newIcon,
        color: newColor
      });
      setCategories((prev) => [...prev, created]);
      setIsCreating(false);
      setNewName('');
      setNewDesc('');
      showNotification(`Category "${created.name}" established.`);
    } catch (err: any) {
      setError(err.message || 'Creation failed');
    } finally {
      setCreating(false);
    }
  };

  const handleOpenEdit = (cat: Category) => {
    setEditingCat(cat);
    setEditName(cat.name);
    setEditDesc(cat.description || '');
    setEditColor(cat.color || '#D4AF37');
    setError(null);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCat || !editName.trim()) return;

    setSavingEdit(true);
    setError(null);
    try {
      const updated = await api.updateCategory(editingCat.id, {
        name: editName.trim(),
        description: editDesc.trim(),
        color: editColor
      });
      setCategories((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      setEditingCat(null);
      showNotification(`Category "${updated.name}" updated.`);
    } catch (err: any) {
      setError(err.message || 'Update failed');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingCat) return;

    setDeleting(true);
    setError(null);
    try {
      await api.deleteCategory(deletingCat.id);
      setCategories((prev) => prev.filter((c) => c.id !== deletingCat.id));
      showNotification(`Category "${deletingCat.name}" removed.`);
      setDeletingCat(null);
    } catch (err: any) {
      setError(err.message || 'Deletion failed.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Toast */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#0b0b0e] border border-[#D4AF37] text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3">
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
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Dashboard
          </button>
          <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight">
            Taxonomy &amp; Sector Management
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Define classification boundaries for curated public discovery.
          </p>
        </div>

        <button
          onClick={() => {
            setIsCreating(true);
            setError(null);
          }}
          className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-2 self-start sm:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>New Sector</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Categories Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-zinc-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
          <span className="text-sm font-light">Loading sectors...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="bg-white/5 border border-white/10 p-6 rounded-3xl flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center text-[#D4AF37]">
                    <Folder className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/5">
                    {cat.fileCount || 0} Assets
                  </span>
                </div>

                <h3 className="text-white font-medium text-lg mb-1">{cat.name}</h3>
                <div className="text-[10px] text-zinc-500 font-mono mb-3">/category/{cat.slug}</div>
                <p className="text-zinc-400 text-xs font-light leading-relaxed mb-6">
                  {cat.description || 'No description provided.'}
                </p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <button
                  onClick={() => onNavigate(`/library?category=${cat.slug}`)}
                  className="text-xs text-[#D4AF37] hover:underline font-semibold"
                >
                  View Files &rarr;
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
                    title="Edit sector"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeletingCat(cat)}
                    className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                    title="Delete sector"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0b0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-medium text-white">Create New Sector</h3>
              <button onClick={() => setIsCreating(false)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Sector Name *
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Architectural Blueprints"
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Defines what types of assets qualify for this sector..."
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] flex items-center gap-2"
                >
                  {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Create Sector</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0b0e] border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-base font-medium text-white">Edit Sector Details</h3>
              <button onClick={() => setEditingCat(null)} className="text-zinc-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Sector Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div>
                <label className="block uppercase tracking-wider text-zinc-400 font-semibold mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-xl py-2.5 px-3 text-white text-sm focus:outline-none focus:border-[#D4AF37]/50"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditingCat(null)}
                  className="px-4 py-2 rounded-xl border border-white/10 text-zinc-400 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-5 py-2 bg-[#D4AF37] text-black text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-[#E5C158] flex items-center gap-2"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deletingCat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0b0b0e] border border-red-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-medium text-white text-center mb-2">Delete Sector</h3>
            <p className="text-zinc-400 text-xs text-center leading-relaxed mb-6">
              Are you sure you want to delete <span className="text-white font-medium">&quot;{deletingCat.name}&quot;</span>? Sectors containing files cannot be deleted until the files are reassigned or removed.
            </p>

            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeletingCat(null)}
                className="px-5 py-2.5 rounded-xl border border-white/10 text-zinc-400 text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2"
              >
                {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Delete Sector</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
