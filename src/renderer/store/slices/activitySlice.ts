/**
 * Activity Slice
 * Manages activity history and logs
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { ActivityEntry } from '@shared/types';

interface ActivityState {
  activities: ActivityEntry[];
  isLoading: boolean;
  error: string | null;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const initialState: ActivityState = {
  activities: [],
  isLoading: false,
  error: null,
  dateRange: {
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  },
};

// Async thunks
export const fetchActivities = createAsyncThunk(
  'activity/fetchActivities',
  async ({ startDate, endDate }: { startDate: string; endDate: string }) => {
    return await window.electron.monitoring.getActivityLog(startDate, endDate);
  }
);

const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearActivities: (state) => {
      state.activities = [];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchActivities.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchActivities.fulfilled, (state, action) => {
      state.isLoading = false;
      state.activities = action.payload;
    });
    builder.addCase(fetchActivities.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to fetch activities';
    });
  },
});

export const { setDateRange, clearActivities } = activitySlice.actions;
export default activitySlice.reducer;

