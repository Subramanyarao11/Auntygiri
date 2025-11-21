/**
 * Activity API Service
 * RTK Query API endpoints for activity monitoring with offline support
 */

import { createApi, fetchBaseQuery, retry } from '@reduxjs/toolkit/query/react';
import type { 
  CreateWindowActivityRequest,
  CreateBrowserActivityRequest,
  StartFocusSessionRequest,
  EndFocusSessionRequest,
  ActivityApiResponse,
  WindowActivity,
  BrowserActivity,
  FocusSession,
  ActivitySummary,
  ProductivityActivity
} from '../../../shared/types/activity';

// API Response Types matching your backend
interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Activity API Types
interface LogActivityRequest {
  window_title: string;
  app_name: string;
  start_time: string; // ISO8601
  end_time: string; // ISO8601
  activity_type: 'application' | 'browser' | 'system';
  url?: string;
  metadata?: Record<string, any>;
}

interface ActivityResponse {
  id: string;
  userId: string;
  window_title: string;
  app_name: string;
  start_time: string;
  end_time: string;
  duration: number;
  activity_type: string;
  url?: string;
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

interface ActivitiesResponse {
  total: number;
  activities: ActivityResponse[];
}

interface ActivitySummaryResponse {
  total_time: number;
  by_app: Array<{
    app_name: string;
    total_duration: number;
    activity_count: number;
  }>;
  by_type: Array<{
    activity_type: string;
    total_duration: number;
  }>;
}

// Keystroke API Types
interface LogKeystrokesRequest {
  key_log: Array<{
    key_code: number;
    key_char?: string;
    key_type: string;
    timestamp: string; // ISO8601
    window_title?: string;
    app_name?: string;
    is_shortcut?: boolean;
    modifiers?: string[];
  }>;
}

interface KeystrokeResponse {
  id: string;
  userId: string;
  key_code: number;
  key_char?: string;
  key_type: string;
  timestamp: string;
  window_title?: string;
  app_name?: string;
  is_shortcut: boolean;
  modifiers: string[];
  created_at: string;
}

interface KeystrokesResponse {
  total: number;
  keystrokes: KeystrokeResponse[];
}

// System Metrics API Types
interface LogMetricsRequest {
  cpu: {
    usage: number; // 0-100
    temperature?: number; // celsius
  };
  memory: {
    usage: number; // 0-100
  };
  disk: {
    usage: number; // 0-100
    read?: number;
    write?: number;
  };
  network: {
    in?: number; // bytes
    out?: number; // bytes
  };
}

interface MetricResponse {
  id: string;
  userId: string;
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in?: number;
  network_out?: number;
  cpu_temperature?: number;
  disk_read?: number;
  disk_write?: number;
  timestamp: string;
  created_at: string;
  metrics: {
    cpu: Record<string, any>;
    memory: Record<string, any>;
    disk: Record<string, any>;
    network: Record<string, any>;
  };
}

interface MetricsResponse {
  total: number;
  metrics: MetricResponse[];
}

interface MetricsSummaryResponse {
  avg_cpu_usage: number;
  avg_memory_usage: number;
  avg_disk_usage: number;
  avg_network_in: number;
  avg_network_out: number;
  avg_cpu_temp: number;
  avg_disk_read: number;
  avg_disk_write: number;
}

// Base query with retry logic
const baseQueryWithRetry = retry(
  fetchBaseQuery({
    baseUrl: '/api/v1/monitor',
    prepareHeaders: (headers, { getState }) => {
      // Add auth token if available
      const token = (getState() as any).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      headers.set('content-type', 'application/json');
      return headers;
    },
  }),
  {
    maxRetries: 3,
    retryCondition: (error, args) => {
      // Retry on network errors or 5xx server errors
      return (
        error.status === 'FETCH_ERROR' ||
        error.status === 'TIMEOUT_ERROR' ||
        (typeof error.status === 'number' && error.status >= 500)
      );
    },
  }
);

// Activity API slice
export const activityApi = createApi({
  reducerPath: 'activityApi',
  baseQuery: baseQueryWithRetry,
  tagTypes: ['Activity', 'ActivitySummary', 'Keystrokes', 'Metrics', 'MetricsSummary'],
  
  endpoints: (builder) => ({
    // ============ Activity Endpoints (Your API) ============
    
    /**
     * Log Activity - POST /api/v1/monitor/activity
     */
    logActivity: builder.mutation<
      ApiResponse<{ activity: ActivityResponse }>,
      LogActivityRequest
    >({
      query: (data) => ({
        url: '/activity',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Activity', 'ActivitySummary'],
      
      // Offline support - store in queue if request fails
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          // Add to offline queue
          dispatch(addToOfflineQueue({
            type: 'LOG_ACTIVITY',
            data: arg,
            timestamp: Date.now()
          }));
        }
      },
    }),

    /**
     * Get Activities - GET /api/v1/monitor/activities
     */
    getActivities: builder.query<
      ApiResponse<ActivitiesResponse>,
      {
        startDate?: string;
        endDate?: string;
        limit?: number;
        offset?: number;
        appName?: string;
      }
    >({
      query: (params) => ({
        url: '/activities',
        params: {
          startDate: params.startDate,
          endDate: params.endDate,
          limit: params.limit || 100,
          offset: params.offset || 0,
          appName: params.appName,
        },
      }),
      providesTags: ['Activity'],
    }),

    /**
     * Get Activity Summary - GET /api/v1/monitor/activities/summary
     */
    getActivitySummary: builder.query<
      ApiResponse<ActivitySummaryResponse>,
      { startDate?: string; endDate?: string }
    >({
      query: (params) => ({
        url: '/activities/summary',
        params,
      }),
      providesTags: ['ActivitySummary'],
    }),

    // ============ Keystroke Endpoints ============
    
    /**
     * Log Keystrokes - POST /api/v1/monitor/keystrokes
     */
    logKeystrokes: builder.mutation<
      ApiResponse<{ keystrokes: KeystrokeResponse[] }>,
      LogKeystrokesRequest
    >({
      query: (data) => ({
        url: '/keystrokes',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Keystrokes'],
      
      // Offline support
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(addToOfflineQueue({
            type: 'LOG_KEYSTROKES',
            data: arg,
            timestamp: Date.now()
          }));
        }
      },
    }),

    /**
     * Get Keystrokes - GET /api/v1/monitor/keystrokes
     */
    getKeystrokes: builder.query<
      ApiResponse<KeystrokesResponse>,
      {
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
        app_name?: string;
      }
    >({
      query: (params) => ({
        url: '/keystrokes',
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          limit: params.limit || 100,
          offset: params.offset || 0,
          app_name: params.app_name,
        },
      }),
      providesTags: ['Keystrokes'],
    }),

    // ============ System Metrics Endpoints ============
    
    /**
     * Log System Metrics - POST /api/v1/monitor/metrics
     */
    logMetrics: builder.mutation<
      ApiResponse<{ metric: MetricResponse }>,
      LogMetricsRequest
    >({
      query: (data) => ({
        url: '/metrics',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Metrics', 'MetricsSummary'],
      
      // Offline support
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(addToOfflineQueue({
            type: 'LOG_METRICS',
            data: arg,
            timestamp: Date.now()
          }));
        }
      },
    }),

    /**
     * Get System Metrics - GET /api/v1/monitor/metrics
     */
    getMetrics: builder.query<
      ApiResponse<MetricsResponse>,
      {
        start_date?: string;
        end_date?: string;
        limit?: number;
        offset?: number;
      }
    >({
      query: (params) => ({
        url: '/metrics',
        params: {
          start_date: params.start_date,
          end_date: params.end_date,
          limit: params.limit || 100,
          offset: params.offset || 0,
        },
      }),
      providesTags: ['Metrics'],
    }),

    /**
     * Get Metrics Summary - GET /api/v1/monitor/metrics/summary
     */
    getMetricsSummary: builder.query<
      ApiResponse<MetricsSummaryResponse>,
      { start_date?: string; end_date?: string }
    >({
      query: (params) => ({
        url: '/metrics/summary',
        params,
      }),
      providesTags: ['MetricsSummary'],
    }),

    // ============ Legacy Endpoints (Compatibility) ============
    
    /**
     * Create a new window activity record (Legacy)
     */
    createWindowActivity: builder.mutation<
      ActivityApiResponse<WindowActivity>,
      CreateWindowActivityRequest
    >({
      query: (data) => {
        // Convert to new API format
        const logActivityData: LogActivityRequest = {
          window_title: data.windowTitle,
          app_name: data.appName,
          start_time: new Date(data.timestamp).toISOString(),
          end_time: new Date(data.timestamp + (data.duration * 1000)).toISOString(),
          activity_type: 'application',
          metadata: {
            processName: data.processName,
            duration: data.duration
          }
        };
        
        return {
          url: '/activity',
          method: 'POST',
          body: logActivityData,
        };
      },
      invalidatesTags: ['Activity', 'ActivitySummary'],
    }),

    /**
     * Get window activities for a date range (Legacy)
     */
    getWindowActivities: builder.query<
      ActivityApiResponse<WindowActivity[]>,
      { startDate: string; endDate: string; limit?: number }
    >({
      query: ({ startDate, endDate, limit = 100 }) => ({
        url: '/activities',
        params: { 
          startDate, 
          endDate, 
          limit,
          activity_type: 'application'
        },
      }),
      providesTags: ['Activity'],
      transformResponse: (response: ApiResponse<ActivitiesResponse>) => {
        // Transform API response to legacy format
        return {
          success: response.status === 'success',
          data: response.data?.activities.map(activity => ({
            id: activity.id,
            type: 'window' as const,
            timestamp: new Date(activity.start_time).getTime(),
            appName: activity.app_name,
            windowTitle: activity.window_title,
            processName: activity.metadata?.processName || activity.app_name,
            processId: 0,
            duration: activity.duration,
            isActive: true,
            platform: 'darwin' as const
          })) || [],
          timestamp: Date.now()
        };
      }
    }),

    /**
     * Get window activity statistics
     */
    getWindowStats: builder.query<
      ActivityApiResponse<{ totalTime: number; appBreakdown: Record<string, number> }>,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/window/stats',
        params: { startDate, endDate },
      }),
      providesTags: ['WindowActivity'],
    }),

    // ============ Browser Activity Endpoints ============
    
    /**
     * Create a new browser activity record (Legacy)
     */
    createBrowserActivity: builder.mutation<
      ActivityApiResponse<BrowserActivity>,
      CreateBrowserActivityRequest
    >({
      query: (data) => {
        // Convert to new API format
        const logActivityData: LogActivityRequest = {
          window_title: data.title,
          app_name: data.browserName,
          start_time: new Date(data.timestamp).toISOString(),
          end_time: new Date(data.timestamp + 10000).toISOString(), // Assume 10 second duration
          activity_type: 'browser',
          url: data.url,
          metadata: {
            domain: data.domain,
            browserName: data.browserName
          }
        };
        
        return {
          url: '/activity',
          method: 'POST',
          body: logActivityData,
        };
      },
      invalidatesTags: ['Activity', 'ActivitySummary'],
    }),

    /**
     * Get browser activities for a date range
     */
    getBrowserActivities: builder.query<
      ActivityApiResponse<BrowserActivity[]>,
      { startDate: string; endDate: string; limit?: number }
    >({
      query: ({ startDate, endDate, limit = 100 }) => ({
        url: '/url',
        params: { startDate, endDate, limit },
      }),
      providesTags: ['BrowserActivity'],
    }),

    /**
     * Get browser activity statistics
     */
    getBrowserStats: builder.query<
      ActivityApiResponse<{ totalTime: number; domainBreakdown: Record<string, number> }>,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/url/stats',
        params: { startDate, endDate },
      }),
      providesTags: ['BrowserActivity'],
    }),

    // ============ Focus Session Endpoints ============
    
    /**
     * Start a new focus session
     */
    startFocusSession: builder.mutation<
      ActivityApiResponse<FocusSession>,
      StartFocusSessionRequest
    >({
      query: (data) => ({
        url: '/focus/start',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FocusSession'],
      
      // Offline support
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(addToOfflineQueue({
            type: 'START_FOCUS_SESSION',
            data: arg,
            timestamp: Date.now()
          }));
        }
      },
    }),

    /**
     * End a focus session
     */
    endFocusSession: builder.mutation<
      ActivityApiResponse<FocusSession>,
      EndFocusSessionRequest
    >({
      query: (data) => ({
        url: '/focus/end',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['FocusSession', 'ActivitySummary'],
      
      // Offline support
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(addToOfflineQueue({
            type: 'END_FOCUS_SESSION',
            data: arg,
            timestamp: Date.now()
          }));
        }
      },
    }),

    /**
     * Get focus sessions for a date range
     */
    getFocusSessions: builder.query<
      ActivityApiResponse<FocusSession[]>,
      { startDate: string; endDate: string; limit?: number }
    >({
      query: ({ startDate, endDate, limit = 50 }) => ({
        url: '/focus',
        params: { startDate, endDate, limit },
      }),
      providesTags: ['FocusSession'],
    }),

    /**
     * Get focus session statistics
     */
    getFocusStats: builder.query<
      ActivityApiResponse<{
        totalSessions: number;
        totalFocusTime: number;
        averageScore: number;
        completionRate: number;
      }>,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/focus/stats',
        params: { startDate, endDate },
      }),
      providesTags: ['FocusSession'],
    }),

    // ============ Productivity Endpoints ============
    
    /**
     * Create productivity activity record
     */
    createProductivityActivity: builder.mutation<
      ActivityApiResponse<ProductivityActivity>,
      {
        appName: string;
        category: string;
        timeSpent: number;
        timestamp: number;
        domain?: string;
      }
    >({
      query: (data) => ({
        url: '/productivity',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ProductivityStats', 'ActivitySummary'],
      
      // Offline support
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(addToOfflineQueue({
            type: 'CREATE_PRODUCTIVITY_ACTIVITY',
            data: arg,
            timestamp: Date.now()
          }));
        }
      },
    }),

    /**
     * Get productivity statistics
     */
    getProductivityStats: builder.query<
      ActivityApiResponse<{
        productiveTime: number;
        unproductiveTime: number;
        neutralTime: number;
        score: number;
        breakdown: {
          apps: Array<{ name: string; timeSpent: number; category: string }>;
          domains: Array<{ domain: string; timeSpent: number; category: string }>;
        };
      }>,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/productivity/stats',
        params: { startDate, endDate },
      }),
      providesTags: ['ProductivityStats'],
    }),

    // ============ Activity Summary Endpoints ============
    
    /**
     * Get daily activity summary
     */
    getDailySummary: builder.query<
      ActivityApiResponse<ActivitySummary>,
      { date: string }
    >({
      query: ({ date }) => ({
        url: '/summary/daily',
        params: { date },
      }),
      providesTags: ['ActivitySummary'],
    }),

    /**
     * Get weekly activity summary
     */
    getWeeklySummary: builder.query<
      ActivityApiResponse<{
        startDate: string;
        endDate: string;
        totalActiveTime: number;
        totalProductiveTime: number;
        averageProductivityScore: number;
        dailySummaries: ActivitySummary[];
        trends: {
          productivityTrend: number; // percentage change
          focusTrend: number;
          activeTrend: number;
        };
      }>,
      { startDate: string; endDate: string }
    >({
      query: ({ startDate, endDate }) => ({
        url: '/summary/weekly',
        params: { startDate, endDate },
      }),
      providesTags: ['ActivitySummary'],
    }),

    /**
     * Get monthly activity summary
     */
    getMonthlySummary: builder.query<
      ActivityApiResponse<{
        month: string;
        year: number;
        totalActiveTime: number;
        totalProductiveTime: number;
        averageProductivityScore: number;
        weeklySummaries: Array<{
          week: number;
          startDate: string;
          endDate: string;
          activeTime: number;
          productiveTime: number;
          score: number;
        }>;
        topApps: Array<{ name: string; timeSpent: number }>;
        topDomains: Array<{ domain: string; timeSpent: number }>;
      }>,
      { month: number; year: number }
    >({
      query: ({ month, year }) => ({
        url: '/summary/monthly',
        params: { month, year },
      }),
      providesTags: ['ActivitySummary'],
    }),

    // ============ Bulk Operations ============
    
    /**
     * Bulk upload activities (for offline sync)
     */
    bulkUploadActivities: builder.mutation<
      ActivityApiResponse<{ processed: number; errors: number }>,
      {
        windowActivities?: CreateWindowActivityRequest[];
        browserActivities?: CreateBrowserActivityRequest[];
        productivityActivities?: any[];
        focusSessions?: any[];
      }
    >({
      query: (data) => ({
        url: '/bulk',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['WindowActivity', 'BrowserActivity', 'FocusSession', 'ProductivityStats', 'ActivitySummary'],
    }),

    /**
     * Export activity data
     */
    exportActivityData: builder.query<
      ActivityApiResponse<{
        downloadUrl: string;
        expiresAt: number;
        format: 'json' | 'csv';
        size: number;
      }>,
      { startDate: string; endDate: string; format?: 'json' | 'csv' }
    >({
      query: ({ startDate, endDate, format = 'json' }) => ({
        url: '/export',
        params: { startDate, endDate, format },
      }),
    }),

    // ============ Real-time Sync ============
    
    /**
     * Sync pending offline activities
     */
    syncOfflineActivities: builder.mutation<
      ActivityApiResponse<{ synced: number; failed: number }>,
      void
    >({
      query: () => ({
        url: '/sync',
        method: 'POST',
      }),
      invalidatesTags: ['WindowActivity', 'BrowserActivity', 'FocusSession', 'ProductivityStats', 'ActivitySummary'],
    }),
  }),
});

