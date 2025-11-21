/**
 * Focus Mode Slice
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import type { FocusSession } from '@shared/types';

interface FocusState {
  activeSession: FocusSession | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: FocusState = {
  activeSession: null,
  isLoading: false,
  error: null,
};

export const startFocusSession = createAsyncThunk(
  'focus/start',
  async (duration: number) => {
    return await window.electron.focus.startSession(duration);
  }
);

export const pauseFocusSession = createAsyncThunk('focus/pause', async () => {
  await window.electron.focus.pauseSession();
});

export const resumeFocusSession = createAsyncThunk('focus/resume', async () => {
  await window.electron.focus.resumeSession();
});

export const endFocusSession = createAsyncThunk('focus/end', async () => {
  return await window.electron.focus.endSession();
});

export const fetchActiveSession = createAsyncThunk('focus/fetchActive', async () => {
  return await window.electron.focus.getActiveSession();
});

const focusSlice = createSlice({
  name: 'focus',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase(startFocusSession.fulfilled, (state, action) => {
      state.activeSession = action.payload;
    });
    builder.addCase(endFocusSession.fulfilled, (state) => {
      state.activeSession = null;
    });
    builder.addCase(fetchActiveSession.fulfilled, (state, action) => {
      state.activeSession = action.payload;
    });
  },
});

export default focusSlice.reducer;

