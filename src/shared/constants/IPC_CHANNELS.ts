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
    START: 'monitoring:start',
    STOP: 'monitoring:stop',
    GET_CURRENT_WINDOW: 'monitoring:get-current-window',
    GET_ACTIVITY_LOG: 'monitoring:get-activity-log',
    UPDATE_ACTIVITY: 'monitoring:update-activity',
    IDLE_STATUS_CHANGED: 'monitoring:idle-status-changed',
  },

  // Screenshots
  SCREENSHOT: {
    CAPTURE: 'screenshot:capture',
    GET_ALL: 'screenshot:get-all',
    DELETE: 'screenshot:delete',
    UPLOAD: 'screenshot:upload',
    GET_PENDING: 'screenshot:get-pending',
    MARK_UPLOADED: 'screenshot:mark-uploaded',
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

