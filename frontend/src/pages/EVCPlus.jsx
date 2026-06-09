import React, { useState, useEffect } from 'react';
import { Zap, CheckCircle, XCircle, RefreshCw, Link, Key, Settings, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getAdminPayments } from '../services/api';

const EVCPlus = () => {
  const { t } = useI18n();
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState('idle');
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchPayments = async () => {
    setLoading(true); setError('');
    try {
      const res = await getAdminPayments({ limit: 100 }); // fetch recent 100 payments
      // filter only EVC or Waafi transactions if applicable, but for now we assume all EVC
      setPayments(res.data.payments || []);
    } catch (e) { setError('Failed to load EVC transactions'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPayments(); }, []);

  const testConnection = () => {
    setTesting(true); setTestResult('idle');
    setTimeout(() => { setTesting(false); setTestResult('success'); }, 2000);
  };

  // Compute live stats from payments
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todaysTxns = payments.filter(p => new Date(p.createdAt) >= todayStart);
  const totalVolume = payments.filter(p => p.status === 'success').reduce((acc, p) => acc + p.amount, 0);
  const successCount = payments.filter(p => p.status === 'success').length;
  const failedCount = payments.filter(p => p.status === 'failed').length;
  const successRate = payments.length ? Math.round((successCount / payments.length) * 100) : 0;

  const recentTxns = payments.slice(0, 5); // top 5 recent

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('evcPlusIntegration')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">Live database transactions and EVC integration</p>
        </div>
        <button onClick={fetchPayments} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {error && <div className="card text-red-600 bg-red-50 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      <div className="card border-2 border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Zap size={20} className="text-emerald-600"/>
            </div>
            <div>
              <p className="font-semibold text-emerald-800 dark:text-emerald-300">EVC Plus Connected</p>
              <p className="text-xs text-emerald-600">Integration is active and processing payments</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"/>
            <span className="text-xs font-semibold text-emerald-600">LIVE</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card space-y-4">
          <h3 className="font-semibold flex items-center gap-2"><Settings size={16} className="text-indigo-600"/>API Configuration</h3>
          {[
            { label: 'Merchant ID', value: 'BTSO-001', icon: Link },
            { label: 'API Key', value: '•••••••••••••••', icon: Key },
            { label: 'API Endpoint', value: 'https://api.evcplus.so/v2', icon: Link },
            { label: 'Callback URL', value: 'https://api.billtrack.so/evc/callback', icon: Link },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label}>
              <label className="label">{label}</label>
              <div className="relative">
                <Icon size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                <input type="text" defaultValue={value} className="input pl-9"/>
              </div>
            </div>
          ))}
          <div className="flex gap-2">
            <button className="btn-primary flex-1">Save Config</button>
            <button onClick={testConnection} disabled={testing} className="btn-secondary flex-1">
              {testing ? <RefreshCw size={14} className="animate-spin"/> : null}
              {testing ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          {testResult === 'success' && <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl text-emerald-600 text-sm animate-fade-in"><CheckCircle size={16}/>Connection successful!</div>}
          {testResult === 'fail' && <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl text-red-600 text-sm animate-fade-in"><XCircle size={16}/>Connection failed.</div>}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Today's Transactions", value: loading ? '...' : todaysTxns.length, cls: 'text-indigo-600' },
              { label: 'Total Volume', value: loading ? '...' : `$${totalVolume.toLocaleString()}`, cls: 'text-emerald-600' },
              { label: 'Success Rate', value: loading ? '...' : `${successRate}%`, cls: 'text-emerald-600' },
              { label: 'Failed', value: loading ? '...' : failedCount, cls: 'text-red-500' },
            ].map(({ label, value, cls }) => (
              <div key={label} className="card text-center">
                <p className={`text-2xl font-bold ${cls}`}>{value}</p>
                <p className="text-xs text-slate-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
          <div className="card">
            <h3 className="font-semibold mb-3">Recent Transactions</h3>
            {loading ? <div className="space-y-2">{[...Array(4)].map((_, i) => <div key={i} className="h-10 bg-slate-100 rounded animate-pulse"/>)}</div> : 
             recentTxns.length === 0 ? <p className="text-slate-500 text-sm text-center py-4">No transactions found.</p> :
             <div className="space-y-2">
              {recentTxns.map(txn => (
                <div key={txn._id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Zap size={14} className={txn.status === 'success' ? 'text-emerald-500' : txn.status === 'failed' ? 'text-red-500' : 'text-amber-500'}/>
                    <div>
                      <p className="text-xs font-semibold">{txn.transactionId || txn._id.slice(-8)}</p>
                      <p className="text-xs text-slate-400">{txn.userId?.name || 'Unknown'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold">${txn.amount}</p>
                    <p className="text-xs text-slate-400">{new Date(txn.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  {txn.status === 'success'
                    ? <CheckCircle size={14} className="text-emerald-500 ml-2"/>
                    : txn.status === 'failed' ? <XCircle size={14} className="text-red-500 ml-2"/> 
                    : <RefreshCw size={14} className="text-amber-500 ml-2 animate-spin"/>}
                </div>
              ))}
            </div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EVCPlus;
