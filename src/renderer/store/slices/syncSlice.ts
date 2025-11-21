/**
 * Sync Slice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { SyncState } from '@shared/types';

interface SyncSliceState {
  syncState: SyncState | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: SyncSliceState = {
  syncState: null,
  isLoading: false,
  error: null,
};

export const startSync = createAsyncThunk('sync/start', async () => {
  await window.electron.sync.start();
});

export const fetchSyncStatus = createAsyncThunk('sync/status', async () => {
  return await window.electron.sync.getStatus();
});

export const retrySync = createAsyncThunk('sync/retry', async () => {
  await window.electron.sync.retry();
});

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(fetchSyncStatus.fulfilled, (state, action) => {
      state.syncState = action.payload;
    });
    builder.addCase(startSync.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(startSync.fulfilled, (state) => {
      state.isLoading = false;
    });
    builder.addCase(startSync.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Sync failed';
    });
  },
});

export default syncSlice.reducer;

