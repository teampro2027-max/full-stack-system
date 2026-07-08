import React, { useEffect, useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, FileText, CheckCircle, AlertTriangle, DollarSign,
  Clock, Bell, Activity, ArrowUpRight, Plus, Download, RefreshCw,
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { API_BASE_URL, getDashboardStats } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';

const CATEGORY_COLORS = {
  electricity: '#6366f1', water: '#3b82f6', internet: '#10b981',
  rent: '#f59e0b', school_fees: '#ef4444', mobile_postpaid: '#8b5cf6',
  tv_subscription: '#ec4899', waste_collection: '#64748b',
  loan_installment: '#f97316', government_license: '#14b8a6',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// â”€â”€ Stat Card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
const StatCard = ({ title, value, change, icon: Icon, gradient, loading }) => (
  <div className="stat-card group cursor-default">
    <div>
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
      {loading
        ? <div className="h-7 w-24 bg-slate-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
        : <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-white">{value}</p>
      }
      {change && (
        <div className="flex items-center gap-1 mt-2 text-xs font-medium text-emerald-600">
          <ArrowUpRight size={13} />{change}
        </div>
      )}
    </div>
    <div className={`w-12 h-12 rounded-2xl ${gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
      <Icon size={22} className="text-white" />
    </div>
  </div>
);

const Dashboard = () => {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getDashboardStats();
      setData(res.data);
    } catch (e) {
      if (!e.response) {
        setError(`Failed to load dashboard data. Backend is not reachable at ${API_BASE_URL}.`);
      } else if (e.response.status === 401) {
        setError('Admin session expired or token is missing. Please sign in again.');
      } else {
        setError(e.response?.data?.message || 'Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const stats = data?.stats;

  const statCards = [
    { title: t('totalUsers'), value: stats?.totalUsers ?? 'â€”', icon: Users, gradient: 'gradient-brand' },
    { title: t('activeBills'), value: stats?.activeBills ?? 'â€”', icon: FileText, gradient: 'gradient-brand' },
    { title: t('paidBills'), value: stats?.paidBills ?? 'â€”', icon: CheckCircle, gradient: 'gradient-success' },
    { title: t('overdueBills'), value: stats?.overdueBills ?? 'â€”', icon: AlertTriangle, gradient: 'gradient-warning' },
    { title: t('monthlyRevenue'), value: stats ? `$${stats.monthlyRevenue?.toLocaleString()}` : 'â€”', icon: DollarSign, gradient: 'gradient-success' },
    { title: t('pendingPayments'), value: stats?.pendingBills ?? 'â€”', icon: Clock, gradient: 'gradient-warning' },
    { title: 'Monthly Transactions', value: stats?.monthlyTransactions ?? 'â€”', icon: Activity, gradient: 'gradient-brand' },
    { title: t('upcomingReminders'), value: data?.upcomingBills?.length ?? 'â€”', icon: Bell, gradient: 'gradient-danger' },
  ];

  // Transform monthly revenue for chart
  const monthlyChart = (data?.monthlyRevenue || []).map((m) => ({
    month: MONTH_NAMES[(m._id?.month || 1) - 1],
    revenue: m.revenue,
    count: m.count,
  }));

  // Category pie data
  const categoryPie = (data?.categoryStats || []).slice(0, 6).map((c) => ({
    name: c._id?.replace(/_/g, ' '),
    value: c.count,
    color: CATEGORY_COLORS[c._id] || '#94a3b8',
  }));

  // Recent payments
  const recentPayments = data?.recentPayments || [];
  const upcomingBills = data?.upcomingBills || [];

  const handleExport = () => {
    if (!data) return;
    const exportData = [
      { Metric: 'Total Users', Value: stats.users },
      { Metric: 'Active Bills', Value: stats.activeBills },
      { Metric: 'Payments (Month)', Value: `$${stats.monthlyPayments}` },
      { Metric: 'Pending Amount', Value: `$${stats.pendingAmount}` },
      ...recentPayments.map(p => ({
        Metric: `Payment: ${p.transactionId || 'Unknown'}`,
        Value: `$${p.amount} - ${p.status}`
      }))
    ];
    exportToCSV('Dashboard_Summary', exportData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('welcome')}, Admin
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">Live data from MongoDB database</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchStats} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button className="btn-primary"><Plus size={15} />Quick Add</button>
          <button onClick={handleExport} className="btn-secondary"><Download size={15} />Export</button>
        </div>
      </div>

      {error && (
        <div className="card border-red-200 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <StatCard key={s.title} {...s} loading={loading} />
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Area Chart */}
        <div className="card xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-slate-900 dark:text-white">{t('monthlyRevenue')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                {loading ? 'Loading...' : `${monthlyChart.length} months of data`}
              </p>
            </div>
          </div>
          {loading ? (
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : monthlyChart.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
              No payment data yet. Add payments to see the chart.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyChart}>
                <defs>
                  <linearGradient id="gr1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Bills']} />
                <Area type="monotone" dataKey="revenue" stroke="#6366f1" strokeWidth={2} fill="url(#gr1)" name="Bills" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Pie Chart */}
        <div className="card">
          <h2 className="font-semibold text-slate-900 dark:text-white mb-1">{t('categoryComparison')}</h2>
          <p className="text-xs text-slate-400 mb-4">Bills by category (live)</p>
          {loading ? (
            <div className="h-48 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
          ) : categoryPie.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No bills yet</div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryPie} cx="50%" cy="50%" innerRadius={45} outerRadius={75} paddingAngle={3} dataKey="value">
                    {categoryPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Bills']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryPie.map((c) => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                      <span className="capitalize text-slate-600 dark:text-slate-400">{c.name}</span>
                    </div>
                    <span className="font-semibold">{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity + Upcoming Bills */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Recent Payments */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t('recentActivities')}</h2>
            <button className="text-xs text-indigo-600 font-medium hover:underline">{t('viewAll')}</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : recentPayments.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">{t('noData')}</p>
          ) : (
            <div className="space-y-2">
              {recentPayments.map((p) => (
                <div key={p._id} className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {p.userId?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">{p.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400 capitalize">{p.billId?.category?.replace(/_/g, ' ') || 'Payment'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-emerald-600">${p.amount}</p>
                    <p className="text-xs text-slate-400">{new Date(p.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Bills */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900 dark:text-white">{t('upcomingReminders')}</h2>
            <button className="btn-primary text-xs px-3 py-1.5"><Bell size={13} />Send All</button>
          </div>
          {loading ? (
            <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />)}</div>
          ) : upcomingBills.length === 0 ? (
            <p className="text-slate-400 text-sm text-center py-8">No upcoming bills in the next 7 days ðŸŽ‰</p>
          ) : (
            <div className="space-y-2">
              {upcomingBills.map((b) => (
                <div key={b._id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800">
                  <div>
                    <p className="text-sm font-medium">{b.userId?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-400 capitalize">{b.category?.replace(/_/g, ' ')} â€¢ Due {new Date(b.dueDate).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-600">${b.amount}</span>
                    <button className="btn-secondary text-xs px-2 py-1"><Bell size={11} /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

