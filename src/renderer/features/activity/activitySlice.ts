/**
 * Activity Redux Slice
 * Manages real-time activity monitoring state in the renderer process
 */

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { 
  ActivityEvent,
  WindowActivity,
  BrowserActivity,
  IdleActivity,
  FocusActivity,
  ProductivityActivity,
  ActivityState,
  FocusSession,
  ActivitySummary,
  ActivityStream,
  WindowEventPayload,
  BrowserEventPayload,
  IdleEventPayload,
  FocusEventPayload,
  ProductivityEventPayload
} from '../../../shared/types/activity';

// State interface
export interface ActivitySliceState {
  // Current activity stream
  stream: ActivityStream;
  
  // Event history (limited to recent events for performance)
  recentEvents: ActivityEvent[];
  maxRecentEvents: number;
  
  // Tracking status
  isWindowTrackingActive: boolean;
  isBrowserTrackingActive: boolean;
  isIdleMonitorActive: boolean;
  
  // Current state
  currentWindow: WindowActivity | null;
  currentBrowser: BrowserActivity | null;
  currentState: ActivityState;
  currentFocusSession: FocusSession | null;
  
  // Statistics
  appTimeMap: Record<string, number>;
  domainTimeMap: Record<string, number>;
  productivityStats: {
    productiveTime: number;
    unproductiveTime: number;
    neutralTime: number;
    score: number;
    totalTime: number;
  };
  
  // Daily summary
  todaysSummary: ActivitySummary;
  
  // UI state
  isLoading: boolean;
  error: string | null;
  lastUpdate: number;
}

// Initial state
const initialState: ActivitySliceState = {
  stream: {
    currentState: ActivityState.STOPPED,
    todaysSummary: {
      date: new Date().toISOString().split('T')[0],
      totalActiveTime: 0,
      totalIdleTime: 0,
      productiveTime: 0,
      unproductiveTime: 0,
      productivityScore: 0,
      topApps: [],
      topDomains: [],
      focusSessions: []
    },
    isTracking: false,
    lastUpdate: Date.now()
  },
  recentEvents: [],
  maxRecentEvents: 1000,
  isWindowTrackingActive: false,
  isBrowserTrackingActive: false,
  isIdleMonitorActive: false,
  currentWindow: null,
  currentBrowser: null,
  currentState: ActivityState.STOPPED,
  currentFocusSession: null,
  appTimeMap: {},
  domainTimeMap: {},
  productivityStats: {
    productiveTime: 0,
    unproductiveTime: 0,
    neutralTime: 0,
    score: 0,
    totalTime: 0
  },
  todaysSummary: {
    date: new Date().toISOString().split('T')[0],
    totalActiveTime: 0,
    totalIdleTime: 0,
    productiveTime: 0,
    unproductiveTime: 0,
    productivityScore: 0,
    topApps: [],
    topDomains: [],
    focusSessions: []
  },
  isLoading: false,
  error: null,
  lastUpdate: Date.now()
};

// Async thunks for IPC communication
export const startWindowTracking = createAsyncThunk(
  'activity/startWindowTracking',
  async (intervalMs: number = 10000) => {
    const result = await window.monitoring.startWindowTracking(intervalMs);
    return { success: result, intervalMs };
  }
);

export const stopWindowTracking = createAsyncThunk(
  'activity/stopWindowTracking',
  async () => {
    const result = await window.monitoring.stopWindowTracking();
    return { success: result };
  }
);

export const startBrowserTracking = createAsyncThunk(
  'activity/startBrowserTracking',
  async (intervalMs: number = 10000) => {
    const result = await window.monitoring.startBrowserTracking(intervalMs);
    return { success: result, intervalMs };
  }
);

export const stopBrowserTracking = createAsyncThunk(
  'activity/stopBrowserTracking',
  async () => {
    const result = await window.monitoring.stopBrowserTracking();
    return { success: result };
  }
);

export const startIdleMonitor = createAsyncThunk(
  'activity/startIdleMonitor',
  async (idleThresholdSeconds: number = 60) => {
    const result = await window.monitoring.startIdleMonitor(idleThresholdSeconds);
    return { success: result, idleThresholdSeconds };
  }
);

export const stopIdleMonitor = createAsyncThunk(
  'activity/stopIdleMonitor',
  async () => {
    const result = await window.monitoring.stopIdleMonitor();
    return { success: result };
  }
);

