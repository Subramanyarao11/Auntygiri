/**
 * Redux Store Configuration
 * Configures the main Redux store with RTK Query and activity slice
 */

import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import activityReducer from '../features/activity/activitySlice';
import { activityApi } from '../services/api/activityApi';

export const store = configureStore({
  reducer: {
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

export default store;