import React, { useState } from 'react';
import { Shield, Key, Eye, Smartphone, LogOut, Clock, User, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';

const mockSessions = [
  { id: 1, device: 'Chrome – Windows 11', ip: '196.201.112.45', location: 'Mogadishu, SO', time: 'Now (current)', current: true },
  { id: 2, device: 'Safari – iPhone 14', ip: '196.201.118.77', location: 'Mogadishu, SO', time: '2 hours ago', current: false },
  { id: 3, device: 'Firefox – Ubuntu', ip: '41.205.16.32', location: 'Hargeisa, SO', time: 'Yesterday', current: false },
];

const mockAuditLogs = [
  { id: 1, action: 'User login', user: 'admin@admin.com', ip: '196.201.112.45', time: '10:02 AM', type: 'info' },
  { id: 2, action: 'Bill status updated to paid', user: 'admin@admin.com', ip: '196.201.112.45', time: '09:48 AM', type: 'success' },
  { id: 3, action: 'User deleted', user: 'admin@admin.com', ip: '196.201.112.45', time: '09:30 AM', type: 'danger' },
  { id: 4, action: 'Payment confirmed', user: 'admin@admin.com', ip: '196.201.112.45', time: '09:15 AM', type: 'success' },
  { id: 5, action: 'Failed login attempt', user: 'unknown@test.com', ip: '41.100.0.12', time: '08:55 AM', type: 'danger' },
];

const typeColors = { info: 'text-blue-500 bg-blue-50 dark:bg-blue-900/20', success: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20', danger: 'text-red-500 bg-red-50 dark:bg-red-900/20' };

const Security = () => {
  const { t } = useI18n();
  const [mfaEnabled, setMfaEnabled] = useState(true);
  const [tab, setTab] = useState('overview');

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('securityMfa')}</h1>
        <p className="text-sm text-slate-500 mt-0.5">Manage authentication, sessions and audit logs</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        {['overview','sessions','audit'].map(tb => (
          <button key={tb} onClick={() => setTab(tb)} className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-all ${tab === tb ? 'bg-white dark:bg-slate-900 shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
            {tb}
          </button>
        ))}
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* MFA */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center"><Smartphone size={18} className="text-white"/></div>
              <div><p className="font-semibold">Two-Factor Authentication</p><p className="text-xs text-slate-400">Secure your admin account</p></div>
            </div>
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
              <div>
                <p className="font-medium text-sm">Authenticator App (TOTP)</p>
                <p className="text-xs text-slate-400">Google Authenticator / Authy</p>
              </div>
              <button onClick={() => setMfaEnabled(!mfaEnabled)} className={`relative w-12 h-6 rounded-full transition-colors ${mfaEnabled ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${mfaEnabled ? 'translate-x-6' : ''}`}/>
              </button>
            </div>
            {mfaEnabled && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle size={14}/> MFA is active and protecting your account
              </div>
            )}
          </div>
          {/* Password */}
          <div className="card">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl gradient-success flex items-center justify-center"><Key size={18} className="text-white"/></div>
              <div><p className="font-semibold">Change Password</p><p className="text-xs text-slate-400">Last changed 30 days ago</p></div>
            </div>
            <div className="space-y-3">
              {['Current Password','New Password','Confirm Password'].map(label => (
                <div key={label}>
                  <label className="label">{label}</label>
                  <input type="password" placeholder="••••••••" className="input"/>
                </div>
              ))}
              <button className="btn-primary w-full mt-2">Update Password</button>
            </div>
          </div>
        </div>
      )}

      {tab === 'sessions' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Active Sessions</h2>
            <button className="btn-danger text-xs"><LogOut size={13}/>Revoke All Others</button>
          </div>
          <div className="space-y-3">
            {mockSessions.map(s => (
              <div key={s.id} className={`flex items-center justify-between p-4 rounded-xl border ${s.current ? 'border-indigo-200 bg-indigo-50 dark:bg-indigo-900/20' : 'border-slate-100 dark:border-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><User size={14} className="text-slate-500"/></div>
                  <div>
                    <p className="text-sm font-medium">{s.device}</p>
                    <p className="text-xs text-slate-400">{s.ip} · {s.location}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-slate-400">{s.time}</p>
                  {s.current ? <span className="badge badge-success text-xs">Current</span> : <button className="text-xs text-red-500 hover:underline mt-1">Revoke</button>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'audit' && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Audit Log</h2>
            <button className="btn-secondary text-xs"><RefreshCw size={13}/>Refresh</button>
          </div>
          <div className="space-y-2">
            {mockAuditLogs.map(log => (
              <div key={log.id} className={`flex items-start gap-3 p-3 rounded-xl ${typeColors[log.type]}`}>
                <AlertTriangle size={14} className="mt-0.5 flex-shrink-0"/>
                <div className="flex-1">
                  <p className="text-sm font-medium">{log.action}</p>
                  <p className="text-xs opacity-70">{log.user} · {log.ip}</p>
                </div>
                <div className="flex items-center gap-1 text-xs opacity-60"><Clock size={11}/>{log.time}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Security;
