/**
 * Application-wide constants
 */

export const APP_CONFIG = {
  APP_NAME: 'Student Monitor',
  APP_VERSION: '1.0.0',
  
  // Monitoring intervals (in milliseconds)
  ACTIVITY_CHECK_INTERVAL: 60000, // 1 minute
  SCREENSHOT_INTERVAL: 300000, // 5 minutes
  IDLE_DETECTION_INTERVAL: 5000, // 5 seconds
  IDLE_THRESHOLD: 300000, // 5 minutes of inactivity
  
  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 5000, // 5 seconds
  
  // Screenshot Configuration
  SCREENSHOT_QUALITY: 80, // JPEG quality (0-100)
  MAX_SCREENSHOT_SIZE: 5242880, // 5MB in bytes
  SCREENSHOT_FORMAT: 'jpeg' as const,
  
  // Storage Configuration
  MAX_ACTIVITY_LOG_SIZE: 10000, // Maximum number of activity entries
  MAX_SCREENSHOT_CACHE: 100, // Maximum number of screenshots to keep locally
  
  // Security
  TOKEN_EXPIRY_BUFFER: 300000, // 5 minutes before token expiry to refresh
  MAX_LOGIN_ATTEMPTS: 5,
  LOCKOUT_DURATION: 900000, // 15 minutes
} as const;

export const PRODUCTIVITY_CATEGORIES = {
  PRODUCTIVE: 'productive',
  NEUTRAL: 'neutral',
  UNPRODUCTIVE: 'unproductive',
  BLOCKED: 'blocked',
} as const;

export const ACTIVITY_TYPES = {
  WINDOW_CHANGE: 'window_change',
  URL_CHANGE: 'url_change',
  IDLE_START: 'idle_start',
  IDLE_END: 'idle_end',
  SCREENSHOT: 'screenshot',
  BAD_WEBSITE_DETECTED: 'bad_website_detected',
} as const;

export const NOTIFICATION_TYPES = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  SUCCESS: 'success',
} as const;

export const FOCUS_SESSION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const;

export const SYNC_STATUS = {
  IDLE: 'idle',
  SYNCING: 'syncing',
  SUCCESS: 'success',
  ERROR: 'error',
} as const;

