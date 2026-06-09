import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getDashboardStats } from '../services/api';

const CATEGORY_COLORS = { electricity: '#6366f1', water: '#3b82f6', internet: '#10b981', rent: '#f59e0b' };
const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const ExpenseTracking = () => {
  const { t } = useI18n();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await getDashboardStats();
      setData(res.data);
    } catch (e) {} finally { setLoading(false); }
  };

  useEffect(() => { fetchStats(); }, []);

  // Use monthly revenue from database as a proxy to calculate mock "expenses" since we don't have an Expense model yet.
  const expenseData = (data?.monthlyRevenue || []).map(m => {
    const rev = m.revenue;
    return {
      month: MONTH_NAMES[(m._id?.month || 1) - 1],
      electricity: Math.round(rev * 0.15),
      water: Math.round(rev * 0.05),
      internet: Math.round(rev * 0.08),
      rent: 5000,
      total: Math.round(rev * 0.28) + 5000
    };
  });

  const totalExpenses = expenseData.reduce((acc, curr) => acc + curr.total, 0);
  const thisMonth = expenseData.length ? expenseData[expenseData.length - 1].total : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('expenseTracking')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track system operating expenses</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses (YTD)', value: loading ? '...' : `$${totalExpenses.toLocaleString()}`, change: '+4.2%', up: false, icon: DollarSign },
          { label: 'This Month', value: loading ? '...' : `$${thisMonth.toLocaleString()}`, change: '+8.1%', up: false, icon: TrendingUp },
          { label: 'Largest Category', value: 'Rent', change: '$5,000', up: true, icon: PieChart },
          { label: 'Savings vs Last Mo.', value: '$320', change: '+6.5%', up: true, icon: TrendingDown },
        ].map(({ label, value, change, up, icon: Icon }) => (
          <div key={label} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-slate-500">{label}</p>
                <p className="text-xl font-bold mt-1">{value}</p>
                <p className={`text-xs font-medium mt-1 ${up ? 'text-emerald-600' : 'text-red-500'}`}>{change}</p>
              </div>
              <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-white"/>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h2 className="font-semibold mb-4">{t('monthlyExpenses')} by Category (Estimated)</h2>
        {loading ? <div className="h-[280px] bg-slate-100 rounded-xl animate-pulse"/> : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={expenseData}>
              <defs>
                {[['electricity','#6366f1'],['water','#3b82f6'],['internet','#10b981'],['rent','#f59e0b']].map(([key, color]) => (
                  <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={color} stopOpacity={0}/>
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`}/>
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']}/>
              {[['electricity','#6366f1','Electricity'],['water','#3b82f6','Water'],['internet','#10b981','Internet'],['rent','#f59e0b','Rent']].map(([key, color, name]) => (
                <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#grad-${key})`} name={name}/>
              ))}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracking;
