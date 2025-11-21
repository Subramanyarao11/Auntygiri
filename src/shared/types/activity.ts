/**
 * Activity Monitoring Types
 * Shared types for real-time activity tracking across main and renderer processes
 */

// Base activity event interface
export interface BaseActivityEvent {
  id: string;
  timestamp: number; // UTC timestamp
  userId?: string;
  sessionId?: string;
}

// Window activity tracking
export interface WindowActivity extends BaseActivityEvent {
  type: 'window';
  appName: string;
  windowTitle: string;
  processName: string;
  processId: number;
  duration: number; // seconds spent in this window
  isActive: boolean;
  platform: 'darwin' | 'win32' | 'linux';
}

// Browser URL tracking
export interface BrowserActivity extends BaseActivityEvent {
  type: 'browser';
  url: string;
  domain: string;
  title: string;
  browserName: string; // 'chrome', 'firefox', 'safari', 'edge'
  tabId?: string;
  isIncognito?: boolean;
}

// Idle/Active state tracking
export interface IdleActivity extends BaseActivityEvent {
  type: 'idle' | 'active';
  idleDuration?: number; // seconds idle (only for idle events)
  lastActiveTimestamp?: number;
  inputType?: 'mouse' | 'keyboard' | 'system';
}

// Focus session tracking
export interface FocusActivity extends BaseActivityEvent {
  type: 'focus_start' | 'focus_end' | 'focus_pause' | 'focus_resume';
  sessionId: string;
  sessionDuration?: number; // total session time in seconds
  focusScore?: number; // 0-100 productivity score
  pauseReason?: 'idle' | 'manual' | 'distraction';
  targetDuration?: number; // planned session duration
}

// Productivity scoring
export interface ProductivityActivity extends BaseActivityEvent {
  type: 'productivity';
  appName: string;
  category: 'productive' | 'neutral' | 'unproductive' | 'blocked';
  score: number; // 0-100
  timeSpent: number; // seconds
  totalProductiveTime: number;
  totalUnproductiveTime: number;
  productivityRatio: number; // productive / total
}

// Union type for all activity events
export type ActivityEvent = 
  | WindowActivity 
  | BrowserActivity 
  | IdleActivity 
  | FocusActivity 
  | ProductivityActivity;

// Activity state enums
export enum ActivityState {
  IDLE = 'idle',
  ACTIVE = 'active',
  FOCUS_ACTIVE = 'focus_active',
  FOCUS_PAUSED = 'focus_paused',
  MONITORING = 'monitoring',
  STOPPED = 'stopped'
}

export enum ProductivityCategory {
  PRODUCTIVE = 'productive',
  NEUTRAL = 'neutral',
  UNPRODUCTIVE = 'unproductive',
  BLOCKED = 'blocked'
}

// Configuration interfaces
export interface ActivityConfig {
  windowTrackingInterval: number; // ms
  browserTrackingInterval: number; // ms
  idleThreshold: number; // seconds
  focusSessionMinDuration: number; // seconds
  productivityUpdateInterval: number; // ms
  enableScreenshots: boolean;
  enableKeylogger: boolean;
}

export interface ProductivityRules {
  productiveApps: string[];
  neutralApps: string[];
  unproductiveApps: string[];
  blockedApps: string[];
  productiveDomains: string[];
  unproductiveDomains: string[];
  blockedDomains: string[];
}

// Focus session interface
export interface FocusSession {
  id: string;
  startTime: number;
  endTime?: number;
  targetDuration: number; // seconds
  actualDuration: number; // seconds
  pausedDuration: number; // seconds
  productivityScore: number;
  distractions: number;
  status: 'active' | 'paused' | 'completed' | 'cancelled';
  activities: ActivityEvent[];
}

// Activity summary interfaces
export interface ActivitySummary {
  date: string; // YYYY-MM-DD
  totalActiveTime: number; // seconds
  totalIdleTime: number; // seconds
  productiveTime: number; // seconds
  unproductiveTime: number; // seconds
  productivityScore: number; // 0-100
  topApps: Array<{
    name: string;
    timeSpent: number;
    category: ProductivityCategory;
  }>;
  topDomains: Array<{
    domain: string;
    timeSpent: number;
    visits: number;
  }>;
  focusSessions: FocusSession[];
}

// Real-time activity stream
export interface ActivityStream {
  currentWindow?: WindowActivity;
  currentBrowser?: BrowserActivity;
  currentState: ActivityState;
  currentFocusSession?: FocusSession;
  todaysSummary: ActivitySummary;
  isTracking: boolean;
  lastUpdate: number;
}

// IPC event payloads
export interface WindowEventPayload {
  event: WindowActivity;
  summary: {
    totalTime: number;
    appTimeMap: Record<string, number>;
  };
}

export interface BrowserEventPayload {
  event: BrowserActivity;
  summary: {
    totalTime: number;
    domainTimeMap: Record<string, number>;
  };
}

export interface IdleEventPayload {
  event: IdleActivity;
  previousState: ActivityState;
  newState: ActivityState;
}

export interface ProductivityEventPayload {
  event: ProductivityActivity;
  dailyStats: {
    productiveTime: number;
    unproductiveTime: number;
    neutralTime: number;
    score: number;
  };
}

export interface FocusEventPayload {
  event: FocusActivity;
  session?: FocusSession;
}

// API request/response types
export interface CreateWindowActivityRequest {
  appName: string;
  windowTitle: string;
  processName: string;
  duration: number;
  timestamp: number;
}

export interface CreateBrowserActivityRequest {
  url: string;
  domain: string;
  title: string;
  browserName: string;
  timestamp: number;
}

export interface StartFocusSessionRequest {
  targetDuration: number; // seconds
  sessionType?: string;
}

export interface EndFocusSessionRequest {
  sessionId: string;
  reason: 'completed' | 'cancelled' | 'interrupted';
}

export interface ActivityApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

// Error types
export class ActivityTrackingError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ActivityTrackingError';
  }
}

export enum ActivityErrorCodes {
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  TRACKING_FAILED = 'TRACKING_FAILED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  API_ERROR = 'API_ERROR',
  FOCUS_SESSION_ERROR = 'FOCUS_SESSION_ERROR'
}
