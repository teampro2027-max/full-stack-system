import React, { useState, useEffect, useCallback } from 'react';
import { CheckCircle, XCircle, Clock, Eye, RefreshCw, AlertTriangle } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getAdminPayments, confirmPayment, rejectPayment } from '../services/api';

const PaymentConfirmations = () => {
  const { t } = useI18n();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPending = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await getAdminPayments({ status: 'pending' });
      setPayments(res.data.payments || []);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load pending payments'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchPending(); }, [fetchPending]);

  const handle = async (id, action) => {
    setActionLoading(id + action);
    try {
      if (action === 'confirm') await confirmPayment(id);
      else await rejectPayment(id);
      fetchPending();
    } catch { alert('Error processing payment'); }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('paymentConfirmations')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {loading ? t('loading') : `${payments.length} pending payment${payments.length !== 1 ? 's' : ''} awaiting review`}
          </p>
        </div>
        <button onClick={fetchPending} className="btn-secondary">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />Refresh
        </button>
      </div>

      {error && <div className="card bg-red-50 dark:bg-red-900/20 border-red-200 text-red-600 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      {!loading && payments.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-16">
          <CheckCircle size={48} className="text-emerald-400 mb-3" />
          <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">All caught up!</p>
          <p className="text-sm text-slate-400 mt-1">No pending payments to confirm.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {loading
            ? [...Array(4)].map((_, i) => <div key={i} className="card h-40 bg-slate-100 dark:bg-slate-800 animate-pulse" />)
            : payments.map(p => (
              <div key={p._id} className="card border-l-4 border-amber-400">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                      {p.userId?.name?.[0] || '?'}
                    </div>
                    <div>
                      <p className="font-semibold">{p.userId?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{p.userId?.phone || p.userId?.email || '—'}</p>
                    </div>
                  </div>
                  <span className="badge badge-warning flex items-center gap-1"><Clock size={11}/>Pending</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Amount</p>
                    <p className="font-bold text-lg text-slate-900 dark:text-white">${p.amount}</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Method</p>
                    <p className="font-semibold capitalize">{p.method || '—'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Bill Category</p>
                    <p className="font-medium capitalize">{p.billId?.category?.replace(/_/g,' ') || '—'}</p>
                  </div>
                  <div className="p-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                    <p className="text-xs text-slate-400">Date</p>
                    <p className="font-medium">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</p>
                  </div>
                </div>

                {p.transactionId && (
                  <p className="text-xs text-slate-400 mb-3 font-mono bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded">
                    TXN: {p.transactionId}
                  </p>
                )}

                <div className="flex gap-2">
                  <button onClick={() => handle(p._id, 'confirm')} disabled={!!actionLoading} className="btn-success flex-1 justify-center">
                    {actionLoading === p._id + 'confirm' ? '...' : <><CheckCircle size={14}/> {t('approve')}</>}
                  </button>
                  <button onClick={() => handle(p._id, 'reject')} disabled={!!actionLoading} className="btn-danger flex-1 justify-center">
                    {actionLoading === p._id + 'reject' ? '...' : <><XCircle size={14}/> {t('reject')}</>}
                  </button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  );
};

export default PaymentConfirmations;
