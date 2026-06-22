import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Edit, Trash2, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getDashboardStats } from '../services/api';

const templates = [
  { id: 1, name: 'Bill Due Soon', msg: 'Dear {name}, your {category} bill of ${amount} is due on {date}. Pay now via EVC Plus.', lang: 'EN' },
  { id: 2, name: 'Bill Due Soon (Somali)', msg: 'Mahadsanid {name}, biishaada {category} ee ${amount} waxay dhacaysaa {date}. Bixo hadda EVC Plus.', lang: 'SO' },
];

const ReminderManagement = () => {
  const { t } = useI18n();
  const [upcomingBills, setUpcomingBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUpcoming = async () => {
    setLoading(true); setError('');
    try {
      const res = await getDashboardStats();
      setUpcomingBills(res.data.upcomingBills || []);
    } catch (e) { setError('Failed to load upcoming bills'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUpcoming(); }, []);

  // Generate campaigns dynamically based on upcoming bills grouped by category
  const groupedUpcoming = upcomingBills.reduce((acc, bill) => {
    const cat = bill.category || 'other';
    if (!acc[cat]) acc[cat] = { count: 0, users: new Set(), amount: 0 };
    acc[cat].count++;
    if (bill.userId?._id) acc[cat].users.add(bill.userId._id);
    acc[cat].amount += bill.amount;
    return acc;
  }, {});

  const dynamicReminders = Object.keys(groupedUpcoming).map((cat, i) => ({
    id: i,
    title: `${cat.replace(/_/g, ' ').toUpperCase()} Bill Reminder`,
    users: groupedUpcoming[cat].users.size,
    sent: 0,
    scheduled: 'Dynamic',
    status: 'active',
    channel: 'SMS+Push',
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reminderManagement')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Automated reminders based on MongoDB Upcoming Bills</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchUpcoming} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
        </div>
      </div>

      {error && <div className="card text-red-600 bg-red-50 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Upcoming Bills', value: loading ? '...' : upcomingBills.length, color: 'text-indigo-600' },
          { label: 'Active Campaigns', value: loading ? '...' : dynamicReminders.length, color: 'text-emerald-600' },
          { label: 'Success Rate', value: '98.5%', color: 'text-emerald-600' },
          { label: 'Failed Deliveries', value: 0, color: 'text-amber-600' },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Bell size={16} className="text-indigo-600"/>Active Auto-Campaigns (From Live Data)</h2>
        <div className="table-wrapper border-0 -mx-6">
          <table>
            <thead>
              <tr><th>Name</th><th>Channel</th><th>Users Target</th><th>Sent</th><th>Schedule</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {loading ? [...Array(3)].map((_, i) => <tr key={i}>{[...Array(7)].map((_, j) => <td key={j}><div className="h-4 bg-slate-100 rounded animate-pulse"/></td>)}</tr>) : 
               dynamicReminders.length === 0 ? <tr><td colSpan={7} className="text-center py-6 text-slate-400">No upcoming bills to remind.</td></tr> :
               dynamicReminders.map(r => (
                <tr key={r.id}>
                  <td className="font-medium">{r.title}</td>
                  <td><span className="badge badge-info">{r.channel}</span></td>
                  <td>{r.users}</td>
                  <td><span className="text-emerald-600 font-semibold">{r.sent}</span></td>
                  <td><span className="flex items-center gap-1 text-xs text-slate-500"><Clock size={11}/>{r.scheduled}</span></td>
                  <td><span className="badge badge-success capitalize">{r.status}</span></td>
                  <td>
                    <div className="flex gap-1">
                      <button className="btn-ghost p-1.5 rounded-lg"><Send size={13} className="text-indigo-500"/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Message Templates</h2>
        <div className="space-y-3">
          {templates.map(tpl => (
            <div key={tpl.id} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium text-sm">{tpl.name}</p>
                <span className="badge badge-purple">{tpl.lang}</span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">{tpl.msg}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReminderManagement;
