import { createSlice, nanoid } from '@reduxjs/toolkit';

const initialState = {
  items: [],
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    pushToast(state, action) {
      const { message, variant = 'info', duration = 4200 } = action.payload;
      state.items.push({ id: nanoid(), message, variant, duration });
    },
    dismissToast(state, action) {
      state.items = state.items.filter((t) => t.id !== action.payload);
    },
  },
});

export const { pushToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;
