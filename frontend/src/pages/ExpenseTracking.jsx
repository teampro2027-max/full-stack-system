import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChart, RefreshCw } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getDashboardStats } from '../services/api';

const CATEGORY_COLORS = {
  electricity: '#6366f1',
  water: '#3b82f6',
  internet: '#10b981',
  rent: '#f59e0b',
  school_fees: '#ef4444',
  mobile_postpaid: '#ec4899',
  tv_subscription: '#6366f1',
  waste_collection: '#84cc16',
  loan_installment: '#f97316',
  government_license: '#14b8a6',
  biyo: '#3b82f6',
  phone: '#2563eb'
};
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

  // Group monthly expenses from database by year-month
  const monthlyExpensesRaw = data?.monthlyExpenses || [];
  const groupedExpenses = {};
  monthlyExpensesRaw.forEach(item => {
    if (!item._id) return;
    const key = `${item._id.year}-${item._id.month}`;
    if (!groupedExpenses[key]) {
      groupedExpenses[key] = {
        month: MONTH_NAMES[(item._id.month || 1) - 1],
        total: 0
      };
    }
    const catName = item._id.category || 'other';
    groupedExpenses[key][catName] = item.total;
    groupedExpenses[key].total += item.total;
  });

  const categoriesList = data?.categoryStats || [];
  
  const expenseData = Object.values(groupedExpenses).map(monthData => {
    const cleanMonthData = { ...monthData };
    categoriesList.forEach(c => {
      const catKey = c._id;
      if (cleanMonthData[catKey] === undefined) {
        cleanMonthData[catKey] = 0;
      }
    });
    return cleanMonthData;
  });

  const totalExpenses = expenseData.reduce((acc, curr) => acc + curr.total, 0);
  const thisMonth = expenseData.length ? expenseData[expenseData.length - 1].total : 0;
  
  const lastMonthTotal = expenseData.length > 1 ? expenseData[expenseData.length - 2].total : 0;
  const savings = lastMonthTotal - thisMonth;
  const savingsLabel = savings >= 0 ? `$${savings.toLocaleString()} Saved` : `$${Math.abs(savings).toLocaleString()} More`;
  const savingsChange = lastMonthTotal > 0 ? `${((savings / lastMonthTotal) * 100).toFixed(1)}%` : '0%';

  const largestCategory = categoriesList.length ? categoriesList[0]._id.replace(/_/g, ' ').toUpperCase() : 'N/A';
  const largestCategoryAmount = categoriesList.length ? categoriesList[0].total : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('expenseTracking')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Track system operating expenses from database</p>
        </div>
        <button onClick={fetchStats} className="btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Expenses (YTD)', value: loading ? '...' : `$${totalExpenses.toLocaleString()}`, change: 'Real Data', up: false, icon: DollarSign },
          { label: 'This Month', value: loading ? '...' : `$${thisMonth.toLocaleString()}`, change: 'Real Data', up: false, icon: TrendingUp },
          { label: 'Largest Category', value: loading ? '...' : largestCategory, change: `$${largestCategoryAmount.toLocaleString()}`, up: true, icon: PieChart },
          { label: 'Savings vs Last Mo.', value: loading ? '...' : savingsLabel, change: savingsChange, up: savings >= 0, icon: TrendingDown },
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
        <h2 className="font-semibold mb-4">{t('monthlyExpenses')} by Category (Real Database Data)</h2>
        {loading ? <div className="h-[280px] bg-slate-100 rounded-xl animate-pulse"/> : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={expenseData}>
              <defs>
                {categoriesList.map(c => {
                  const key = c._id;
                  const color = CATEGORY_COLORS[key] || '#94a3b8';
                  return (
                    <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                      <stop offset="95%" stopColor={color} stopOpacity={0}/>
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9"/>
              <XAxis dataKey="month" tick={{ fontSize: 11 }} axisLine={false} tickLine={false}/>
              <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${v.toLocaleString()}`}/>
              <Tooltip formatter={v => [`$${v.toLocaleString()}`, '']}/>
              {categoriesList.map(c => {
                const key = c._id;
                const color = CATEGORY_COLORS[key] || '#94a3b8';
                const name = key.replace(/_/g, ' ').toUpperCase();
                return (
                  <Area key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={2} fill={`url(#grad-${key})`} name={name}/>
                );
              })}
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

export default ExpenseTracking;
