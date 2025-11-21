/**
 * Activity Stream Hook
 * React hook for managing real-time activity monitoring and streaming
 */

import { useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../../hooks/redux';
import { 
  setWindowEvent,
  setBrowserEvent,
  setIdleEvent,
  setFocusEvent,
  setProductivityUpdate,
  startWindowTracking,
  stopWindowTracking,
  startBrowserTracking,
  stopBrowserTracking,
  startIdleMonitor,
  stopIdleMonitor,
  startFocusSession,
  endFocusSession,
  pauseFocusSession,
  resumeFocusSession,
  fetchCurrentState,
  resetTrackingData,
  selectActivityStream,
  selectCurrentWindow,
  selectCurrentBrowser,
  selectCurrentState,
  selectCurrentFocusSession,
  selectProductivityStats,
  selectTodaysSummary,
  selectIsTracking,
  selectTrackingStatus,
  selectIsLoading,
  selectError
} from './activitySlice';
import { 
  useLogActivityMutation,
  useLogKeystrokesMutation,
  useLogMetricsMutation,
  useCreateWindowActivityMutation,
  useCreateBrowserActivityMutation,
  useCreateProductivityActivityMutation,
  useStartFocusSessionMutation,
  useEndFocusSessionMutation,
  useActivityApiWithOffline
} from '../../services/api/activityApi';
import type { 
  WindowEventPayload,
  BrowserEventPayload,
  IdleEventPayload,
  FocusEventPayload,
  ProductivityEventPayload,
  FocusSession
} from '../../../shared/types/activity';

interface UseActivityStreamOptions {
  autoStart?: boolean;
  windowTrackingInterval?: number;
  browserTrackingInterval?: number;
  idleThreshold?: number;
  enableAutoSync?: boolean;
  syncInterval?: number;
}

interface UseActivityStreamReturn {
  // State
  stream: ReturnType<typeof selectActivityStream>;
  currentWindow: ReturnType<typeof selectCurrentWindow>;
  currentBrowser: ReturnType<typeof selectCurrentBrowser>;
  currentState: ReturnType<typeof selectCurrentState>;
  currentFocusSession: ReturnType<typeof selectCurrentFocusSession>;
  productivityStats: ReturnType<typeof selectProductivityStats>;
  todaysSummary: ReturnType<typeof selectTodaysSummary>;
  isTracking: ReturnType<typeof selectIsTracking>;
  trackingStatus: ReturnType<typeof selectTrackingStatus>;
  isLoading: ReturnType<typeof selectIsLoading>;
  error: ReturnType<typeof selectError>;

  // Control methods
  startAllTracking: () => Promise<void>;
  stopAllTracking: () => Promise<void>;
  startWindowTracking: (intervalMs?: number) => Promise<void>;
  stopWindowTracking: () => Promise<void>;
  startBrowserTracking: (intervalMs?: number) => Promise<void>;
  stopBrowserTracking: () => Promise<void>;
  startIdleMonitor: (thresholdSeconds?: number) => Promise<void>;
  stopIdleMonitor: () => Promise<void>;

  // Focus session methods
  startFocusSession: (targetDurationSeconds: number, sessionType?: string) => Promise<string>;
  endFocusSession: (reason?: 'completed' | 'cancelled' | 'interrupted') => Promise<FocusSession | null>;
  pauseFocusSession: (reason?: 'idle' | 'manual' | 'distraction') => Promise<void>;
  resumeFocusSession: () => Promise<void>;

  // Utility methods
  refreshState: () => Promise<void>;
  resetData: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
}

export const useActivityStream = (options: UseActivityStreamOptions = {}): UseActivityStreamReturn => {
  const {
    autoStart = false,
    windowTrackingInterval = 10000,
    browserTrackingInterval = 10000,
    idleThreshold = 60,
    enableAutoSync = true,
    syncInterval = 30000 // 30 seconds
  } = options;

  const dispatch = useAppDispatch();
  
  // Selectors
  const stream = useAppSelector(selectActivityStream);
  const currentWindow = useAppSelector(selectCurrentWindow);
  const currentBrowser = useAppSelector(selectCurrentBrowser);
  const currentState = useAppSelector(selectCurrentState);
  const currentFocusSession = useAppSelector(selectCurrentFocusSession);
  const productivityStats = useAppSelector(selectProductivityStats);
  const todaysSummary = useAppSelector(selectTodaysSummary);
  const isTracking = useAppSelector(selectIsTracking);
  const trackingStatus = useAppSelector(selectTrackingStatus);
  const isLoading = useAppSelector(selectIsLoading);
  const error = useAppSelector(selectError);

  // API mutations
  const [logActivityApi] = useLogActivityMutation();
  const [logKeystrokesApi] = useLogKeystrokesMutation();
  const [logMetricsApi] = useLogMetricsMutation();
  const [createWindowActivityApi] = useCreateWindowActivityMutation();
  const [createBrowserActivityApi] = useCreateBrowserActivityMutation();
  const [createProductivityActivityApi] = useCreateProductivityActivityMutation();
  const [startFocusSessionApi] = useStartFocusSessionMutation();
  const [endFocusSessionApi] = useEndFocusSessionMutation();

  // Offline API helpers
  const {
    logActivityOffline,
    logKeystrokesOffline,
    logMetricsOffline,
    createWindowActivityOffline,
    createBrowserActivityOffline,
    getOfflineQueueStatus,
    clearOfflineQueue
  } = useActivityApiWithOffline();

  // Refs for cleanup
  const cleanupFunctionsRef = useRef<Array<() => void>>([]);
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Event handlers
  const handleWindowEvent = useCallback(async (payload: WindowEventPayload) => {
    dispatch(setWindowEvent(payload));

    // Auto-sync to API if enabled
    if (enableAutoSync) {
      try {
        // Use new API format
        await logActivityOffline({
          window_title: payload.event.windowTitle,
          app_name: payload.event.appName,
          start_time: new Date(payload.event.timestamp).toISOString(),
          end_time: new Date(payload.event.timestamp + (payload.event.duration * 1000)).toISOString(),
          activity_type: 'application',
          metadata: {
            processName: payload.event.processName,
            processId: payload.event.processId,
            platform: payload.event.platform,
            duration: payload.event.duration
          }
        });
      } catch (error) {
        console.warn('Failed to sync window activity:', error);
      }
    }
  }, [dispatch, enableAutoSync, logActivityOffline]);

  const handleBrowserEvent = useCallback(async (payload: BrowserEventPayload) => {
    dispatch(setBrowserEvent(payload));

    // Auto-sync to API if enabled
    if (enableAutoSync) {
      try {
        // Use new API format
        await logActivityOffline({
          window_title: payload.event.title,
          app_name: payload.event.browserName,
          start_time: new Date(payload.event.timestamp).toISOString(),
          end_time: new Date(payload.event.timestamp + 10000).toISOString(), // Assume 10 second duration
          activity_type: 'browser',
          url: payload.event.url,
          metadata: {
            domain: payload.event.domain,
            browserName: payload.event.browserName,
            tabId: payload.event.tabId,
            isIncognito: payload.event.isIncognito
          }
        });
      } catch (error) {
        console.warn('Failed to sync browser activity:', error);
      }
    }
  }, [dispatch, enableAutoSync, logActivityOffline]);

  const handleIdleEvent = useCallback((payload: IdleEventPayload) => {
    dispatch(setIdleEvent(payload));
  }, [dispatch]);

  const handleFocusEvent = useCallback((payload: FocusEventPayload) => {
    dispatch(setFocusEvent(payload));

    // Auto-sync focus session events to API
    if (enableAutoSync && payload.event.type === 'focus_start') {
      // Focus session start is handled by the startFocusSession method
    } else if (enableAutoSync && payload.event.type === 'focus_end' && payload.session) {
      // Focus session end
      endFocusSessionApi({
        sessionId: payload.session.id,
        reason: payload.session.status === 'completed' ? 'completed' : 'cancelled'
      }).catch(error => {
        console.warn('Failed to sync focus session end:', error);
      });
    }
  }, [dispatch, enableAutoSync, endFocusSessionApi]);

  const handleProductivityUpdate = useCallback(async (payload: ProductivityEventPayload) => {
    dispatch(setProductivityUpdate(payload));

    // Auto-sync productivity data to API
    if (enableAutoSync) {
      try {
        await createProductivityActivityApi({
          appName: payload.event.appName,
          category: payload.event.category,
          timeSpent: payload.event.timeSpent,
          timestamp: payload.event.timestamp
        });
      } catch (error) {
        console.warn('Failed to sync productivity activity:', error);
      }
    }
  }, [dispatch, enableAutoSync, createProductivityActivityApi]);

  // Setup event listeners
  useEffect(() => {
    if (!window.monitoring) {
      console.warn('Monitoring API not available');
      return;
    }

    // Setup event listeners
    const windowCleanup = window.monitoring.onWindowEvent(handleWindowEvent);
    const browserCleanup = window.monitoring.onBrowserEvent(handleBrowserEvent);
    const idleCleanup = window.monitoring.onIdleEvent(handleIdleEvent);
    const activeCleanup = window.monitoring.onActiveEvent(handleIdleEvent);
    const focusCleanup = window.monitoring.onFocusEvent(handleFocusEvent);
    const productivityCleanup = window.monitoring.onProductivityUpdate(handleProductivityUpdate);

    // Store cleanup functions
    cleanupFunctionsRef.current = [
      windowCleanup,
      browserCleanup,
      idleCleanup,
      activeCleanup,
      focusCleanup,
      productivityCleanup
    ];

    // Cleanup on unmount
    return () => {
      cleanupFunctionsRef.current.forEach(cleanup => cleanup());
      cleanupFunctionsRef.current = [];
    };
  }, [
    handleWindowEvent,
    handleBrowserEvent,
    handleIdleEvent,
    handleFocusEvent,
    handleProductivityUpdate
  ]);

  // Auto-sync interval
  useEffect(() => {
    if (enableAutoSync && syncInterval > 0) {
      syncIntervalRef.current = setInterval(async () => {
        const queueStatus = getOfflineQueueStatus();
        if (queueStatus.count > 0) {
          console.log(`Syncing ${queueStatus.count} offline activities...`);
          // In a real implementation, you'd call a sync API endpoint here
        }
      }, syncInterval);

      return () => {
        if (syncIntervalRef.current) {
          clearInterval(syncIntervalRef.current);
          syncIntervalRef.current = null;
        }
      };
    }
  }, [enableAutoSync, syncInterval, getOfflineQueueStatus]);

  // Auto-start tracking
  useEffect(() => {
    if (autoStart) {
      startAllTracking();
    }

    // Fetch initial state
    dispatch(fetchCurrentState());
  }, [autoStart]);

  // Control methods
  const startAllTracking = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(startWindowTracking(windowTrackingInterval)).unwrap(),
        dispatch(startBrowserTracking(browserTrackingInterval)).unwrap(),
        dispatch(startIdleMonitor(idleThreshold)).unwrap()
      ]);
    } catch (error) {
      console.error('Failed to start all tracking:', error);
    }
  }, [dispatch, windowTrackingInterval, browserTrackingInterval, idleThreshold]);

  const stopAllTracking = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(stopWindowTracking()).unwrap(),
        dispatch(stopBrowserTracking()).unwrap(),
        dispatch(stopIdleMonitor()).unwrap()
      ]);
    } catch (error) {
      console.error('Failed to stop all tracking:', error);
    }
  }, [dispatch]);

  const startWindowTrackingMethod = useCallback(async (intervalMs = windowTrackingInterval) => {
    try {
      await dispatch(startWindowTracking(intervalMs)).unwrap();
    } catch (error) {
      console.error('Failed to start window tracking:', error);
      throw error;
    }
  }, [dispatch, windowTrackingInterval]);

  const stopWindowTrackingMethod = useCallback(async () => {
    try {
      await dispatch(stopWindowTracking()).unwrap();
    } catch (error) {
      console.error('Failed to stop window tracking:', error);
      throw error;
    }
  }, [dispatch]);

  const startBrowserTrackingMethod = useCallback(async (intervalMs = browserTrackingInterval) => {
    try {
      await dispatch(startBrowserTracking(intervalMs)).unwrap();
    } catch (error) {
      console.error('Failed to start browser tracking:', error);
      throw error;
    }
  }, [dispatch, browserTrackingInterval]);

  const stopBrowserTrackingMethod = useCallback(async () => {
    try {
      await dispatch(stopBrowserTracking()).unwrap();
    } catch (error) {
      console.error('Failed to stop browser tracking:', error);
      throw error;
    }
  }, [dispatch]);

  const startIdleMonitorMethod = useCallback(async (thresholdSeconds = idleThreshold) => {
    try {
      await dispatch(startIdleMonitor(thresholdSeconds)).unwrap();
    } catch (error) {
      console.error('Failed to start idle monitor:', error);
      throw error;
    }
  }, [dispatch, idleThreshold]);

  const stopIdleMonitorMethod = useCallback(async () => {
    try {
      await dispatch(stopIdleMonitor()).unwrap();
    } catch (error) {
      console.error('Failed to stop idle monitor:', error);
      throw error;
    }
  }, [dispatch]);

  // Focus session methods
  const startFocusSessionMethod = useCallback(async (targetDurationSeconds: number, sessionType = 'general') => {
    try {
      const result = await dispatch(startFocusSession({ targetDurationSeconds, sessionType })).unwrap();
      
      // Also sync to API
      if (enableAutoSync) {
        await startFocusSessionOffline({ targetDurationSeconds, sessionType });
      }
      
      return result.sessionId;
    } catch (error) {
      console.error('Failed to start focus session:', error);
      throw error;
    }
  }, [dispatch, enableAutoSync, startFocusSessionOffline]);

  const endFocusSessionMethod = useCallback(async (reason: 'completed' | 'cancelled' | 'interrupted' = 'completed') => {
    try {
      const result = await dispatch(endFocusSession(reason)).unwrap();
      return result.session;
    } catch (error) {
      console.error('Failed to end focus session:', error);
      throw error;
    }
  }, [dispatch]);

  const pauseFocusSessionMethod = useCallback(async (reason: 'idle' | 'manual' | 'distraction' = 'manual') => {
    try {
      await dispatch(pauseFocusSession(reason)).unwrap();
    } catch (error) {
      console.error('Failed to pause focus session:', error);
      throw error;
    }
  }, [dispatch]);

  const resumeFocusSessionMethod = useCallback(async () => {
    try {
      await dispatch(resumeFocusSession()).unwrap();
    } catch (error) {
      console.error('Failed to resume focus session:', error);
      throw error;
    }
  }, [dispatch]);

  // Utility methods
  const refreshState = useCallback(async () => {
    try {
      await dispatch(fetchCurrentState()).unwrap();
    } catch (error) {
      console.error('Failed to refresh state:', error);
      throw error;
    }
  }, [dispatch]);

  const resetData = useCallback(async () => {
    try {
      await dispatch(resetTrackingData()).unwrap();
    } catch (error) {
      console.error('Failed to reset data:', error);
      throw error;
    }
  }, [dispatch]);

  const syncOfflineData = useCallback(async () => {
    try {
      const queueStatus = getOfflineQueueStatus();
      if (queueStatus.count > 0) {
        // In a real implementation, you'd sync the offline queue here
        console.log(`Syncing ${queueStatus.count} offline activities...`);
        clearOfflineQueue();
      }
    } catch (error) {
      console.error('Failed to sync offline data:', error);
      throw error;
    }
  }, [getOfflineQueueStatus, clearOfflineQueue]);

  return {
    // State
    stream,
    currentWindow,
    currentBrowser,
    currentState,
    currentFocusSession,
    productivityStats,
    todaysSummary,
    isTracking,
    trackingStatus,
    isLoading,
    error,

    // Control methods
    startAllTracking,
    stopAllTracking,
    startWindowTracking: startWindowTrackingMethod,
    stopWindowTracking: stopWindowTrackingMethod,
    startBrowserTracking: startBrowserTrackingMethod,
    stopBrowserTracking: stopBrowserTrackingMethod,
    startIdleMonitor: startIdleMonitorMethod,
    stopIdleMonitor: stopIdleMonitorMethod,

    // Focus session methods
    startFocusSession: startFocusSessionMethod,
    endFocusSession: endFocusSessionMethod,
    pauseFocusSession: pauseFocusSessionMethod,
    resumeFocusSession: resumeFocusSessionMethod,

    // Utility methods
    refreshState,
    resetData,
    syncOfflineData
  };
};

