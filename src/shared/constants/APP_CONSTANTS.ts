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
  PRODUCTIVE: 'PRODUCTIVE',
  NEUTRAL: 'NEUTRAL',
  UNPRODUCTIVE: 'UNPRODUCTIVE',
  BLOCKED: 'BLOCKED',
} as const;

export const ACTIVITY_TYPES = {
  WINDOW_CHANGE: 'WINDOW_CHANGE',
  URL_CHANGE: 'URL_CHANGE',
  IDLE_START: 'IDLE_START',
  IDLE_END: 'IDLE_END',
  SCREENSHOT: 'SCREENSHOT',
  BAD_WEBSITE_DETECTED: 'BAD_WEBSITE_DETECTED',
} as const;

export const NOTIFICATION_TYPES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  SUCCESS: 'SUCCESS',
} as const;

export const FOCUS_SESSION_STATUS = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const SYNC_STATUS = {
  IDLE: 'IDLE',
  SYNCING: 'SYNCING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
} as const;

