import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { getMyProfile } from '../services/api';
import { useStore } from '../store/useStore';
import { ShieldAlert, LogOut } from 'lucide-react';

const Layout = () => {
  const logout = useStore((s) => s.logout);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockedReason, setBlockedReason] = useState('');

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const res = await getMyProfile();
        if (res.data.status === 'suspended' || res.data.status === 'inactive') {
          setIsBlocked(true);
          setBlockedReason(res.data.status);
        }
      } catch (err) {
        if (err.response?.status === 403) {
          setIsBlocked(true);
          setBlockedReason(err.response.data.status || 'suspended');
        }
      }
    };

    // Check status immediately
    checkStatus();

    // Check status every 5 seconds
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4">
        <div className="card w-full max-w-md bg-white dark:bg-slate-900 border-2 border-red-500/50 shadow-2xl text-center space-y-6 p-8 animate-scale-up">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/30 flex items-center justify-center text-red-600 animate-bounce">
            <ShieldAlert size={36} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              {blockedReason === 'suspended' ? 'Akaunkaaga waa la xanibay!' : 'Akaunkaaga ma firfircoona!'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {blockedReason === 'suspended'
                ? 'Koontadaada waa la xanibay (Suspended). Fadlan la xiriir maamulaha nidaamka si aad u hesho caawimaad.'
                : 'Koontadaada hadda ma firfircoona (Inactive). Fadlan la xiriir maamulaha nidaamka si loo hawlgeliyo.'}
            </p>
          </div>
          <button
            onClick={() => {
              logout();
              window.location.href = '/login';
            }}
            className="btn-danger w-full flex items-center justify-center gap-2 py-3 font-semibold rounded-xl"
          >
            <LogOut size={16} /> Ka Bax (Log Out)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 dark:bg-slate-950">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-6 animate-fade-in">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