// Simplified hook for basic activity monitoring
export const useActivityMonitor = (autoStart = true) => {
  const {
    isTracking,
    currentWindow,
    currentBrowser,
    productivityStats,
    startAllTracking,
    stopAllTracking
  } = useActivityStream({ autoStart });

  return {
    isTracking,
    currentWindow,
    currentBrowser,
    productivityStats,
    start: startAllTracking,
    stop: stopAllTracking
  };
};

// Hook for focus session management
export const useFocusSession = () => {
  const {
    currentFocusSession,
    startFocusSession,
    endFocusSession,
    pauseFocusSession,
    resumeFocusSession
  } = useActivityStream();

  const isActive = currentFocusSession?.status === 'active';
  const isPaused = currentFocusSession?.status === 'paused';
  const duration = currentFocusSession ? 
    Math.floor((Date.now() - currentFocusSession.startTime) / 1000) - currentFocusSession.pausedDuration : 0;

  return {
    session: currentFocusSession,
    isActive,
    isPaused,
    duration,
    start: startFocusSession,
    end: endFocusSession,
    pause: pauseFocusSession,
    resume: resumeFocusSession
  };
};

// Hook for productivity tracking
export const useProductivityTracker = () => {
  const { productivityStats, todaysSummary } = useActivityStream();

  const productivityPercentage = productivityStats.totalTime > 0 ? 
    Math.round((productivityStats.productiveTime / productivityStats.totalTime) * 100) : 0;

  return {
    stats: productivityStats,
    summary: todaysSummary,
    productivityPercentage,
    isProductive: productivityPercentage >= 70,
    needsImprovement: productivityPercentage < 50
  };
};
