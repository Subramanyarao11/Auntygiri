/**
 * Recommendations Slice
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { Recommendation } from '@shared/types';

interface RecommendationItem {
  id: string;
  title: string;
  description: string;
  content_type: 'course' | 'video' | 'article' | 'tutorial';
  url: string;
  category: string;
  target_standards: number[];
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  source: string;
  trending_score: number;
  is_active: boolean;
  created_at: string;
}

interface TrendingTopic {
  id: string;
  topic_name: string;
  description: string;
  category: string;
  target_standards: number[];
  job_market_demand: 'very_high' | 'high' | 'medium';
  salary_range: string;
  trending_score: number;
  is_active: boolean;
  created_at: string;
}

interface RecommendationsState {
  recommendations: RecommendationItem[];
  trendingTopics: TrendingTopic[];
  userProfile: {
    student_standard: number;
    username: string;
  } | null;
  selectedCategory: string;
  items: Recommendation[]; // Legacy items for compatibility
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: RecommendationsState = {
  recommendations: [],
  trendingTopics: [],
  userProfile: null,
  selectedCategory: 'all',
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

export const fetchRecommendations = createAsyncThunk(
  'recommendations/fetch',
  async (options?: { limit?: number; category?: string }) => {
    return await window.electron.recommendations.getAll(options);
  }
);

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
    setCategory: (state, action: PayloadAction<string>) => {
      state.selectedCategory = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchRecommendations.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });
    builder.addCase(fetchRecommendations.fulfilled, (state, action) => {
      state.isLoading = false;
      state.recommendations = action.payload.recommendations || [];
      state.trendingTopics = action.payload.trendingTopics || [];
      state.userProfile = action.payload.userProfile || null;
      // Keep legacy items for compatibility
      state.items = [];
      state.unreadCount = 0;
    });
    builder.addCase(fetchRecommendations.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.error.message || 'Failed to load recommendations';
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

export const { addRecommendation, setCategory } = recommendationsSlice.actions;
export default recommendationsSlice.reducer;
export type { RecommendationItem, TrendingTopic };

