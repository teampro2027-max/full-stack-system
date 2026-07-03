import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertTriangle, Upload, X, Image as ImageIcon } from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { API_BASE_URL, getCategories, getDashboardStats, createCategory, updateCategory, deleteCategory } from '../services/api';
import CustomDialog from '../components/CustomDialog';

const BACKEND_URL = API_BASE_URL.replace(/\/api\/?$/, '');

const COLOR_PALETTE = [
  { label: 'Indigo',  value: 'bg-indigo-100 text-indigo-700' },
  { label: 'Blue',    value: 'bg-blue-100 text-blue-700' },
  { label: 'Amber',   value: 'bg-amber-100 text-amber-700' },
  { label: 'Green',   value: 'bg-green-100 text-green-700' },
  { label: 'Red',     value: 'bg-red-100 text-red-700' },
  { label: 'Pink',    value: 'bg-pink-100 text-pink-700' },
  { label: 'Purple',  value: 'bg-purple-100 text-purple-700' },
  { label: 'Teal',    value: 'bg-teal-100 text-teal-700' },
  { label: 'Orange',  value: 'bg-orange-100 text-orange-700' },
  { label: 'Lime',    value: 'bg-lime-100 text-lime-700' },
  { label: 'Cyan',    value: 'bg-cyan-100 text-cyan-700' },
  { label: 'Gray',    value: 'bg-slate-100 text-slate-700' },
];

const DEFAULT_FORM = { name: '', color: 'bg-indigo-100 text-indigo-700' };

