import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      sidebarOpen: true,
      sidebarCollapsed: false,
      token: null,
      adminUser: null,

      toggleTheme: () =>
        set((state) => {
          const next = state.theme === 'light' ? 'dark' : 'light';
          if (next === 'dark') document.documentElement.classList.add('dark');
          else document.documentElement.classList.remove('dark');
          return { theme: next };
        }),
      setLanguage: (lang) => set({ language: lang }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      toggleSidebarCollapsed: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      setToken: (token) => set({ token }),
      setAdminUser: (adminUser) => set({ adminUser }),
      logout: () => set({ token: null, adminUser: null }),
    }),
    { name: 'billtrack-store' }
  )
);