export const startFocusSession = createAsyncThunk(
  'activity/startFocusSession',
  async ({ targetDurationSeconds, sessionType }: { targetDurationSeconds: number; sessionType?: string }) => {
    const sessionId = await window.monitoring.startFocusSession(targetDurationSeconds, sessionType);
    const session = await window.monitoring.getCurrentFocusSession();
    return { sessionId, session };
  }
);

export const endFocusSession = createAsyncThunk(
  'activity/endFocusSession',
  async (reason: 'completed' | 'cancelled' | 'interrupted' = 'completed') => {
    const session = await window.monitoring.endFocusSession(reason);
    return { session, reason };
  }
);

export const pauseFocusSession = createAsyncThunk(
  'activity/pauseFocusSession',
  async (reason: 'idle' | 'manual' | 'distraction' = 'manual') => {
    const result = await window.monitoring.pauseFocusSession(reason);
    const session = await window.monitoring.getCurrentFocusSession();
    return { success: result, session, reason };
  }
);

export const resumeFocusSession = createAsyncThunk(
  'activity/resumeFocusSession',
  async () => {
    const result = await window.monitoring.resumeFocusSession();
    const session = await window.monitoring.getCurrentFocusSession();
    return { success: result, session };
  }
);

export const fetchCurrentState = createAsyncThunk(
  'activity/fetchCurrentState',
  async () => {
    const [windowState, browserState, idleState, productivityStats, focusSession] = await Promise.all([
      window.monitoring.getWindowTrackingState(),
      window.monitoring.getBrowserTrackingState(),
      window.monitoring.getIdleState(),
      window.monitoring.getProductivityStats(),
      window.monitoring.getCurrentFocusSession()
    ]);

    return {
      windowState,
      browserState,
      idleState,
      productivityStats,
      focusSession
    };
  }
);

export const resetTrackingData = createAsyncThunk(
  'activity/resetTrackingData',
  async () => {
    const result = await window.monitoring.resetTrackingData();
    return { success: result };
  }
);

