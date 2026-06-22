import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, MoreVertical, Edit, Trash2, UserX, UserCheck,
  Key, ShieldCheck, Eye, Filter, Download, RefreshCw, AlertTriangle,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../services/api';
import CustomDialog from '../components/CustomDialog';
import { exportToCSV } from '../utils/exportUtils';

const statusBadge = { active: 'badge-success', inactive: 'badge-warning', suspended: 'badge-danger' };
const avatarColors = ['gradient-brand', 'gradient-success', 'gradient-warning', 'gradient-danger'];

const UserManagement = () => {
  const { t } = useI18n();
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openMenu, setOpenMenu] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', status: 'active', role: 'user', password: '' });
  const [dialogConfig, setDialogConfig] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      if (search) params.search = search;
      const res = await getAdminUsers(params);
      setUsers(res.data.users || []);
      setTotal(res.data.total || 0);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load users. Is the backend running?');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const openAdd = () => {
    setEditUser(null);
    setForm({ name: '', email: '', phone: '', status: 'active', role: 'user', password: '' });
    setShowModal(true);
  };

  const openEdit = (user) => {
    setEditUser(user);
    setForm({ name: user.name, email: user.email, phone: user.phone || '', status: user.status || 'active', role: user.role, password: '' });
    setShowModal(true);
    setOpenMenu(null);
  };

  const handleSave = async () => {
    if (!form.name || !/^[a-zA-Z\s]+$/.test(form.name.trim())) {
      setDialogConfig({ type: 'error', message: 'Name must contain only letters and spaces' });
      return;
    }
    const cleanPhone = form.phone.replace(/\s+/g, '');
    if (form.phone && !/^\+?\d+$/.test(cleanPhone)) {
      setDialogConfig({ type: 'error', message: 'Phone number must contain only numbers' });
      return;
    }
    setSaving(true);
    try {
      if (editUser) {
        await updateAdminUser(editUser._id, form);
        setDialogConfig({ type: 'success', message: 'User updated successfully' });
      } else {
        await createAdminUser(form);
        setDialogConfig({ type: 'success', message: 'User created successfully' });
      }
      setShowModal(false);
      fetchUsers();
    } catch (e) {
      setDialogConfig({ type: 'error', message: e.response?.data?.message || 'Error saving user' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmDeleteId(id);
    setOpenMenu(null);
  };

  const executeDelete = async (id) => {
    try {
      await deleteAdminUser(id);
      fetchUsers();
      setDialogConfig({ type: 'success', message: 'User deleted successfully' });
    } catch (e) {
      setDialogConfig({ type: 'error', message: 'Error deleting user' });
    }
  };

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await updateAdminUser(user._id, { status: newStatus });
      fetchUsers();
      setDialogConfig({ type: 'success', message: `User status changed to ${newStatus}` });
    } catch (e) {
      setDialogConfig({ type: 'error', message: 'Error updating status' });
    }
    setOpenMenu(null);
  };

  const handleExport = () => {
    const dataToExport = users.map(u => ({
      Name: u.name,
      Phone: u.phone || '',
      Email: u.email || '',
      Status: u.status || 'active',
      BillCount: u.billCount || 0,
      MFA: u.mfaEnabled ? 'Yes' : 'No',
      JoinedDate: u.createdAt ? new Date(u.createdAt).toLocaleDateString() : ''
    }));
    exportToCSV('Users_Export', dataToExport);
  };

  const initials = (name) => (name || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('userManagement')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? 'Loading...' : `${total} users in database`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUsers} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
          <button onClick={handleExport} className="btn-secondary"><Download size={15} />{t('export')}</button>
          <button className="btn-primary" onClick={openAdd}><Plus size={15} />{t('addUser')}</button>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />{error}
        </div>
      )}

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('search')} className="input pl-9" />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter size={15} className="text-slate-400" />
          {['all', 'active', 'inactive', 'suspended'].map((s) => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${filterStatus === s ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 hover:bg-slate-200'}`}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper border-0">
          <table>
            <thead>
              <tr>
                <th>{t('name')}</th>
                <th>{t('phone')}</th>
                <th className="hidden md:table-cell">{t('email')}</th>
                <th className="hidden lg:table-cell">{t('billCount')}</th>
                <th>{t('status')}</th>
                <th className="hidden xl:table-cell">MFA</th>
                <th className="hidden xl:table-cell">Joined</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>
                    {[...Array(8)].map((_, j) => (
                      <td key={j}><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse" /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">{t('noData')}</td></tr>
              ) : (
                users.map((u, i) => (
                  <tr key={u._id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl ${avatarColors[i % 4]} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                          {initials(u.name)}
                        </div>
                        <span className="font-medium text-slate-900 dark:text-white">{u.name}</span>
                      </div>
                    </td>
                    <td className="text-slate-500">{u.phone || '—'}</td>
                    <td className="hidden md:table-cell text-slate-500">{u.email}</td>
                    <td className="hidden lg:table-cell">
                      <span className="badge badge-info">{u.billCount ?? 0} bills</span>
                    </td>
                    <td>
                      <span className={`badge ${statusBadge[u.status || 'active']} capitalize`}>{u.status || 'active'}</span>
                    </td>
                    <td className="hidden xl:table-cell">
                      {u.mfaEnabled
                        ? <span className="badge badge-success"><ShieldCheck size={11} /> On</span>
                        : <span className="badge badge-warning">Off</span>
                      }
                    </td>
                    <td className="hidden xl:table-cell text-slate-400 text-xs">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                    </td>
                    <td>
                      <div className="relative">
                        <button onClick={() => setOpenMenu(openMenu === u._id ? null : u._id)} className="btn-ghost p-1.5 rounded-lg">
                          <MoreVertical size={15} />
                        </button>
                        {openMenu === u._id && (
                          <div className="absolute right-0 mt-1 w-48 card shadow-xl z-10 p-1 animate-fade-in">
                            {[
                              { icon: Edit, label: t('editUser'), action: () => openEdit(u) },
                              { icon: u.status === 'active' ? UserX : UserCheck, label: u.status === 'active' ? 'Suspend' : 'Activate', action: () => handleToggleStatus(u), color: 'text-amber-600' },
                              { icon: Trash2, label: t('deleteUser'), action: () => handleDeleteClick(u._id), color: 'text-red-500' },
                            ].map(({ icon: Icon, label, action, color }) => (
                              <button key={label} onClick={action} className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors ${color || ''}`}>
                                <Icon size={14} />{label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-md mx-4 animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">{editUser ? t('editUser') : t('addUser')}</h2>
            <div className="space-y-3">
              {[
                { label: t('name'), key: 'name', type: 'text', placeholder: 'Full name' },
                { label: t('phone'), key: 'phone', type: 'tel', placeholder: '+252 61...' },
                { label: t('email'), key: 'email', type: 'email', placeholder: 'user@email.com' },
                { label: 'Password', key: 'password', type: 'password', placeholder: editUser ? 'Leave blank to keep' : 'Min 6 characters' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="label">{label}</label>
                  <input type={type} placeholder={placeholder} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} className="input" />
                </div>
              ))}
              <div>
                <label className="label">{t('status')}</label>
                <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <div>
                <label className="label">Role</label>
                <select className="input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : t('save')}
              </button>
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
        message="Are you sure you want to delete this user? This action cannot be undone."
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

export default UserManagement;
