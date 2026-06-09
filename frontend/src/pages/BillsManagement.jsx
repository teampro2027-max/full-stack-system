import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, RefreshCw, AlertTriangle, Edit, Trash2, MoreVertical, Download } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getAdminBills, updateAdminBill, deleteAdminBill, createAdminBill, getCategories } from '../services/api';

const STATUS_COLORS = { paid: 'badge-success', unpaid: 'badge-warning', overdue: 'badge-danger' };

const BillsManagement = () => {
  const { t } = useI18n();
  const [bills, setBills] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [openMenu, setOpenMenu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editBill, setEditBill] = useState(null);
  const [saving, setSaving] = useState(false);
  const [dbCategories, setDbCategories] = useState([]);
  const [form, setForm] = useState({ userId: '', title: '', amount: '', category: '', status: 'unpaid', dueDate: '', isRecurring: false });

  const fetchBills = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const [billsRes, catRes] = await Promise.all([
        getAdminBills({ status: filterStatus !== 'all' ? filterStatus : undefined, search }),
        getCategories()
      ]);
      setBills(billsRes.data.bills || []);
      setTotal(billsRes.data.total || 0);
      const activeCats = (catRes.data.categories || []).filter(c => c.active);
      setDbCategories(activeCats);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [filterStatus, search]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const openEdit = (bill) => {
    setEditBill(bill);
    setForm({ userId: bill.userId?._id || '', title: bill.title || '', amount: bill.amount || '', category: bill.category, status: bill.status, dueDate: bill.dueDate?.split('T')[0] || '', isRecurring: bill.isRecurring || false });
    setShowModal(true); setOpenMenu(null);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editBill) await updateAdminBill(editBill._id, form);
      else await createAdminBill(form);
      setShowModal(false); fetchBills();
    } catch (e) { alert(e.response?.data?.message || 'Error saving bill'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this bill?')) return;
    try { await deleteAdminBill(id); fetchBills(); } catch { alert('Error deleting bill'); }
    setOpenMenu(null);
  };

  const handleMarkPaid = async (bill) => {
    try { await updateAdminBill(bill._id, { status: 'paid' }); fetchBills(); } catch { alert('Error'); }
    setOpenMenu(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('billsManagement')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? t('loading') : `${total} bills in total`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBills} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button className="btn-primary" onClick={() => { setEditBill(null); setShowModal(true); }}><Plus size={15} />Add Bill</button>
        </div>
      </div>

      {error && <div className="card border-red-200 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      {/* Summary badges */}
      {!loading && (
        <div className="flex gap-3 flex-wrap">
          {['all','paid','unpaid','overdue'].map(s => {
            const count = s === 'all' ? bills.length : bills.filter(b => b.status === s).length;
            return (
              <button key={s} onClick={() => setFilterStatus(s)} className={`badge capitalize cursor-pointer ${filterStatus === s ? 'bg-indigo-600 text-white' : STATUS_COLORS[s] || 'bg-slate-100 text-slate-600'}`}>
                {s} ({count})
              </button>
            );
          })}
        </div>
      )}

      <div className="card flex gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search user or category..." className="input pl-9" />
        </div>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper border-0">
          <table>
            <thead>
              <tr>
                <th>User</th><th>Category</th><th>{t('amount')}</th><th>Due Date</th><th>{t('status')}</th><th>Recurring</th><th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"/></td>)}</tr>
                ))
              ) : bills.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-10 text-slate-400">{t('noData')}</td></tr>
              ) : bills.map(b => (
                <tr key={b._id}>
                  <td>
                    <div className="font-medium text-slate-900 dark:text-white">{b.userId?.name || '—'}</div>
                    <div className="text-xs text-slate-400">{b.userId?.phone || b.userId?.email || ''}</div>
                  </td>
                  <td><span className="badge badge-info capitalize">{b.category?.replace(/_/g,' ')}</span></td>
                  <td className="font-bold text-slate-900 dark:text-white">${b.amount}</td>
                  <td className="text-slate-500 text-sm">{b.dueDate ? new Date(b.dueDate).toLocaleDateString() : '—'}</td>
                  <td><span className={`badge ${STATUS_COLORS[b.status]} capitalize`}>{b.status}</span></td>
                  <td>{b.isRecurring ? <span className="badge badge-purple">Recurring</span> : <span className="text-slate-400 text-xs">One-time</span>}</td>
                  <td>
                    <div className="relative">
                      <button onClick={() => setOpenMenu(openMenu === b._id ? null : b._id)} className="btn-ghost p-1.5 rounded-lg"><MoreVertical size={15}/></button>
                      {openMenu === b._id && (
                        <div className="absolute right-0 mt-1 w-44 card shadow-xl z-10 p-1 animate-fade-in">
                          <button onClick={() => openEdit(b)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800"><Edit size={13}/>Edit</button>
                          {b.status !== 'paid' && <button onClick={() => handleMarkPaid(b)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-emerald-600"><Download size={13}/>Mark Paid</button>}
                          <button onClick={() => handleDelete(b._id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-red-500"><Trash2 size={13}/>Delete</button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editBill ? 'Edit Bill' : 'Add Bill'}</h2>
            <div className="space-y-3">
              <div><label className="label">User ID</label><input className="input" placeholder="MongoDB user _id" value={form.userId} onChange={e => setForm({...form, userId: e.target.value})}/></div>
              <div><label className="label">Title</label><input className="input" placeholder="e.g. Electricity October" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Amount ($)</label><input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}/></div>
                <div><label className="label">Due Date</label><input type="date" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}/></div>
              </div>
              <div><label className="label">Category</label>
                <select className="input" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
                  <option value="">Select Category</option>
                  {dbCategories.map(c => <option key={c.key} value={c.key}>{c.name}</option>)}
                </select>
              </div>
              <div><label className="label">Status</label>
                <select className="input" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                  <option value="unpaid">Unpaid</option><option value="paid">Paid</option><option value="overdue">Overdue</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isRecurring} onChange={e => setForm({...form, isRecurring: e.target.checked})} className="accent-indigo-600"/>
                <span className="text-sm font-medium">Recurring bill</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : t('save')}</button>
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsManagement;