// Create the slice
const activitySlice = createSlice({
  name: 'activity',
  initialState,
  reducers: {
    // Event handlers for real-time updates
    setWindowEvent: (state, action: PayloadAction<WindowEventPayload>) => {
      const { event, summary } = action.payload;
      
      state.currentWindow = event;
      state.appTimeMap = summary.appTimeMap;
      state.lastUpdate = Date.now();
      
      // Add to recent events
      state.recentEvents.unshift(event);
      if (state.recentEvents.length > state.maxRecentEvents) {
        state.recentEvents = state.recentEvents.slice(0, state.maxRecentEvents);
      }
      
      // Update stream
      state.stream.currentWindow = event;
      state.stream.lastUpdate = Date.now();
      
      // Update today's summary
      state.todaysSummary.totalActiveTime = summary.totalTime;
      state.todaysSummary.topApps = Object.entries(summary.appTimeMap)
        .map(([name, timeSpent]) => ({ name, timeSpent, category: 'neutral' as const }))
        .sort((a, b) => b.timeSpent - a.timeSpent)
        .slice(0, 10);
    },

    setBrowserEvent: (state, action: PayloadAction<BrowserEventPayload>) => {
      const { event, summary } = action.payload;
      
      state.currentBrowser = event;
      state.domainTimeMap = summary.domainTimeMap;
      state.lastUpdate = Date.now();
      
      // Add to recent events
      state.recentEvents.unshift(event);
      if (state.recentEvents.length > state.maxRecentEvents) {
        state.recentEvents = state.recentEvents.slice(0, state.maxRecentEvents);
      }
      
      // Update stream
      state.stream.currentBrowser = event;
      state.stream.lastUpdate = Date.now();
      
      // Update today's summary
      state.todaysSummary.topDomains = Object.entries(summary.domainTimeMap)
        .map(([domain, timeSpent]) => ({ domain, timeSpent, visits: 1 }))
        .sort((a, b) => b.timeSpent - a.timeSpent)
        .slice(0, 10);
    },

    setIdleEvent: (state, action: PayloadAction<IdleEventPayload>) => {
      const { event, previousState, newState } = action.payload;
      
      state.currentState = newState;
      state.lastUpdate = Date.now();
      
      // Add to recent events
      state.recentEvents.unshift(event);
      if (state.recentEvents.length > state.maxRecentEvents) {
        state.recentEvents = state.recentEvents.slice(0, state.maxRecentEvents);
      }
      
      // Update stream
      state.stream.currentState = newState;
      state.stream.lastUpdate = Date.now();
      
      // Update idle/active time in summary
      if (event.type === 'idle' && event.idleDuration) {
        state.todaysSummary.totalIdleTime += event.idleDuration;
      }
    },

    setFocusEvent: (state, action: PayloadAction<FocusEventPayload>) => {
      const { event, session } = action.payload;
      
      if (session) {
        state.currentFocusSession = session;
        state.stream.currentFocusSession = session;
      }
      
      state.lastUpdate = Date.now();
      
      // Add to recent events
      state.recentEvents.unshift(event);
      if (state.recentEvents.length > state.maxRecentEvents) {
        state.recentEvents = state.recentEvents.slice(0, state.maxRecentEvents);
      }
      
      // Update stream
      state.stream.lastUpdate = Date.now();
      
      // If session ended, add to today's summary
      if (event.type === 'focus_end' && session && session.status === 'completed') {
        state.todaysSummary.focusSessions.push(session);
      }
    },

    setProductivityUpdate: (state, action: PayloadAction<ProductivityEventPayload>) => {
      const { event, dailyStats } = action.payload;
      
      state.productivityStats = {
        productiveTime: dailyStats.productiveTime,
        unproductiveTime: dailyStats.unproductiveTime,
        neutralTime: dailyStats.neutralTime,
        score: dailyStats.score,
        totalTime: dailyStats.productiveTime + dailyStats.unproductiveTime + dailyStats.neutralTime
      };
      
      state.lastUpdate = Date.now();
      
      // Add to recent events
      state.recentEvents.unshift(event);
      if (state.recentEvents.length > state.maxRecentEvents) {
        state.recentEvents = state.recentEvents.slice(0, state.maxRecentEvents);
      }
      
      // Update today's summary
      state.todaysSummary.productiveTime = dailyStats.productiveTime;
      state.todaysSummary.unproductiveTime = dailyStats.unproductiveTime;
      state.todaysSummary.productivityScore = dailyStats.score;
      
      // Update stream
      state.stream.todaysSummary = state.todaysSummary;
      state.stream.lastUpdate = Date.now();
    },

    // UI state management
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Tracking status
    setTrackingStatus: (state, action: PayloadAction<{
      window?: boolean;
      browser?: boolean;
      idle?: boolean;
    }>) => {
      const { window: windowTracking, browser: browserTracking, idle: idleTracking } = action.payload;
      
      if (windowTracking !== undefined) {
        state.isWindowTrackingActive = windowTracking;
      }
      if (browserTracking !== undefined) {
        state.isBrowserTrackingActive = browserTracking;
      }
      if (idleTracking !== undefined) {
        state.isIdleMonitorActive = idleTracking;
      }
      
      // Update stream tracking status
      state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
    },

    // Clear recent events
    clearRecentEvents: (state) => {
      state.recentEvents = [];
    },

    // Update max recent events
    setMaxRecentEvents: (state, action: PayloadAction<number>) => {
      state.maxRecentEvents = action.payload;
      if (state.recentEvents.length > action.payload) {
        state.recentEvents = state.recentEvents.slice(0, action.payload);
      }
    },

    // Reset daily summary (for new day)
    resetDailySummary: (state) => {
      const today = new Date().toISOString().split('T')[0];
      state.todaysSummary = {
        date: today,
        totalActiveTime: 0,
        totalIdleTime: 0,
        productiveTime: 0,
        unproductiveTime: 0,
        productivityScore: 0,
        topApps: [],
        topDomains: [],
        focusSessions: []
      };
      state.stream.todaysSummary = state.todaysSummary;
    }
  },

  extraReducers: (builder) => {
    // Window tracking
    builder
      .addCase(startWindowTracking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startWindowTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isWindowTrackingActive = action.payload.success;
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
      })
      .addCase(startWindowTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start window tracking';
      })
      
      .addCase(stopWindowTracking.fulfilled, (state, action) => {
        state.isWindowTrackingActive = !action.payload.success;
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
      });

    // Browser tracking
    builder
      .addCase(startBrowserTracking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startBrowserTracking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isBrowserTrackingActive = action.payload.success;
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
      })
      .addCase(startBrowserTracking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start browser tracking';
      })
      
      .addCase(stopBrowserTracking.fulfilled, (state, action) => {
        state.isBrowserTrackingActive = !action.payload.success;
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
      });

    // Idle monitoring
    builder
      .addCase(startIdleMonitor.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startIdleMonitor.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isIdleMonitorActive = action.payload.success;
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
      })
      .addCase(startIdleMonitor.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start idle monitor';
      })
      
      .addCase(stopIdleMonitor.fulfilled, (state, action) => {
        state.isIdleMonitorActive = !action.payload.success;
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
      });

    // Focus sessions
    builder
      .addCase(startFocusSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startFocusSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentFocusSession = action.payload.session;
        state.stream.currentFocusSession = action.payload.session;
      })
      .addCase(startFocusSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to start focus session';
      })
      
      .addCase(endFocusSession.fulfilled, (state, action) => {
        if (action.payload.session) {
          state.todaysSummary.focusSessions.push(action.payload.session);
        }
        state.currentFocusSession = null;
        state.stream.currentFocusSession = null;
      })
      
      .addCase(pauseFocusSession.fulfilled, (state, action) => {
        state.currentFocusSession = action.payload.session;
        state.stream.currentFocusSession = action.payload.session;
      })
      
      .addCase(resumeFocusSession.fulfilled, (state, action) => {
        state.currentFocusSession = action.payload.session;
        state.stream.currentFocusSession = action.payload.session;
      });

    // Fetch current state
    builder
      .addCase(fetchCurrentState.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentState.fulfilled, (state, action) => {
        state.isLoading = false;
        const { windowState, browserState, idleState, productivityStats, focusSession } = action.payload;
        
        state.isWindowTrackingActive = windowState.isTracking;
        state.isBrowserTrackingActive = browserState.isTracking;
        state.isIdleMonitorActive = !idleState.isIdle; // Assuming idle monitor is active if not idle
        state.appTimeMap = windowState.appTimeMap;
        state.domainTimeMap = browserState.domainTimeMap;
        state.productivityStats = productivityStats;
        state.currentFocusSession = focusSession;
        
        state.stream.isTracking = state.isWindowTrackingActive || state.isBrowserTrackingActive || state.isIdleMonitorActive;
        state.stream.currentFocusSession = focusSession;
        state.stream.lastUpdate = Date.now();
      })
      .addCase(fetchCurrentState.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch current state';
      });

    // Reset tracking data
    builder
      .addCase(resetTrackingData.fulfilled, (state) => {
        state.appTimeMap = {};
        state.domainTimeMap = {};
        state.recentEvents = [];
        state.currentWindow = null;
        state.currentBrowser = null;
        state.productivityStats = {
          productiveTime: 0,
          unproductiveTime: 0,
          neutralTime: 0,
          score: 0,
          totalTime: 0
        };
        state.todaysSummary = {
          date: new Date().toISOString().split('T')[0],
          totalActiveTime: 0,
          totalIdleTime: 0,
          productiveTime: 0,
          unproductiveTime: 0,
          productivityScore: 0,
          topApps: [],
          topDomains: [],
          focusSessions: []
        };
        state.stream.todaysSummary = state.todaysSummary;
        state.stream.currentWindow = null;
        state.stream.currentBrowser = null;
        state.stream.lastUpdate = Date.now();
      });
  }
});

