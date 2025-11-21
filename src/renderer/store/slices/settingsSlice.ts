/**
 * Settings Slice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { AppSettings } from '@shared/types';

interface SettingsState {
  settings: AppSettings | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  settings: null,
  isLoading: false,
  error: null,
};

export const fetchSettings = createAsyncThunk('settings/fetch', async () => {
  return await window.electron.settings.getAll();
});

export const updateSettings = createAsyncThunk(
  'settings/update',
  async (settings: Partial<AppSettings>) => {
    return await window.electron.settings.update(settings);
  }
);

export const resetSettings = createAsyncThunk('settings/reset', async () => {
  return await window.electron.settings.reset();
});

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchSettings.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchSettings.fulfilled, (state, action) => {
      state.isLoading = false;
      state.settings = action.payload;
    });
    builder.addCase(updateSettings.fulfilled, (state, action) => {
      state.settings = action.payload;
    });
    builder.addCase(resetSettings.fulfilled, (state, action) => {
      state.settings = action.payload;
    });
  },
});

export default settingsSlice.reducer;

