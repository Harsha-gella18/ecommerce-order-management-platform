import { createSlice } from '@reduxjs/toolkit';

const getInitialTheme = () => {
  if (typeof localStorage === 'undefined') return 'light';
  const stored = localStorage.getItem('ecom_theme');
  if (stored === 'dark' || stored === 'light') return stored;
  if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

const initialState = {
  theme: getInitialTheme(),
  sidebarOpen: false,
  adminSidebarCollapsed: false,
  globalLoading: false,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleTheme(state) {
      state.theme = state.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem('ecom_theme', state.theme);
    },
    setTheme(state, action) {
      state.theme = action.payload;
      localStorage.setItem('ecom_theme', state.theme);
    },
    setSidebarOpen(state, action) {
      state.sidebarOpen = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleAdminSidebarCollapsed(state) {
      state.adminSidebarCollapsed = !state.adminSidebarCollapsed;
    },
    setGlobalLoading(state, action) {
      state.globalLoading = action.payload;
    },
  },
});

export const {
  toggleTheme,
  setTheme,
  setSidebarOpen,
  toggleSidebar,
  toggleAdminSidebarCollapsed,
  setGlobalLoading,
} = uiSlice.actions;
export default uiSlice.reducer;
