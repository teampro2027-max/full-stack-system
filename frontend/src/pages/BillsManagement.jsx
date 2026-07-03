import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, Filter, RefreshCw, AlertTriangle, Edit, Trash2, MoreVertical, Download } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getAdminBills, updateAdminBill, deleteAdminBill, createAdminBill, getUserBills, createUserBill, updateUserBill, deleteUserBill, getCategories } from '../services/api';
import { useStore } from '../store/useStore';
import CustomDialog from '../components/CustomDialog';

const STATUS_COLORS = { paid: 'badge-success', unpaid: 'badge-warning', overdue: 'badge-danger' };

const BillsManagement = () => {
  const { t } = useI18n();
  const adminUser = useStore((s) => s.adminUser);
  const isAdmin = adminUser?.role === 'admin';

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
  const [selectedParentKey, setSelectedParentKey] = useState('');
  const [form, setForm] = useState({
    userId: '',
    title: '',
    amount: '',
    category: '',
    status: 'unpaid',
    dueDate: '',
    startDate: '',
    notificationDate: '',
    isRecurring: false
  });
  const [dialogConfig, setDialogConfig] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const getParentKeyFromCategoryKey = (catKey) => {
    if (!catKey) return '';
    const idx = catKey.indexOf('_');
    if (idx === -1) return catKey;
    return catKey.substring(0, idx);
  };

  const toDateTimeLocal = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const openAdd = () => {
    setEditBill(null);
    setSelectedParentKey('');
    setForm({
      userId: '',
      title: '',
      amount: '',
      category: '',
      status: 'unpaid',
      dueDate: '',
      startDate: new Date().toISOString().slice(0, 16),
      notificationDate: '',
      isRecurring: false
    });
    setShowModal(true);
  };

  const fetchBills = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = { status: filterStatus !== 'all' ? filterStatus : undefined, search };
      const [billsRes, catRes] = await Promise.all([
        isAdmin ? getAdminBills(params) : getUserBills(params),
        getCategories()
      ]);
      const resData = billsRes.data;
      const parsedBills = Array.isArray(resData) ? resData : (resData.bills || []);
      const parsedTotal = Array.isArray(resData) ? resData.length : (resData.total || parsedBills.length);

      setBills(parsedBills);
      setTotal(parsedTotal);
      const activeCats = (catRes.data.categories || []).filter(c => c.active);
      setDbCategories(activeCats);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load data'); }
    finally { setLoading(false); }
  }, [filterStatus, search, isAdmin]);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  const openEdit = (bill) => {
    setEditBill(bill);
    const parentKey = getParentKeyFromCategoryKey(bill.category);
    setSelectedParentKey(parentKey);
    setForm({
      userId: bill.userId?._id || '',
      title: bill.title || '',
      amount: bill.amount || '',
      category: bill.category || '',
      status: bill.status,
      dueDate: toDateTimeLocal(bill.dueDate),
      startDate: toDateTimeLocal(bill.startDate),
      notificationDate: toDateTimeLocal(bill.notificationDate),
      isRecurring: bill.isRecurring || false
    });
    setShowModal(true); setOpenMenu(null);
  };

  const handleSave = async () => {
    if (!form.title || !/^[a-zA-Z\s]+$/.test(form.title.trim())) {
      setDialogConfig({ type: 'error', message: 'Title must contain only letters and spaces' });
      return;
    }
    if (form.amount === '' || isNaN(form.amount) || Number(form.amount) <= 0) {
      setDialogConfig({ type: 'error', message: 'Amount must be a valid number greater than 0' });
      return;
    }
    if (!form.category) {
      setDialogConfig({ type: 'error', message: 'Fadlan dooro category ama subcategory' });
      return;
    }

    const nowObj = new Date();
    const buffer = 5 * 60 * 1000;

    if (form.startDate && new Date(form.startDate).getTime() < nowObj.getTime() - buffer) {
      setDialogConfig({ type: 'error', message: 'Registration/Start date and time cannot be in the past' });
      return;
    }
    if (form.dueDate && new Date(form.dueDate).getTime() < nowObj.getTime() - buffer) {
      setDialogConfig({ type: 'error', message: 'Due date and time cannot be in the past' });
      return;
    }
    if (form.notificationDate && new Date(form.notificationDate).getTime() < nowObj.getTime() - buffer) {
      setDialogConfig({ type: 'error', message: 'Notification date and time cannot be in the past' });
      return;
    }
    const startT = form.startDate ? new Date(form.startDate).getTime() : nowObj.getTime();
    if (form.dueDate && new Date(form.dueDate).getTime() < startT) {
      setDialogConfig({ type: 'error', message: 'Due date must be after the start date' });
      return;
    }
    if (form.notificationDate && new Date(form.notificationDate).getTime() < startT) {
      setDialogConfig({ type: 'error', message: 'Notification date must be after the start date' });
      return;
    }

    setSaving(true);
    try {
      if (editBill) {
        if (isAdmin) {
          await updateAdminBill(editBill._id, form);
        } else {
          await updateUserBill(editBill._id, form);
        }
        setDialogConfig({ type: 'success', message: 'Bill updated successfully' });
      } else {
        if (isAdmin) {
          await createAdminBill(form);
        } else {
          await createUserBill(form);
        }
        setDialogConfig({ type: 'success', message: 'Bill created successfully' });
      }
      setShowModal(false); fetchBills();
    } catch (e) { setDialogConfig({ type: 'error', message: e.response?.data?.message || 'Error saving bill' }); }
    finally { setSaving(false); }
  };

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
    setOpenMenu(null);
  };

  const executeDelete = async (id) => {
    try { 
      if (isAdmin) {
        await deleteAdminBill(id);
      } else {
        await deleteUserBill(id);
      }
      fetchBills(); 
      setDialogConfig({ type: 'success', message: 'Bill deleted successfully' });
    } catch { setDialogConfig({ type: 'error', message: 'Error deleting bill' }); }
  };

  const handleMarkPaid = async (bill) => {
    try { 
      if (isAdmin) {
        await updateAdminBill(bill._id, { status: 'paid' });
      } else {
        await updateUserBill(bill._id, { status: 'paid' });
      }
      fetchBills(); 
      setDialogConfig({ type: 'success', message: 'Bill marked as paid' });
    } catch { setDialogConfig({ type: 'error', message: 'Error marking bill as paid' }); }
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
          <button className="btn-primary" onClick={openAdd}><Plus size={15} />Add Bill</button>
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
                {isAdmin && <th>User</th>}
                <th>Title</th>
                <th>Category</th>
                <th>{t('amount')}</th>
                <th>Due Date</th>
                <th>{t('status')}</th>
                <th>Recurring</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(isAdmin ? 8 : 7)].map((_, j) => <td key={j}><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"/></td>)}</tr>
                ))
              ) : bills.length === 0 ? (
                <tr><td colSpan={isAdmin ? 8 : 7} className="text-center py-10 text-slate-400">{t('noData')}</td></tr>
              ) : bills.map(b => (
                <tr key={b._id}>
                  {isAdmin && (
                    <td>
                      <div className="font-medium text-slate-900 dark:text-white">{b.userId?.name || '—'}</div>
                      <div className="text-xs text-slate-400">{b.userId?.phone || b.userId?.email || ''}</div>
                    </td>
                  )}
                  <td><span className="font-medium text-slate-800 dark:text-slate-100">{b.title}</span></td>
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
                          <button onClick={() => handleDeleteClick(b._id)} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 text-red-500"><Trash2 size={13}/>Delete</button>
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
              {isAdmin && (
                <div>
                  <label className="label">User ID</label>
                  <input
                    className="input"
                    placeholder="MongoDB user _id"
                    value={form.userId}
                    onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  />
                </div>
              )}
              <div><label className="label">Title</label><input className="input" placeholder="e.g. Electricity October" value={form.title} onChange={e => setForm({...form, title: e.target.value})}/></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Amount ($)</label><input type="number" className="input" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})}/></div>
                <div><label className="label">Due Date & Time</label><input type="datetime-local" className="input" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})}/></div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Start Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="label">Notification Date & Time</label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={form.notificationDate}
                    onChange={(e) => setForm({ ...form, notificationDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select
                    className="input"
                    value={selectedParentKey}
                    onChange={(e) => {
                      const pKey = e.target.value;
                      setSelectedParentKey(pKey);
                      const parent = dbCategories.find((c) => c.key === pKey);
                      const hasSubs = dbCategories.some((c) => c.parentId === parent?._id);
                      setForm({ ...form, category: hasSubs ? '' : pKey });
                    }}
                  >
                    <option value="">Select Category</option>
                    {dbCategories
                      .filter((c) => !c.parentId)
                      .map((c) => (
                        <option key={c.key} value={c.key}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {selectedParentKey &&
                  dbCategories.some(
                    (c) =>
                      c.parentId ===
                      dbCategories.find((p) => p.key === selectedParentKey)?._id
                  ) && (
                    <div>
                      <label className="label">Subcategory</label>
                      <select
                        className="input"
                        value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                      >
                        <option value="">Select Subcategory</option>
                        {dbCategories
                          .filter(
                            (c) =>
                              c.parentId ===
                              dbCategories.find((p) => p.key === selectedParentKey)?._id
                          )
                          .map((c) => (
                            <option key={c.key} value={c.key}>
                              {c.name}
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
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
        message="Are you sure you want to delete this bill? This action cannot be undone."
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

export default BillsManagement;
