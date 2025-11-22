/**
 * Redux Store Configuration
 * Configures the main Redux store with RTK Query and activity slice
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import activityReducer from '../features/activity/activitySlice';
import { activityApi } from '../services/api/activityApi';
import authReducer from './slices/authSlice';
import monitoringReducer from './slices/monitoringSlice';
import recommendationsReducer from './slices/recommendationsSlice';
import settingsReducer from './slices/settingsSlice';
import focusReducer from './slices/focusSlice';
import syncReducer from './slices/syncSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    monitoring: monitoringReducer,
    recommendations: recommendationsReducer,
    settings: settingsReducer,
    focus: focusReducer,
    sync: syncReducer,
    ui: uiReducer,
    activity: activityReducer,
    [activityApi.reducerPath]: activityApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          // Ignore these action types
          'persist/PERSIST',
          'persist/REHYDRATE',
          'persist/REGISTER',
        ],
      },
    }).concat(activityApi.middleware),
  devTools: process.env.NODE_ENV !== 'production',
});

// Setup listeners for RTK Query
setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Export hooks
export { useAppDispatch, useAppSelector } from './hooks';

export default store;
