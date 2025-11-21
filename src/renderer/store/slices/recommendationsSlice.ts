/**
 * Recommendations Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Recommendation } from '@shared/types';

interface RecommendationsState {
  items: Recommendation[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: RecommendationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchRecommendations = createAsyncThunk('recommendations/fetch', async () => {
  return await window.electron.recommendations.getAll();
});

export const markAsRead = createAsyncThunk('recommendations/markRead', async (id: string) => {
  await window.electron.recommendations.markRead(id);
  return id;
});

export const dismissRecommendation = createAsyncThunk('recommendations/dismiss', async (id: string) => {
  await window.electron.recommendations.dismiss(id);
  return id;
});

const recommendationsSlice = createSlice({
  name: 'recommendations',
  initialState,
  reducers: {
    addRecommendation: (state, action: PayloadAction<Recommendation>) => {
      state.items.unshift(action.payload);
      if (!action.payload.read) {
        state.unreadCount++;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRecommendations.pending, (state) => {
      state.isLoading = true;
    });
    builder.addCase(fetchRecommendations.fulfilled, (state, action) => {
      state.isLoading = false;
      state.items = action.payload;
      state.unreadCount = action.payload.filter((r: Recommendation) => !r.read).length;
    });
    builder.addCase(markAsRead.fulfilled, (state, action) => {
      const item = state.items.find(r => r.id === action.payload);
      if (item && !item.read) {
        item.read = true;
        state.unreadCount--;
      }
    });
    builder.addCase(dismissRecommendation.fulfilled, (state, action) => {
      state.items = state.items.filter(r => r.id !== action.payload);
    });
  },
});

export const { addRecommendation } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;

