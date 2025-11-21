/**
 * Monitoring Slice
 * Manages activity monitoring state
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { WindowInfo, ActivityEntry } from '@shared/types';

interface MonitoringState {
  isMonitoring: boolean;
  currentWindow: WindowInfo | null;
  isIdle: boolean;
  recentActivities: ActivityEntry[];
  error: string | null;
}

const initialState: MonitoringState = {
  isMonitoring: false,
  currentWindow: null,
  isIdle: false,
  recentActivities: [],
  error: null,
};

// Async thunks
export const startMonitoring = createAsyncThunk('monitoring/start', async () => {
  await window.electron.monitoring.start();
});

export const stopMonitoring = createAsyncThunk('monitoring/stop', async () => {
  await window.electron.monitoring.stop();
});

export const getCurrentWindow = createAsyncThunk('monitoring/getCurrentWindow', async () => {
  return await window.electron.monitoring.getCurrentWindow();
});

const monitoringSlice = createSlice({
  name: 'monitoring',
  initialState,
  reducers: {
    activityUpdate: (state, action: PayloadAction<ActivityEntry>) => {
      state.recentActivities.unshift(action.payload);
      // Keep only last 50 activities
      if (state.recentActivities.length > 50) {
        state.recentActivities = state.recentActivities.slice(0, 50);
      }
    },
    idleStatusChanged: (state, action: PayloadAction<boolean>) => {
      state.isIdle = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Start monitoring
    builder.addCase(startMonitoring.fulfilled, (state) => {
      state.isMonitoring = true;
      state.error = null;
    });
    builder.addCase(startMonitoring.rejected, (state, action) => {
      state.error = action.error.message || 'Failed to start monitoring';
    });

    // Stop monitoring
    builder.addCase(stopMonitoring.fulfilled, (state) => {
      state.isMonitoring = false;
    });

    // Get current window
    builder.addCase(getCurrentWindow.fulfilled, (state, action) => {
      state.currentWindow = action.payload;
    });
  },
});

export const { activityUpdate, idleStatusChanged, clearError } = monitoringSlice.actions;
export default monitoringSlice.reducer;

