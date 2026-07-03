import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';
import { loginAdmin } from '../services/api';
import { useStore } from '../store/useStore';

const Login = () => {
  const navigate = useNavigate();
  const { setToken, setAdminUser, theme, toggleTheme } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await loginAdmin(email, password);
      const { token, name, email: userEmail, role, _id } = res.data;
      if (role !== 'admin') {
        setError('Access denied. Admin accounts only.');
        setLoading(false);
        return;
      }
      setToken(token);
      setAdminUser({ _id, name, email: userEmail, role });
      navigate('/');
    } catch (err) {
      if (!err.response) {
        setError('Server-ku wuu kacayaa (Render cold start). Fadlan dib u isku day 30 ilbiriqsi ka dib. / Server is waking up, please retry in 30 seconds.');
      } else {
        setError(err.response?.data?.message || 'Invalid email or password');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-200 dark:bg-indigo-900 rounded-full blur-3xl opacity-30" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-200 dark:bg-purple-900 rounded-full blur-3xl opacity-30" />
      </div>

      <div className="relative w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="inline-flex w-16 h-16 rounded-2xl gradient-brand items-center justify-center shadow-lg mb-4">
            <Zap size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">BillTrack Pro</h1>
          <p className="text-slate-500 mt-1 text-sm">Admin Dashboard – Sign in to continue</p>
          <p className="text-slate-400 text-xs mt-0.5">Nidaamka Maaraynta Biilasha</p>
        </div>

        <div className="card shadow-xl">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900 rounded-xl text-red-600 text-sm animate-fade-in">
                <AlertCircle size={16} className="flex-shrink-0" />{error}
              </div>
            )}
            <div>
              <label className="label">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email Address" className="input pl-9" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type={showPass ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="input pl-9 pr-9" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded accent-indigo-600" />
                <span className="text-slate-600 dark:text-slate-400">Remember me</span>
              </label>
              <button type="button" className="text-indigo-600 hover:underline font-medium">Forgot password?</button>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3 text-base">
              {loading && <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {loading ? 'Signing in...' : 'Sign In to Admin Panel'}
            </button>
          </form>
        </div>

        <div className="flex justify-center mt-4">
          <button onClick={toggleTheme} className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            {theme === 'dark' ? ' Light Mode' : ' Dark Mode'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
