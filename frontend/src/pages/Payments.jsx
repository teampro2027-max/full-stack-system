import React, { useState, useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Zap } from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getAdminPayments, confirmPayment, rejectPayment } from '../services/api';

const STATUS_COLORS = { success: 'badge-success', failed: 'badge-danger', pending: 'badge-warning' };
const METHOD_ICON = { EVC: '⚡', WAAFI: '📱', STRIPE: '💳', CASH: '💵' };

const Payments = () => {
  const { t } = useI18n();
  const [payments, setPayments] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  const fetchPayments = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const params = {};
      if (filterStatus !== 'all') params.status = filterStatus;
      const res = await getAdminPayments(params);
      setPayments(res.data.payments || []);
      setTotal(res.data.total || 0);
    } catch (e) { setError(e.response?.data?.message || 'Failed to load payments'); }
    finally { setLoading(false); }
  }, [filterStatus]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const handleConfirm = async (id) => {
    setActionLoading(id);
    try { await confirmPayment(id); fetchPayments(); } catch { alert('Error confirming'); }
    setActionLoading(null);
  };

  const handleReject = async (id) => {
    setActionLoading(id);
    try { await rejectPayment(id); fetchPayments(); } catch { alert('Error rejecting'); }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{t('payments')}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{loading ? t('loading') : `${total} transactions in database`}</p>
        </div>
        <button onClick={fetchPayments} className="btn-secondary"><RefreshCw size={15} className={loading ? 'animate-spin' : ''}/>Refresh</button>
      </div>

      {error && <div className="card border-red-200 bg-red-50 dark:bg-red-900/20 text-red-600 text-sm flex items-center gap-2"><AlertTriangle size={16}/>{error}</div>}

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all','success','pending','failed'].map(s => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`badge capitalize cursor-pointer text-sm px-3 py-1.5 ${filterStatus === s ? 'bg-indigo-600 text-white' : STATUS_COLORS[s] || 'bg-slate-100 dark:bg-slate-800 text-slate-600'}`}>{s}</button>
        ))}
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="table-wrapper border-0">
          <table>
            <thead>
              <tr>
                <th>{t('transactionId')}</th>
                <th>{t('user')}</th>
                <th>Bill</th>
                <th>{t('amount')}</th>
                <th>{t('paymentMethod')}</th>
                <th>{t('status')}</th>
                <th>{t('date')}</th>
                <th>{t('actions')}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i}>{[...Array(8)].map((_, j) => <td key={j}><div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse"/></td>)}</tr>
                ))
              ) : payments.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-10 text-slate-400">{t('noData')}</td></tr>
              ) : payments.map(p => (
                <tr key={p._id}>
                  <td><span className="font-mono text-xs bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{p.transactionId || p._id?.slice(-8)}</span></td>
                  <td>
                    <div className="font-medium">{p.userId?.name || '—'}</div>
                    <div className="text-xs text-slate-400">{p.userId?.phone || ''}</div>
                  </td>
                  <td className="text-sm capitalize text-slate-500">{p.billId?.category?.replace(/_/g,' ') || '—'}</td>
                  <td className="font-bold text-slate-900 dark:text-white">${p.amount}</td>
                  <td>
                    <span className="flex items-center gap-1 text-sm">
                      <span>{METHOD_ICON[p.method] || '💰'}</span>
                      <span>{p.method || '—'}</span>
                    </span>
                  </td>
                  <td><span className={`badge ${STATUS_COLORS[p.status]} capitalize`}>{p.status}</span></td>
                  <td className="text-xs text-slate-400">{p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}</td>
                  <td>
                    {p.status === 'pending' ? (
                      <div className="flex gap-1">
                        <button onClick={() => handleConfirm(p._id)} disabled={actionLoading === p._id} className="btn-success text-xs px-2 py-1">
                          <CheckCircle size={12}/> {actionLoading === p._id ? '...' : 'Confirm'}
                        </button>
                        <button onClick={() => handleReject(p._id)} disabled={actionLoading === p._id} className="btn-danger text-xs px-2 py-1">
                          <XCircle size={12}/> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        {p.status === 'success' ? <CheckCircle size={12} className="text-emerald-500"/> : <XCircle size={12} className="text-red-400"/>}
                        {p.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Payments;
