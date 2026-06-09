import React, { useState } from 'react';
import { Lock, Plus, Edit, Trash2, Users, Shield } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const ROLES = [
  { id: 1, name: 'Super Admin', users: 1, color: 'bg-purple-100 text-purple-700', permissions: ['All access','User management','System settings','Billing','Reports','Security'] },
  { id: 2, name: 'Admin', users: 3, color: 'bg-blue-100 text-blue-700', permissions: ['User management','Billing','Reports','Reminders'] },
  { id: 3, name: 'Finance Manager', users: 5, color: 'bg-green-100 text-green-700', permissions: ['Billing','Payments','Reports','Payment Confirmations'] },
  { id: 4, name: 'Support Agent', users: 8, color: 'bg-amber-100 text-amber-700', permissions: ['View Users','View Bills'] },
];

const ALL_PERMISSIONS = ['Dashboard','User Management','Bill Categories','Bills Management','Payments','Payment Confirmations','Reminder Management','Reports & Analytics','Expense Tracking','Security & MFA','System Settings','Roles & Permissions'];

const RolesPermissions = () => {
  const { t } = useI18n();
  const [selected, setSelected] = useState(ROLES[0]);
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('rolesPermissions')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage roles and access control</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}><Plus size={15}/>New Role</button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {ROLES.map(role => (
            <button key={role.id} onClick={() => setSelected(role)} className={`w-full text-left card flex items-center justify-between transition-all hover:shadow-md ${selected.id === role.id ? 'border-2 border-indigo-500' : ''}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center"><Shield size={18}/></div>
                <div>
                  <p className="font-semibold text-sm">{role.name}</p>
                  <p className="text-xs text-slate-400 flex items-center gap-1"><Users size={11}/>{role.users} users</p>
                </div>
              </div>
              <span className={`badge ${role.color}`}>{role.permissions.length} perms</span>
            </button>
          ))}
        </div>
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold">{selected.name}</h2>
              <p className="text-xs text-slate-400">{selected.users} user(s)</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary text-xs"><Edit size={13}/>Edit</button>
              <button className="btn-danger text-xs"><Trash2 size={13}/>Delete</button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {ALL_PERMISSIONS.map(perm => {
              const hasAccess = selected.permissions.some(p => p === 'All access' || p.toLowerCase().includes(perm.toLowerCase().split(' ')[0]));
              return (
                <label key={perm} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${hasAccess ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                  <input type="checkbox" defaultChecked={hasAccess} className="rounded accent-indigo-600 w-4 h-4"/>
                  <div className="flex items-center gap-2">
                    <Lock size={13} className={hasAccess ? 'text-indigo-600' : 'text-slate-400'}/>
                    <span className={`text-xs font-medium ${hasAccess ? 'text-indigo-700 dark:text-indigo-400' : 'text-slate-500'}`}>{perm}</span>
                  </div>
                </label>
              );
            })}
          </div>
          <button className="btn-primary w-full mt-4">Save Permissions</button>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="card w-full max-w-sm mx-4 animate-fade-in" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Create New Role</h2>
            <div className="space-y-3">
              <div><label className="label">Role Name</label><input type="text" placeholder="e.g. Finance Manager" className="input"/></div>
              <div><label className="label">Description</label><textarea className="input resize-none" rows={2} placeholder="Brief description..."/></div>
            </div>
            <div className="flex gap-2 mt-5">
              <button className="btn-primary flex-1" onClick={() => setShowModal(false)}>{t('save')}</button>
              <button className="btn-secondary flex-1" onClick={() => setShowModal(false)}>{t('cancel')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesPermissions;
