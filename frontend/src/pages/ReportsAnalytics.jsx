import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, DollarSign, Users, FileText, Download, RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getDashboardStats } from '../services/api';
import { exportToCSV } from '../utils/exportUtils';

const CATEGORY_COLORS = {
  electricity: '#6366f1', water: '#3b82f6', internet: '#10b981',
  rent: '#f59e0b', school_fees: '#ef4444', mobile_postpaid: '#8b5cf6',
  tv_subscription: '#ec4899', waste_collection: '#64748b',
  loan_installment: '#f97316', government_license: '#14b8a6',
};

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ReportsAnalytics = () => {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = async () => {
    setLoading(true); setError('');
    try {
      const res = await getDashboardStats();
      setData(res.data);
    } catch (e) {
      setError('Failed to load reports data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStats(); }, []);

  const stats = data?.stats;

  // Monthly data formatted
  const monthlyData = (data?.monthlyRevenue || []).map(m => ({
    month: MONTH_NAMES[(m._id?.month || 1) - 1],
    revenue: m.revenue,
    expenses: m.revenue * 0.4, // Mocking expenses based on revenue for the chart
    bills: m.count,
  }));

  // Category Pie Data
  const totalBills = data?.categoryStats?.reduce((acc, c) => acc + c.count, 0) || 1;
  const categoryData = (data?.categoryStats || []).slice(0, 6).map(c => ({
    name: c._id?.replace(/_/g, ' ') || 'Unknown',
    value: Math.round((c.count / totalBills) * 100),
    count: c.count,
    color: CATEGORY_COLORS[c._id] || '#94a3b8',
  }));

  const totalRevenue = data?.monthlyRevenue?.reduce((acc, m) => acc + m.revenue, 0) || 0;
  const avgMonthly = monthlyData.length ? Math.round(totalRevenue / monthlyData.length) : 0;

  const handleExport = () => {
    if (!data) return;
    const exportData = [
      { Metric: 'Total Revenue', Value: `$${totalRevenue}` },
      { Metric: 'Avg Monthly', Value: `$${avgMonthly}` },
      { Metric: 'Total Users', Value: stats?.totalUsers || 0 },
      { Metric: 'Total Bills', Value: (stats?.activeBills + stats?.paidBills) || 0 },
      ...monthlyData.map(m => ({
        Metric: `Month: ${m.month}`,
        Value: `Revenue: $${m.revenue}, Bills: ${m.bills}`
      }))
    ];
    exportToCSV('Reports_Analytics', exportData);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('reportsAnalytics')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live database statistics and analytics</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchStats} className="btn-secondary">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button onClick={handleExport} className="btn-primary"><Download size={15}/>Export CSV</button>
        </div>
      </div>

      {error && <div className="card text-red-600 bg-red-50 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: loading ? '...' : `$${totalRevenue.toLocaleString()}`, icon: DollarSign, cls: 'text-indigo-600' },
          { label: 'Avg Monthly', value: loading ? '...' : `$${avgMonthly.toLocaleString()}`, icon: TrendingUp, cls: 'text-emerald-600' },
          { label: 'Total Users', value: loading ? '...' : stats?.totalUsers || 0, icon: Users, cls: 'text-blue-600' },
          { label: 'Total Bills', value: loading ? '...' : (stats?.activeBills + stats?.paidBills) || 0, icon: FileText, cls: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, cls }) => (
          <div key={label} className="card">
            <Icon size={20} className={cls + ' mb-2'} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="card xl:col-span-2">
          <h2 className="font-semibold mb-4">Revenue vs Expenses (Est.)</h2>
          {loading ? <div className="h-[260px] bg-slate-100 rounded-xl animate-pulse"/> : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
                <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
                <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']}/>
                <Legend/>
                <Bar dataKey="revenue" fill="#6366f1" radius={[4,4,0,0]} name="Revenue"/>
                <Bar dataKey="expenses" fill="#f59e0b" radius={[4,4,0,0]} name="Expenses"/>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="card">
          <h2 className="font-semibold mb-1">Bill Categories</h2>
          <p className="text-xs text-slate-400 mb-4">Live distribution</p>
          {loading ? <div className="h-[160px] bg-slate-100 rounded-xl animate-pulse"/> : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={3} dataKey="value">
                    {categoryData.map((entry, i) => <Cell key={i} fill={entry.color}/>)}
                  </Pie>
                  <Tooltip formatter={v => [`${v}%`, '']}/>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {categoryData.map(c => (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }}/>
                      <span className="text-slate-600 dark:text-slate-400 capitalize">{c.name}</span>
                    </div>
                    <span className="font-semibold">{c.value}%</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">Monthly Transactions Trend</h2>
        {loading ? <div className="h-[200px] bg-slate-100 rounded-xl animate-pulse"/> : (
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="billGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <Tooltip/>
              <Area type="monotone" dataKey="bills" stroke="#10b981" strokeWidth={2} fill="url(#billGrad)" name="Transactions"/>
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ReportsAnalytics;
