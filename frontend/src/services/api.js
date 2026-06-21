import axios from 'axios';

const api = axios.create({
  baseURL: 'https://full-stack-system-b6pw.onrender.com/api',
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
