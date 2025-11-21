/**
 * IPC Channel Constants
 * Centralized definition of all IPC communication channels between main and renderer processes
 */

export const IPC_CHANNELS = {
  // Authentication
  AUTH: {
    LOGIN: 'auth:login',
    LOGOUT: 'auth:logout',
    REFRESH_TOKEN: 'auth:refresh-token',
    GET_STORED_TOKEN: 'auth:get-stored-token',
    CHECK_AUTH_STATUS: 'auth:check-status',
  },

  // Activity Monitoring
  MONITORING: {
    // Legacy channels (keep for compatibility)
    START: 'monitoring:start',
    STOP: 'monitoring:stop',
    GET_CURRENT_WINDOW: 'monitoring:get-current-window',
    GET_ACTIVITY_LOG: 'monitoring:get-activity-log',
    UPDATE_ACTIVITY: 'monitoring:update-activity',
    IDLE_STATUS_CHANGED: 'monitoring:idle-status-changed',

    // New real-time monitoring channels
    // Window tracking
    START_WINDOW_TRACKING: 'monitoring:start-window-tracking',
    STOP_WINDOW_TRACKING: 'monitoring:stop-window-tracking',
    GET_WINDOW_TRACKING_STATE: 'monitoring:get-window-tracking-state',
    WINDOW_EVENT: 'monitoring:window-event', // Main -> Renderer

    // Browser tracking
    START_BROWSER_TRACKING: 'monitoring:start-browser-tracking',
    STOP_BROWSER_TRACKING: 'monitoring:stop-browser-tracking',
    GET_BROWSER_TRACKING_STATE: 'monitoring:get-browser-tracking-state',
    URL_EVENT: 'monitoring:url-event', // Main -> Renderer

    // Idle monitoring
    START_IDLE_MONITOR: 'monitoring:start-idle-monitor',
    STOP_IDLE_MONITOR: 'monitoring:stop-idle-monitor',
    GET_IDLE_STATE: 'monitoring:get-idle-state',
    IDLE_EVENT: 'monitoring:idle-event', // Main -> Renderer

    // Focus sessions
    START_FOCUS_SESSION: 'monitoring:start-focus-session',
    END_FOCUS_SESSION: 'monitoring:end-focus-session',
    PAUSE_FOCUS_SESSION: 'monitoring:pause-focus-session',
    RESUME_FOCUS_SESSION: 'monitoring:resume-focus-session',
    GET_CURRENT_FOCUS_SESSION: 'monitoring:get-current-focus-session',
    FOCUS_EVENT: 'monitoring:focus-event', // Main -> Renderer

    // Productivity tracking
    GET_PRODUCTIVITY_STATS: 'monitoring:get-productivity-stats',
    UPDATE_PRODUCTIVITY_RULES: 'monitoring:update-productivity-rules',
    PRODUCTIVITY_UPDATE: 'monitoring:productivity-update', // Main -> Renderer

    // System metrics
    START_METRICS_TRACKING: 'monitoring:start-metrics-tracking',
    STOP_METRICS_TRACKING: 'monitoring:stop-metrics-tracking',
    GET_CURRENT_METRICS: 'monitoring:get-current-metrics',
    METRICS_UPDATE: 'monitoring:metrics-update', // Main -> Renderer

    // Utility
    RESET_TRACKING_DATA: 'monitoring:reset-tracking-data',
    EXPORT_ACTIVITY_DATA: 'monitoring:export-activity-data',
  },

  // Screenshots
  SCREENSHOT: {
    CAPTURE: 'screenshot:capture',
    GET_ALL: 'screenshot:get-all',
    DELETE: 'screenshot:delete',
    UPLOAD: 'screenshot:upload',
    GET_PENDING: 'screenshot:get-pending',
    MARK_UPLOADED: 'screenshot:mark-uploaded',
    // Enhanced features
    CONFIGURE_API: 'screenshot:configure-api',
    GET_QUEUE_STATUS: 'screenshot:get-queue-status',
    GET_API_STATUS: 'screenshot:get-api-status',
  },

  // Bad Website Detection
  BAD_WEBSITE: {
    CHECK: 'bad-website:check',
    ALERT: 'bad-website:alert',
    GET_LIST: 'bad-website:get-list',
    UPDATE_LIST: 'bad-website:update-list',
  },

  // Productivity
  PRODUCTIVITY: {
    GET_STATS: 'productivity:get-stats',
    GET_APP_USAGE: 'productivity:get-app-usage',
    CALCULATE_SCORE: 'productivity:calculate-score',
    GET_CATEGORIES: 'productivity:get-categories',
  },

  // Focus Mode
  FOCUS: {
    START_SESSION: 'focus:start-session',
    PAUSE_SESSION: 'focus:pause-session',
    RESUME_SESSION: 'focus:resume-session',
    END_SESSION: 'focus:end-session',
    GET_ACTIVE_SESSION: 'focus:get-active-session',
  },

  // Recommendations
  RECOMMENDATIONS: {
    GET_ALL: 'recommendations:get-all',
    MARK_READ: 'recommendations:mark-read',
    DISMISS: 'recommendations:dismiss',
    NEW_RECOMMENDATION: 'recommendations:new', // From main to renderer
  },

  // Settings
  SETTINGS: {
    GET_ALL: 'settings:get-all',
    UPDATE: 'settings:update',
    RESET: 'settings:reset',
    SYNC: 'settings:sync',
  },

  // System
  SYSTEM: {
    GET_INFO: 'system:get-info',
    MINIMIZE: 'system:minimize',
    MAXIMIZE: 'system:maximize',
    CLOSE: 'system:close',
    RESTART: 'system:restart',
  },

  // Updates
  UPDATE: {
    CHECK: 'update:check',
    DOWNLOAD: 'update:download',
    INSTALL: 'update:install',
    AVAILABLE: 'update:available',
    DOWNLOADED: 'update:downloaded',
    ERROR: 'update:error',
    PROGRESS: 'update:progress',
  },

  // Sync & Queue
  SYNC: {
    START: 'sync:start',
    STATUS: 'sync:status',
    RETRY: 'sync:retry',
    GET_PENDING: 'sync:get-pending',
  },

  // Notifications
  NOTIFICATION: {
    SHOW: 'notification:show',
    CLEAR: 'notification:clear',
    CLICKED: 'notification:clicked',
  },
} as const;

export type IPCChannelKey = typeof IPC_CHANNELS;

