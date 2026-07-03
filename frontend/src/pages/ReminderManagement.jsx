import React, { useState, useEffect } from 'react';
import { Bell, Plus, Clock, Edit, Trash2, Send, RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getDashboardStats } from '../services/api';

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

  const formatReminderDate = (value) => {
    if (!value) return 'Not set';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'Not set';
    return date.toLocaleString();
  };

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
        <h2 className="font-semibold mb-4 flex items-center gap-2"><Bell size={16} className="text-indigo-600"/>Reminder Bills</h2>
        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : upcomingBills.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
            No reminder-ready bills were found yet.
          </div>
        ) : (
          <div className="space-y-3">
            {upcomingBills.map((bill) => (
              <div key={bill._id} className="flex flex-col gap-2 rounded-xl border border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{bill.title}</div>
                  <div className="text-sm text-slate-500">{bill.userId?.name || 'Unknown user'} • {bill.category}</div>
                </div>
                <div className="text-left md:text-right">
                  <div className="font-semibold text-indigo-600">${bill.amount}</div>
                  <div className="text-xs text-slate-500">Reminder: {formatReminderDate(bill.notificationDate || bill.dueDate)}</div>
                  <div className="text-xs text-slate-500">Due: {formatReminderDate(bill.dueDate)}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ReminderManagement;
