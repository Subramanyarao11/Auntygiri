/**
 * Redux Store Configuration
 * Configures the Redux store with all slices and middleware
 */

import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';

// Import slices
import authReducer from './slices/authSlice';
import monitoringReducer from './slices/monitoringSlice';
import activityReducer from './slices/activitySlice';
import recommendationsReducer from './slices/recommendationsSlice';
import settingsReducer from './slices/settingsSlice';
import uiReducer from './slices/uiSlice';
import focusReducer from './slices/focusSlice';
import syncReducer from './slices/syncSlice';

// Import API
import { api } from './api';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    monitoring: monitoringReducer,
    activity: activityReducer,
    recommendations: recommendationsReducer,
    settings: settingsReducer,
    ui: uiReducer,
    focus: focusReducer,
    sync: syncReducer,
    [api.reducerPath]: api.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['monitoring/activityUpdate'],
      },
    }).concat(api.middleware),
});

// Export types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export typed hooks
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

