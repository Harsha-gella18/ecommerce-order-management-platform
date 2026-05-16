import { configureStore } from '@reduxjs/toolkit';
import uiReducer from './slices/uiSlice';
import toastReducer from './slices/toastSlice';

export const store = configureStore({
  reducer: {
    ui: uiReducer,
    toast: toastReducer,
  },
});