const BillCategories = () => {
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [currentParent, setCurrentParent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);
  const [dialogConfig, setDialogConfig] = useState(null);

  // Image upload state
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [existingImage, setExistingImage] = useState(null);
  const fileInputRef = useRef(null);

  const fetchCategories = async () => {
    setLoading(true);
    setError('');
    try {
      const [catRes, statsRes] = await Promise.all([getCategories(), getDashboardStats()]);
      const catStats = statsRes.data.categoryStats || [];
      const grouped = {};
      catStats.forEach((c) => (grouped[c._id] = c.count));
      setCategories(
        catRes.data.categories.map((cat) => ({ ...cat, count: grouped[cat.key] || 0 }))
      );
    } catch {
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleActive = async (cat) => {
    try {
      await updateCategory(cat._id, { active: !cat.active });
      setCategories((cats) =>
        cats.map((c) => (c._id === cat._id ? { ...c, active: !c.active } : c))
      );
      setDialogConfig({ message: 'Category status updated successfully', type: 'success' });
    } catch {
      setDialogConfig({ message: 'Failed to update status', type: 'error' });
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setDialogConfig({ message: 'Only JPEG and PNG images are allowed', type: 'error' });
      return;
    }
    // Validate size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setDialogConfig({ message: 'Image size must be less than 5MB', type: 'error' });
      return;
    }

    setImageFile(file);
    setExistingImage(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSave = async () => {
    if (!form.name.trim()) return;
    if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      setDialogConfig({ message: 'Category Name must contain only letters and spaces', type: 'error' });
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form };
      if (currentParent && !editId) {
        payload.parentId = currentParent._id;
      }
      // Attach image file if selected
      if (imageFile) {
        payload.image = imageFile;
      }
      if (editId) {
        await updateCategory(editId, payload);
        setDialogConfig({ message: 'Category updated successfully', type: 'success' });
      } else {
        await createCategory(payload);
        setDialogConfig({ message: 'Category created successfully', type: 'success' });
      }
      setShowModal(false);
      setForm(DEFAULT_FORM);
      setImageFile(null);
      setImagePreview(null);
      setExistingImage(null);
      setEditId(null);
      fetchCategories();
    } catch (e) {
      setDialogConfig({ message: e.response?.data?.message || 'Error saving category', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
  };

  const executeDelete = async (id) => {
    try {
      await deleteCategory(id);
      fetchCategories();
      setDialogConfig({ message: 'Category deleted successfully', type: 'success' });
    } catch {
      setDialogConfig({ message: 'Failed to delete category', type: 'error' });
    }
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, color: cat.color });
    setEditId(cat._id);
    setImageFile(null);
    setImagePreview(null);
    // Show existing image in preview if it has one
    if (cat.image) {
      setExistingImage(`${BACKEND_URL}${cat.image}`);
    } else {
      setExistingImage(null);
    }
    setShowModal(true);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(DEFAULT_FORM);
    setImageFile(null);
    setImagePreview(null);
    setExistingImage(null);
    setShowModal(true);
  };

  const displayedCategories = categories.filter((c) => {
    if (!currentParent) {
      return !c.parentId;
    } else {
      return c.parentId === currentParent._id;
    }
  });

  // Render category image or fallback icon
  const renderCategoryImage = (cat, size = 'card') => {
    const sizeClasses = size === 'card' ? 'w-12 h-12 rounded-2xl' : 'w-8 h-8 rounded-xl';
    if (cat.image) {
      return (
        <div className={`${sizeClasses} overflow-hidden flex-shrink-0`}>
          <img
            src={`${BACKEND_URL}${cat.image}`}
            alt={cat.name}
            className="w-full h-full object-cover rounded-[inherit]"
            onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
          />
          <div className={`${sizeClasses} items-center justify-center text-2xl ${cat.color || 'bg-slate-100 text-slate-700'}`} style={{ display: 'none' }}>
            📋
          </div>
        </div>
      );
    }
    return (
      <div className={`${sizeClasses} flex items-center justify-center text-2xl ${cat.color || 'bg-slate-100 text-slate-700'}`}>
        {LucideIcons[cat.icon]
          ? React.createElement(LucideIcons[cat.icon], { size: size === 'card' ? 24 : 16 })
          : cat.icon || '📋'}
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center flex-wrap gap-1.5">
            {currentParent ? (
              <>
                <span className="text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => setCurrentParent(null)}>
                  {t('billCategories')}
                </span>
                <LucideIcons.ChevronRight size={18} className="text-slate-400" />
                <span className="capitalize text-indigo-600 dark:text-indigo-400">{currentParent.name}</span>
              </>
            ) : (
              t('billCategories')
            )}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading
              ? 'Loading...'
              : currentParent
              ? `${displayedCategories.length} subcategories inside ${currentParent.name}`
              : `${categories.filter((c) => c.active && !c.parentId).length} active of ${categories.filter((c) => !c.parentId).length} main categories`}
          </p>
        </div>
        <div className="flex gap-2">
          {currentParent && (
            <button onClick={() => setCurrentParent(null)} className="btn-secondary flex items-center gap-1.5 py-2 px-3 text-sm">
              <LucideIcons.ArrowLeft size={14} /> Back
            </button>
          )}
          <button onClick={fetchCategories} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button className="btn-primary" onClick={openAdd}>
            <Plus size={15} /> {currentParent ? 'Add Subcategory' : 'Add Category'}
          </button>
        </div>
      </div>

      {error && (
        <div className="card text-red-600 bg-red-50 text-sm flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      {/* Category Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading
          ? [...Array(8)].map((_, i) => (
              <div key={i} className="card h-40 bg-slate-100 animate-pulse" />
            ))
          : displayedCategories.length === 0
          ? (
            <div className="col-span-full card p-8 text-center bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800">
              <LucideIcons.FolderMinus size={40} className="mx-auto text-slate-400 mb-2" />
              <p className="text-slate-500 text-sm">{currentParent ? 'Qaybtaan kuma jiraan wax subcategories ah.' : 'No categories found in database.'}</p>
            </div>
          )
          : displayedCategories.map((cat) => (
              <div
                key={cat._id}
                className={`card transition-all hover:shadow-md ${!cat.active ? 'opacity-60' : ''}`}
              >
                <div className="flex items-start justify-between mb-3">
                  {renderCategoryImage(cat)}
                  <button
                    onClick={() => toggleActive(cat)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                  >
                    {cat.active ? (
                      <ToggleRight size={24} className="text-indigo-600" />
                    ) : (
                      <ToggleLeft size={24} />
                    )}
                  </button>
                </div>
                <h3 className="font-semibold text-slate-900 dark:text-white capitalize">{cat.name}</h3>
                <p className="text-sm text-slate-400 mt-0.5">{cat.count} bills</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className={`badge text-xs ${cat.active ? 'badge-success' : 'badge-warning'}`}>
                    {cat.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                  {!currentParent && (
                    <button
                      onClick={() => setCurrentParent(cat)}
                      className="btn-ghost flex-1 text-xs justify-center py-1.5 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/20"
                    >
                      <LucideIcons.FolderOpen size={12} className="mr-1" /> Enter
                    </button>
                  )}
                  <button
                    onClick={() => openEdit(cat)}
                    className="btn-ghost flex-1 text-xs justify-center py-1.5"
                  >
                    <Edit size={12} /> Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(cat._id)}
                    className="btn-ghost flex-1 text-xs justify-center py-1.5 text-red-400"
                  >
                    <Trash2 size={12} /> Delete
                  </button>
                </div>
              </div>
            ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setShowModal(false)}
        >
          <div
            className="card w-full max-w-md mx-4 animate-fade-in max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Category' : 'Add Category'}</h2>
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="label">Category Name</label>
                <input
                  className="input"
                  placeholder="e.g. Water Bill"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </div>

              {/* Image Upload */}
              <div>
                <label className="label flex items-center gap-2">
                  <ImageIcon size={14} /> Category Image
                </label>

                {/* Preview Area */}
                {(imagePreview || existingImage) ? (
                  <div className="relative group w-full">
                    <div className="w-full h-44 rounded-xl overflow-hidden border-2 border-dashed border-indigo-200 dark:border-indigo-800 bg-slate-50 dark:bg-slate-800">
                      <img
                        src={imagePreview || existingImage}
                        alt="Category preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="absolute inset-0 bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/90 text-slate-800 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-white transition-colors"
                      >
                        <Upload size={13} /> Change
                      </button>
                      <button
                        type="button"
                        onClick={removeImage}
                        className="bg-red-500/90 text-white px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 hover:bg-red-500 transition-colors"
                      >
                        <X size={13} /> Remove
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-44 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all group"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload size={20} className="text-indigo-500" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Click to upload image</p>
                      <p className="text-xs text-slate-400 mt-0.5">JPG, PNG • Max 5MB</p>
                    </div>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  className="hidden"
                  onChange={handleImageSelect}
                />
              </div>

              {/* Color Palette */}
              <div>
                <label className="label">Color</label>
                <div className="grid grid-cols-6 gap-2">
                  {COLOR_PALETTE.map((c) => {
                    const isSelected = form.color === c.value;
                    return (
                      <button
                        key={c.value}
                        type="button"
                        title={c.label}
                        onClick={() => setForm({ ...form, color: c.value })}
                        className={`h-9 rounded-xl flex items-center justify-center text-xs font-bold transition-all ${c.value} ${
                          isSelected
                            ? 'ring-2 ring-offset-1 ring-indigo-500 scale-110'
                            : 'hover:scale-105 opacity-75 hover:opacity-100'
                        }`}
                      >
                        {c.label.slice(0, 2)}
                      </button>
                    );
                  })}
                </div>
                <p className="text-xs text-slate-400 mt-1.5">
                  Selected: <code className="text-indigo-600">{form.color}</code>
                </p>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleSave}>
                {saving ? 'Saving...' : t('save')}
              </button>
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Dialogs */}
      <CustomDialog 
        isOpen={!!dialogConfig}
        type={dialogConfig?.type}
        title={dialogConfig?.type === 'error' ? 'Error' : 'Success'}
        message={dialogConfig?.message}
        onCancel={() => setDialogConfig(null)}
      />

      <CustomDialog
        isOpen={!!confirmDeleteId}
        type="delete"
        title="Confirm Delete"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Yes, Delete"
        onConfirm={() => {
          executeDelete(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />
    </div>
  );
};

export default BillCategories;
