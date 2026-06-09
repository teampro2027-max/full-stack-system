import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, MessageSquare, Settings, Search, Sun, Moon,
  ChevronDown, User, LogOut, Globe, Menu, TrendingUp, AlertCircle,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../context/I18nContext';

const notifications = [
  { id: 1, title: 'New bill payment received', time: '2m ago', type: 'success' },
  { id: 2, title: 'Overdue bill: Ahmed Hassan', time: '15m ago', type: 'warning' },
  { id: 3, title: 'System backup completed', time: '1h ago', type: 'info' },
  { id: 4, title: 'Failed payment detected', time: '2h ago', type: 'danger' },
];

const notifColor = { success: 'text-emerald-500', warning: 'text-amber-500', info: 'text-blue-500', danger: 'text-red-500' };

const Topbar = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { theme, toggleTheme, language, setLanguage, toggleSidebar, adminUser, logout } = useStore();
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = adminUser?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AD';

  return (
    <header className="sticky top-0 z-40 h-16 glass border-b border-slate-200 dark:border-slate-700 flex items-center gap-4 px-6">
      <button onClick={toggleSidebar} className="btn-ghost p-2 rounded-xl">
        <Menu size={20} />
      </button>

      <div className="flex-1 max-w-md relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input type="text" placeholder={t('search')} className="input pl-9 py-2 h-9 text-sm" />
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-2">
        <button onClick={() => setLanguage(language === 'en' ? 'so' : 'en')} className="btn-ghost px-3 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium">
          <Globe size={16} />
          <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'SO'}</span>
        </button>

        <button onClick={toggleTheme} className="btn-ghost p-2 rounded-xl">
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button onClick={() => setNotifOpen(!notifOpen)} className="btn-ghost p-2 rounded-xl relative">
            <Bell size={18} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 card shadow-xl animate-fade-in z-50">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{t('notifications')}</h3>
                <span className="badge badge-danger">{notifications.length}</span>
              </div>
              <div className="space-y-2">
                {notifications.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors">
                    <AlertCircle size={16} className={`mt-0.5 flex-shrink-0 ${notifColor[n.type]}`} />
                    <div>
                      <p className="text-xs font-medium">{n.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{n.time}</p>
                    </div>
                  </div>
                ))}
              </div>
              <button className="w-full mt-3 btn-secondary text-xs text-center justify-center">{t('viewAll')}</button>
            </div>
          )}
        </div>

        <button className="btn-ghost p-2 rounded-xl relative">
          <MessageSquare size={18} />
        </button>

        <button className="btn-ghost p-2 rounded-xl">
          <Settings size={18} />
        </button>

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
            <div className="w-8 h-8 rounded-lg gradient-brand flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold leading-tight">{adminUser?.name || 'Admin'}</p>
              <p className="text-xs text-slate-400 leading-tight">Super Admin</p>
            </div>
            <ChevronDown size={14} className="text-slate-400" />
          </button>
          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 card shadow-xl animate-fade-in z-50">
              <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-2">
                <p className="text-sm font-semibold">{adminUser?.name || 'Admin'}</p>
                <p className="text-xs text-slate-400">{adminUser?.email}</p>
              </div>
              {[{ icon: User, label: 'My Profile' }, { icon: Settings, label: 'Settings' }, { icon: TrendingUp, label: 'Analytics' }].map(({ icon: Icon, label }) => (
                <button key={label} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <Icon size={15} className="text-slate-400" />{label}
                </button>
              ))}
              <div className="border-t border-slate-100 dark:border-slate-800 mt-2 pt-2">
                <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                  <LogOut size={15} />{t('logout')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;
