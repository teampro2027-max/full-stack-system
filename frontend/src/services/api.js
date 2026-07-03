import axios from 'axios';

const normalizeBaseUrl = (url) => url.replace(/\/+$/, '');

const getDefaultBaseUrl = () => 'https://full-stack-system-1ex6.onrender.com/api';

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_URL || getDefaultBaseUrl());

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Inject JWT token on every request
api.interceptors.request.use((config) => {
  try {
    const stored = localStorage.getItem('billtrack-store');
    if (stored) {
      const parsed = JSON.parse(stored);
      const token = parsed?.state?.token;
      if (token) config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (_) {}
  return config;
});

// Auto-retry on network errors (handles Render cold starts & ERR_NETWORK_CHANGED)
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    config.__retryCount = config.__retryCount || 0;
    const isNetworkError = !error.response && (
      error.code === 'ERR_NETWORK' ||
      error.code === 'ECONNABORTED' ||
      error.message?.includes('Network Error') ||
      error.message?.includes('ERR_NETWORK_CHANGED') ||
      error.message?.includes('timeout')
    );

    if (isNetworkError && config.__retryCount < 2) {
      config.__retryCount += 1;
      console.log(`Retrying request (${config.__retryCount}/2): ${config.url}`);
      await new Promise((r) => setTimeout(r, 2000));
      return api(config);
    }

    return Promise.reject(error);
  }
);

// Auth
export const loginAdmin = (email, password) =>
  api.post('/auth/login', { email, password });

// Dashboard
export const getDashboardStats = () => api.get('/admin/stats');

// Users
export const getAdminUsers = (params) => api.get('/admin/users', { params });
export const createAdminUser = (data) => api.post('/admin/users', data);
export const updateAdminUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const deleteAdminUser = (id) => api.delete(`/admin/users/${id}`);

// Bills
export const getAdminBills = (params) => api.get('/admin/bills', { params });
export const createAdminBill = (data) => api.post('/admin/bills', data);
export const updateAdminBill = (id, data) => api.put(`/admin/bills/${id}`, data);
export const deleteAdminBill = (id) => api.delete(`/admin/bills/${id}`);

// Payments
export const getAdminPayments = (params) => api.get('/admin/payments', { params });
export const confirmPayment = (id) => api.put(`/admin/payments/${id}/confirm`);
export const rejectPayment = (id) => api.put(`/admin/payments/${id}/reject`);

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

export default api;