// Export hooks for use in components
export const {
  // New API hooks (Your Backend)
  useLogActivityMutation,
  useGetActivitiesQuery,
  useGetActivitySummaryQuery,
  
  // Keystroke hooks
  useLogKeystrokesMutation,
  useGetKeystrokesQuery,
  
  // System metrics hooks
  useLogMetricsMutation,
  useGetMetricsQuery,
  useGetMetricsSummaryQuery,
  
  // Legacy hooks (for compatibility)
  useCreateWindowActivityMutation,
  useGetWindowActivitiesQuery,
  useCreateBrowserActivityMutation,
  useGetBrowserActivitiesQuery,
  
  // Focus session hooks (if still needed)
  useStartFocusSessionMutation,
  useEndFocusSessionMutation,
  useGetFocusSessionsQuery,
  useGetFocusStatsQuery,
  
  // Productivity hooks (if still needed)
  useCreateProductivityActivityMutation,
  useGetProductivityStatsQuery,
  
  // Summary hooks (if still needed)
  useGetDailySummaryQuery,
  useGetWeeklySummaryQuery,
  useGetMonthlySummaryQuery,
  
  // Bulk operations hooks (if still needed)
  useBulkUploadActivitiesMutation,
  useExportActivityDataQuery,
  useSyncOfflineActivitiesMutation,
} = activityApi;

