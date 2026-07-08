import React, { useState, useEffect, useCallback } from 'react';
import {
  MessageSquare, Send, CheckCircle, Clock, Search, AlertCircle, Megaphone,
  User, Mail, Phone, Calendar, RefreshCw, ChevronRight, CornerDownRight, Check
} from 'lucide-react';
import { useI18n } from '../context/I18nContext';
import { getSupportMessages, replySupportMessage, broadcastNotification } from '../services/api';

const SupportMessages = () => {
  const { t } = useI18n();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Broadcast state
  const [broadcastTitle, setBroadcastTitle] = useState('');
  const [broadcastBody, setBroadcastBody] = useState('');
  const [submittingBroadcast, setSubmittingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState('');
  const [broadcastError, setBroadcastError] = useState('');

  // Active tab
  const [activeTab, setActiveTab] = useState('support'); // 'support' or 'broadcast'

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await getSupportMessages();
      const data = res.data || [];
      setMessages(data);
      // Auto select the first message if none selected
      if (data.length > 0 && !selectedMessage) {
        setSelectedMessage(data[0]);
      } else if (selectedMessage) {
        // Sync selected message with latest data
        const updated = data.find(m => m._id === selectedMessage._id);
        if (updated) setSelectedMessage(updated);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load support messages');
    } finally {
      setLoading(false);
    }
  }, [selectedMessage]);

  useEffect(() => {
    fetchMessages();
  }, []);

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedMessage) return;

    setSubmittingReply(true);
    setError('');
    setSuccess('');
    try {
      await replySupportMessage(selectedMessage._id, replyText);
      setSuccess('Reply sent successfully!');
      setReplyText('');
      // Refresh messages
      await fetchMessages();
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleBroadcastSubmit = async (e) => {
    e.preventDefault();
    if (!broadcastBody.trim()) {
      setBroadcastError('Fariintu waa muhiim (Message is required)');
      return;
    }

    setSubmittingBroadcast(true);
    setBroadcastError('');
    setBroadcastSuccess('');
    try {
      const res = await broadcastNotification({
        title: broadcastTitle.trim() || undefined,
        body: broadcastBody.trim()
      });
      setBroadcastSuccess(`Announcement broadcasted to ${res.data?.recipientCount || 0} customers!`);
      setBroadcastTitle('');
      setBroadcastBody('');
    } catch (e) {
      setBroadcastError(e.response?.data?.message || 'Failed to broadcast announcement');
    } finally {
      setSubmittingBroadcast(false);
    }
  };

  // Filter messages
  const filteredMessages = messages.filter(m => {
    const matchesSearch =
      m.userId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      m.userId?.email?.toLowerCase().includes(search.toLowerCase()) ||
      m.userId?.phone?.includes(search) ||
      m.message?.toLowerCase().includes(search.toLowerCase());
    
    if (filterStatus === 'all') return matchesSearch;
    return m.status === filterStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {activeTab === 'support' ? t('supportMessages') : t('broadcastAnnouncement')}
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {activeTab === 'support' 
              ? 'Maaree wadahadalka iyo caawinaada macaamiisha' 
              : 'U dir ogeysiis guud dhamaan macaamiisha nidaamka'
            }
          </p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('support')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'support' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <MessageSquare size={16} />
            {t('supportMessages')}
          </button>
          <button 
            onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              activeTab === 'broadcast' 
                ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-white shadow-sm' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Megaphone size={16} />
            {t('broadcastAnnouncement')}
          </button>
        </div>
      </div>

      {activeTab === 'support' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Tickets List */}
          <div className="lg:col-span-1 flex flex-col space-y-4">
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-slate-950 dark:text-white">Inbox</h2>
                <button onClick={fetchMessages} className="btn-ghost p-1.5 rounded-lg text-slate-500 hover:text-slate-800" title="Refresh">
                  <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>

              {/* Search and Filters */}
              <div className="relative">
                <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Raadi fariin ama macmiil..."
                  className="input pl-9 w-full text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex gap-2">
                {['all', 'pending', 'resolved'].map(status => (
                  <button
                    key={status}
                    onClick={() => setFilterStatus(status)}
                    className={`px-3 py-1 text-xs font-medium rounded-full border transition-all ${
                      filterStatus === status
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    {status === 'all' ? 'Dhamaan' : status === 'pending' ? 'Sugaya (Pending)' : 'La xaliyey'}
                  </button>
                ))}
              </div>
            </div>

            {/* List of Messages */}
            <div className="card p-0 overflow-y-auto max-h-[500px] divide-y divide-slate-100 dark:divide-slate-800">
              {loading && messages.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <RefreshCw size={24} className="animate-spin mx-auto mb-2 text-indigo-500" />
                  Waa la rarayaa...
                </div>
              ) : filteredMessages.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  <MessageSquare size={32} className="mx-auto mb-2 text-slate-300" />
                  Wax fariin ah lama helin
                </div>
              ) : (
                filteredMessages.map(msg => (
                  <div
                    key={msg._id}
                    onClick={() => {
                      setSelectedMessage(msg);
                      setReplyText('');
                      setSuccess('');
                      setError('');
                    }}
                    className={`p-4 cursor-pointer transition-all hover:bg-slate-50 dark:hover:bg-slate-800/50 flex flex-col gap-2 ${
                      selectedMessage?._id === msg._id 
                        ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-l-4 border-indigo-600' 
                        : ''
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-semibold text-slate-900 dark:text-white text-sm truncate max-w-[150px]">
                        {msg.userId?.name || 'Macaamil'}
                      </h4>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        msg.status === 'pending' 
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' 
                          : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      }`}>
                        {msg.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-2 dark:text-slate-400">{msg.message}</p>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                      <span className="capitalize">{msg.type}</span>
                      <span>{new Date(msg.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation Detail */}
          <div className="lg:col-span-2">
            {selectedMessage ? (
              <div className="card space-y-6">
                {/* User Info Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                      {selectedMessage.userId?.name?.substring(0, 2).toUpperCase() || 'US'}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-base">
                        {selectedMessage.userId?.name}
                      </h3>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 mt-0.5">
                        <span className="flex items-center gap-1"><Mail size={12} /> {selectedMessage.userId?.email}</span>
                        {selectedMessage.userId?.phone && <span className="flex items-center gap-1"><Phone size={12} /> {selectedMessage.userId?.phone}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400 flex items-center gap-1">
                    <Calendar size={12} />
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="space-y-4">
                  {/* Customer Message bubble */}
                  <div className="flex flex-col gap-1 max-w-[85%] bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase flex items-center gap-1">
                      <User size={10} /> Macaamilka (Customer)
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap mt-1">
                      {selectedMessage.message}
                    </p>
                  </div>

                  {/* Admin Reply bubble if exists */}
                  {selectedMessage.reply && (
                    <div className="flex flex-col gap-1 max-w-[85%] ml-auto bg-indigo-50 dark:bg-indigo-950/20 p-4 rounded-2xl rounded-tr-none border border-indigo-100 dark:border-indigo-900/40">
                      <span className="text-[10px] font-semibold text-indigo-600 dark:text-indigo-400 uppercase flex items-center gap-1">
                        <Check size={10} /> Jawaabtaada (Admin)
                      </span>
                      <p className="text-slate-800 dark:text-slate-200 text-sm whitespace-pre-wrap mt-1">
                        {selectedMessage.reply}
                      </p>
                      {selectedMessage.replyDate && (
                        <span className="text-[9px] text-slate-400 text-right mt-1 block">
                          {new Date(selectedMessage.replyDate).toLocaleString()}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Notifications & Feedback */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100 dark:border-red-900/30">
                    <AlertCircle size={16} />
                    {error}
                  </div>
                )}
                {success && (
                  <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg flex items-center gap-2 text-sm border border-green-100 dark:border-green-900/30">
                    <CheckCircle size={16} />
                    {success}
                  </div>
                )}

                {/* Reply Form */}
                {selectedMessage.status === 'pending' ? (
                  <form onSubmit={handleReplySubmit} className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                        Ku qor Jawaabtaada halkan:
                      </label>
                      <textarea
                        rows={4}
                        placeholder="Ku qor jawaab taageero ah macaamilka..."
                        className="input w-full text-sm resize-none"
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        required
                      />
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingReply || !replyText.trim()}
                        className="btn-primary px-5 py-2.5 rounded-xl flex items-center gap-2"
                      >
                        <Send size={15} />
                        {submittingReply ? 'Waa la dirayaa...' : 'Dir Jawaabta'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center gap-3 border border-slate-200 dark:border-slate-700">
                    <CheckCircle className="text-green-500" size={18} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      Shaqadan waa la xaliyey (Resolved).
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="card flex flex-col items-center justify-center py-20 text-slate-400">
                <MessageSquare size={48} className="text-slate-300 mb-4" />
                <p className="text-base font-semibold">Dooro fariin si aad u maamusho</p>
                <p className="text-xs mt-1 text-slate-500">Inbox-ga bidix ka xulo caawinaada kugu haboon.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Broadcast Announcements Tab */
        <div className="max-w-2xl mx-auto">
          <div className="card space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                <Megaphone size={18} />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-base">
                  Baahin Fariin Cusub (Broadcast Announcement)
                </h3>
                <p className="text-xs text-slate-500">
                  Ogeysiiskaan wuxuu toos ugu tagayaa dhamaan macaamiisha nidaamka. Waxaa lagu keydin doonaa liiskooda ogeysiiska app-ka.
                </p>
              </div>
            </div>

            {broadcastError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg flex items-center gap-2 text-sm border border-red-100 dark:border-red-900/30 animate-shake">
                <AlertCircle size={16} />
                {broadcastError}
              </div>
            )}
            {broadcastSuccess && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 text-green-600 rounded-lg flex items-center gap-2 text-sm border border-green-100 dark:border-green-900/30">
                <CheckCircle size={16} />
                {broadcastSuccess}
              </div>
            )}

            <form onSubmit={handleBroadcastSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Cinwaanka Ogeysiiska (Title) - Optional
                </label>
                <input
                  type="text"
                  placeholder="Hadii aad rabto gali cinwaan (tusaale: Adeeg Dheeraad ah)"
                  className="input w-full text-sm"
                  value={broadcastTitle}
                  onChange={e => setBroadcastTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Fariinta Ogeysiiska (Message Body) - Required
                </label>
                <textarea
                  rows={6}
                  placeholder="Qor fariinta aad rabto in aad gaarsiiso macaamiisha oo dhan..."
                  className="input w-full text-sm"
                  value={broadcastBody}
                  onChange={e => setBroadcastBody(e.target.value)}
                  required
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submittingBroadcast || !broadcastBody.trim()}
                  className="btn-primary px-6 py-2.5 rounded-xl flex items-center gap-2 font-medium"
                >
                  <Send size={15} />
                  {submittingBroadcast ? 'Waa la baahinayaa...' : 'Baahi Ogeysiiska'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportMessages;
