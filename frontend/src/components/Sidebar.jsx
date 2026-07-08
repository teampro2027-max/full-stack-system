import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, Tag, FileText, CreditCard, CheckSquare,
  Bell, BarChart3, TrendingUp, Shield, Globe, Settings, Zap,
  Lock, LogOut, ChevronDown, ChevronRight, X, MessageSquare,
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { useI18n } from '../context/I18nContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const { sidebarOpen, sidebarCollapsed, toggleSidebarCollapsed, setSidebarOpen, logout } = useStore();
  const [expandedGroups, setExpandedGroups] = useState([]);

  const toggleGroup = (label) => {
    setExpandedGroups((prev) =>
      prev.includes(label) ? prev.filter((g) => g !== label) : [...prev, label]
    );
  };

  const navItems = [
    { label: t('dashboard'), icon: LayoutDashboard, path: '/' },
    { label: t('userManagement'), icon: Users, path: '/users' },
    { label: t('billCategories'), icon: Tag, path: '/categories' },
    { label: t('billsManagement'), icon: FileText, path: '/bills' },
    {
      label: t('payments'), icon: CreditCard, children: [
        { label: t('payments'), path: '/payments' },
        { label: t('paymentConfirmations'), path: '/payment-confirmations' },
      ],
    },
    { label: t('reminderManagement'), icon: Bell, path: '/reminders' },
    { label: t('reportsAnalytics'), icon: BarChart3, path: '/reports' },
    { label: t('expenseTracking'), icon: TrendingUp, path: '/expenses' },
    { label: t('supportMessages'), icon: MessageSquare, path: '/support-messages' },
    { label: t('languageSettings'), icon: Globe, path: '/language' },
    { label: t('systemSettings'), icon: Settings, path: '/settings' },
    { label: t('evcPlusIntegration'), icon: Zap, path: '/evc-plus' },
  ];

  const isExpanded = (label) => expandedGroups.includes(label);
  const sidebarWidth = sidebarCollapsed ? 'w-[70px]' : 'w-64';

  return (
    <>
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/30 backdrop-blur-sm md:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <aside className={`fixed top-0 left-0 h-full z-50 flex flex-col bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 transition-all duration-300 ${sidebarWidth} ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} md:relative md:translate-x-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
              <Zap size={18} className="text-white" />
            </div>
            {!sidebarCollapsed && (
              <div>
                <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">BillTrack</p>
                <p className="text-xs text-indigo-500 font-medium leading-tight">Pro Admin</p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={toggleSidebarCollapsed} className="hidden md:flex btn-ghost p-1.5 rounded-lg">
              <ChevronRight size={14} className={`transition-transform ${sidebarCollapsed ? '' : 'rotate-180'}`} />
            </button>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden btn-ghost p-1.5 rounded-lg">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
          {navItems.map((item) =>
            item.children ? (
              <div key={item.label}>
                <button
                  onClick={() => toggleGroup(item.label)}
                  className={`sidebar-link w-full ${isExpanded(item.label) ? 'bg-slate-50 dark:bg-slate-800' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      <ChevronDown size={14} className={`transition-transform ${isExpanded(item.label) ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {isExpanded(item.label) && !sidebarCollapsed && (
                  <div className="ml-6 mt-1 space-y-0.5 border-l border-slate-200 dark:border-slate-700 pl-3">
                    {item.children.map((child) => (
                      <NavLink key={child.path} to={child.path} className={({ isActive }) => `block px-2 py-1.5 text-sm rounded-lg transition-colors ${isActive ? 'text-indigo-600 font-medium' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        {child.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <NavLink key={item.path} to={item.path} title={sidebarCollapsed ? item.label : undefined} className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}>
                <item.icon size={18} className="flex-shrink-0" />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </NavLink>
            )
          )}
        </nav>

        {/* Logout */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="sidebar-link w-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600"
            title={sidebarCollapsed ? t('logout') : undefined}
          >
            <LogOut size={18} className="flex-shrink-0" />
            {!sidebarCollapsed && <span>{t('logout')}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