// Offline queue action (would be defined in a separate slice)
const addToOfflineQueue = (item: any) => ({
  type: 'offlineQueue/addItem',
  payload: item,
});

// Export the API reducer
export default activityApi.reducer;

// Enhanced hooks with offline support
export const useActivityApiWithOffline = () => {
  const [logActivity] = useLogActivityMutation();
  const [logKeystrokes] = useLogKeystrokesMutation();
  const [logMetrics] = useLogMetricsMutation();
  const [createWindowActivity] = useCreateWindowActivityMutation();
  const [createBrowserActivity] = useCreateBrowserActivityMutation();

  // Enhanced activity logging with offline fallback
  const logActivityOffline = async (data: LogActivityRequest) => {
    try {
      const result = await logActivity(data).unwrap();
      return { success: true, data: result };
    } catch (error) {
      // Store in local storage for offline sync
      const offlineQueue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
      offlineQueue.push({
        type: 'LOG_ACTIVITY',
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      localStorage.setItem('activityOfflineQueue', JSON.stringify(offlineQueue));
      
      return { success: false, error, queued: true };
    }
  };

  // Enhanced keystroke logging with offline fallback
  const logKeystrokesOffline = async (data: LogKeystrokesRequest) => {
    try {
      const result = await logKeystrokes(data).unwrap();
      return { success: true, data: result };
    } catch (error) {
      const offlineQueue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
      offlineQueue.push({
        type: 'LOG_KEYSTROKES',
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      localStorage.setItem('activityOfflineQueue', JSON.stringify(offlineQueue));
      
      return { success: false, error, queued: true };
    }
  };

  // Enhanced metrics logging with offline fallback
  const logMetricsOffline = async (data: LogMetricsRequest) => {
    try {
      const result = await logMetrics(data).unwrap();
      return { success: true, data: result };
    } catch (error) {
      const offlineQueue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
      offlineQueue.push({
        type: 'LOG_METRICS',
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      localStorage.setItem('activityOfflineQueue', JSON.stringify(offlineQueue));
      
      return { success: false, error, queued: true };
    }
  };

  // Enhanced window activity creation with offline fallback (Legacy)
  const createWindowActivityOffline = async (data: CreateWindowActivityRequest) => {
    try {
      const result = await createWindowActivity(data).unwrap();
      return { success: true, data: result };
    } catch (error) {
      // Store in local storage for offline sync
      const offlineQueue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
      offlineQueue.push({
        type: 'CREATE_WINDOW_ACTIVITY',
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      localStorage.setItem('activityOfflineQueue', JSON.stringify(offlineQueue));
      
      return { success: false, error, queued: true };
    }
  };

  // Enhanced browser activity creation with offline fallback
  const createBrowserActivityOffline = async (data: CreateBrowserActivityRequest) => {
    try {
      const result = await createBrowserActivity(data).unwrap();
      return { success: true, data: result };
    } catch (error) {
      const offlineQueue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
      offlineQueue.push({
        type: 'CREATE_BROWSER_ACTIVITY',
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      localStorage.setItem('activityOfflineQueue', JSON.stringify(offlineQueue));
      
      return { success: false, error, queued: true };
    }
  };

  // Enhanced focus session start with offline fallback
  const startFocusSessionOffline = async (data: StartFocusSessionRequest) => {
    try {
      const result = await startFocusSession(data).unwrap();
      return { success: true, data: result };
    } catch (error) {
      const offlineQueue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
      offlineQueue.push({
        type: 'START_FOCUS_SESSION',
        data,
        timestamp: Date.now(),
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      });
      localStorage.setItem('activityOfflineQueue', JSON.stringify(offlineQueue));
      
      return { success: false, error, queued: true };
    }
  };

  // Get offline queue status
  const getOfflineQueueStatus = () => {
    const queue = JSON.parse(localStorage.getItem('activityOfflineQueue') || '[]');
    return {
      count: queue.length,
      oldestItem: queue.length > 0 ? queue[0].timestamp : null,
      newestItem: queue.length > 0 ? queue[queue.length - 1].timestamp : null
    };
  };

  // Clear offline queue
  const clearOfflineQueue = () => {
    localStorage.removeItem('activityOfflineQueue');
  };

  return {
    // New API methods
    logActivityOffline,
    logKeystrokesOffline,
    logMetricsOffline,
    
    // Legacy methods (for compatibility)
    createWindowActivityOffline,
    createBrowserActivityOffline,
    
    // Utility methods
    getOfflineQueueStatus,
    clearOfflineQueue,
  };
};