// Export actions
export const {
  setWindowEvent,
  setBrowserEvent,
  setIdleEvent,
  setFocusEvent,
  setProductivityUpdate,
  setLoading,
  setError,
  clearError,
  setTrackingStatus,
  clearRecentEvents,
  setMaxRecentEvents,
  resetDailySummary
} = activitySlice.actions;

// Export reducer
export default activitySlice.reducer;

// Import RootState type
import type { RootState } from '../../store';

// Selectors
export const selectActivityStream = (state: RootState) => state.activity.stream;
export const selectCurrentWindow = (state: RootState) => state.activity.currentWindow;
export const selectCurrentBrowser = (state: RootState) => state.activity.currentBrowser;
export const selectCurrentState = (state: RootState) => state.activity.currentState;
export const selectCurrentFocusSession = (state: RootState) => state.activity.currentFocusSession;
export const selectProductivityStats = (state: RootState) => state.activity.productivityStats;
export const selectTodaysSummary = (state: RootState) => state.activity.todaysSummary;
export const selectRecentEvents = (state: RootState) => state.activity.recentEvents;
export const selectIsTracking = (state: RootState) => state.activity.stream.isTracking;
export const selectTrackingStatus = (state: RootState) => ({
  window: state.activity.isWindowTrackingActive,
  browser: state.activity.isBrowserTrackingActive,
  idle: state.activity.isIdleMonitorActive
});
export const selectAppTimeMap = (state: RootState) => state.activity.appTimeMap;
export const selectDomainTimeMap = (state: RootState) => state.activity.domainTimeMap;
export const selectIsLoading = (state: RootState) => state.activity.isLoading;
export const selectError = (state: RootState) => state.activity.error;

// Export the slice state type for use in store
export type { ActivitySliceState };
