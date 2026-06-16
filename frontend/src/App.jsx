import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { I18nProvider } from './context/I18nContext';
import { useStore } from './store/useStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';

import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import BillCategories from './pages/BillCategories';
import BillsManagement from './pages/BillsManagement';
import Payments from './pages/Payments';
import PaymentConfirmations from './pages/PaymentConfirmations';
import ReminderManagement from './pages/ReminderManagement';
import ReportsAnalytics from './pages/ReportsAnalytics';
import ExpenseTracking from './pages/ExpenseTracking';
import SystemSettings from './pages/SystemSettings';
import EVCPlus from './pages/EVCPlus';
import LanguageSettings from './pages/LanguageSettings';

function AppInner() {
  const theme = useStore((s) => s.theme);
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="categories" element={<BillCategories />} />
            <Route path="bills" element={<BillsManagement />} />
            <Route path="payments" element={<Payments />} />
            <Route path="payment-confirmations" element={<PaymentConfirmations />} />
            <Route path="reminders" element={<ReminderManagement />} />
            <Route path="reports" element={<ReportsAnalytics />} />
            <Route path="expenses" element={<ExpenseTracking />} />
            <Route path="language" element={<LanguageSettings />} />
            <Route path="settings" element={<SystemSettings />} />
            <Route path="evc-plus" element={<EVCPlus />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <I18nProvider>
      <AppInner />
    </I18nProvider>
  );
}

export default App;
