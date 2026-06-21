import React, { useState, useEffect, useMemo } from 'react';
import * as LucideIcons from 'lucide-react';
import { Plus, Edit, Trash2, ToggleLeft, ToggleRight, RefreshCw, AlertTriangle, Search } from 'lucide-react';

const ALL_ICONS = Object.keys(LucideIcons).filter(key => /^[A-Z]/.test(key) && key !== 'LucideProps' && key !== 'Icon');
import { useI18n } from '../context/I18nContext';
import { getCategories, getDashboardStats, createCategory, updateCategory, deleteCategory } from '../services/api';

const BillCategories = () => {
  const { t } = useI18n();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: '', icon: 'Zap', color: 'bg-indigo-100 text-indigo-700' });
  const [saving, setSaving] = useState(false);
  const [iconSearch, setIconSearch] = useState('');

  const fetchCategories = async () => {
    setLoading(true); setError('');
    try {
      const [catRes, statsRes] = await Promise.all([
        getCategories(),
        getDashboardStats()
      ]);
      
      const catStats = statsRes.data.categoryStats || [];
      const grouped = {};
      catStats.forEach(c => grouped[c._id] = c.count);

      const fetchedCats = catRes.data.categories.map(cat => ({
        ...cat,
        count: grouped[cat.key] || 0
      }));
      setCategories(fetchedCats);
    } catch (e) {
      setError('Failed to load categories');
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchCategories(); }, []);

  const toggleActive = async (cat) => {
    try {
      await updateCategory(cat._id, { active: !cat.active });
      setCategories(cats => cats.map(c => c._id === cat._id ? { ...c, active: !c.active } : c));
    } catch (e) {
      alert('Failed to update status');
    }
  };

  const handleSave = async () => {
    if (!form.name) return;
    if (!/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      alert('Category Name must contain only letters and spaces');
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await updateCategory(editId, form);
      } else {
        await createCategory(form);
      }
      setShowModal(false);
      setForm({ name: '', icon: 'Zap', color: 'bg-indigo-100 text-indigo-700' });
      setIconSearch('');
      setEditId(null);
      fetchCategories();
    } catch (e) {
      alert(e.response?.data?.message || 'Error saving category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteCategory(id);
      fetchCategories();
    } catch (e) {
      alert('Failed to delete category');
    }
  };

  const openEdit = (cat) => {
    setForm({ name: cat.name, icon: cat.icon, color: cat.color });
    setIconSearch('');
    setEditId(cat._id);
    setShowModal(true);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('billCategories')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading...' : `${categories.filter(c => c.active).length} active of ${categories.length} categories`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchCategories} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/></button>
          <button className="btn-primary" onClick={() => { setEditId(null); setForm({ name: '', icon: 'Zap', color: 'bg-indigo-100 text-indigo-700' }); setIconSearch(''); setShowModal(true); }}><Plus size={15}/>Add Category</button>
        </div>
      </div>

      {error && <div className="card text-red-600 bg-red-50 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {loading ? [...Array(8)].map((_, i) => <div key={i} className="card h-40 bg-slate-100 animate-pulse"/>) : 
         categories.length === 0 ? <p className="text-slate-500">No categories found in database.</p> :
         categories.map(cat => (
          <div key={cat._id} className={`card transition-all hover:shadow-md ${!cat.active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between mb-3">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${cat.color || 'bg-slate-100 text-slate-700'}`}>
                {LucideIcons[cat.icon] ? React.createElement(LucideIcons[cat.icon], { size: 24 }) : cat.icon}
              </div>
              <button onClick={() => toggleActive(cat)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                {cat.active ? <ToggleRight size={24} className="text-indigo-600"/> : <ToggleLeft size={24}/>}
              </button>
            </div>
            <h3 className="font-semibold text-slate-900 dark:text-white capitalize">{cat.name}</h3>
            <p className="text-sm text-slate-400 mt-0.5">{cat.count} bills</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`badge text-xs ${cat.active ? 'badge-success' : 'badge-warning'}`}>
                {cat.active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button onClick={() => openEdit(cat)} className="btn-ghost flex-1 text-xs justify-center py-1.5"><Edit size={12}/>Edit</button>
              <button onClick={() => handleDelete(cat._id)} className="btn-ghost flex-1 text-xs justify-center py-1.5 text-red-400"><Trash2 size={12}/>Delete</button>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-sm mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editId ? 'Edit Category' : 'Add Category'}</h2>
            <div className="space-y-3">
              <div><label className="label">Category Name</label><input className="input" placeholder="e.g. Water Bill" value={form.name} onChange={e => setForm({...form, name: e.target.value})}/></div>
              <div>
                <label className="label">Icon</label>
                <div className="relative mb-2">
                  <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-8 py-1.5 text-sm" placeholder="Search icons..." value={iconSearch} onChange={e => setIconSearch(e.target.value)} />
                </div>
                <div className="flex gap-2 flex-wrap max-h-32 overflow-y-auto p-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-800">
                  {ALL_ICONS.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase())).slice(0, 100).map(iconName => {
                    const IconCmp = LucideIcons[iconName];
                    if (!IconCmp) return null;
                    return (
                      <button key={iconName} type="button" onClick={() => setForm({...form, icon: iconName})} className={`p-2 rounded-lg transition-colors ${form.icon === iconName ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'}`} title={iconName}>
                        <IconCmp size={20} />
                      </button>
                    )
                  })}
                  {ALL_ICONS.filter(i => i.toLowerCase().includes(iconSearch.toLowerCase())).length === 0 && <span className="text-xs text-slate-400">No icons found</span>}
                </div>
              </div>
              <div><label className="label">Color Tailwind Classes</label><input className="input" placeholder="bg-blue-100 text-blue-700" value={form.color} onChange={e => setForm({...form, color: e.target.value})}/></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : t('save')}</button>
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillCategories;
