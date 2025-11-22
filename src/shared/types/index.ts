/**
 * Shared type definitions used across main and renderer processes
 */

import { PRODUCTIVITY_CATEGORIES, ACTIVITY_TYPES, NOTIFICATION_TYPES, FOCUS_SESSION_STATUS, SYNC_STATUS } from '../constants/APP_CONSTANTS';

// ============ Authentication Types ============
export interface User {
  id: string;
  email: string;
  username: string;
  role: 'student' | 'parent' | 'admin';
  parent_id?: string | null;
  student_standard?: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_active?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt?: number;
  expiresIn?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterParentStudentData {
  parent_name: string;
  parent_email: string;
  parent_password: string;
  student_name: string;
  student_email: string;
  student_password: string;
  student_standard: number;
  section?: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  parent?: User;
  student?: User;
  primaryUser?: User;
}

// ============ Activity Monitoring Types ============
export interface WindowInfo {
  title: string;
  owner: {
    name: string;
    path: string;
  };
  url?: string;
  timestamp: number;
}

export interface ActivityEntry {
  id: string;
  type: keyof typeof ACTIVITY_TYPES;
  timestamp: number;
  windowTitle?: string;
  applicationName?: string;
  url?: string;
  duration?: number;
  category?: keyof typeof PRODUCTIVITY_CATEGORIES;
  metadata?: Record<string, unknown>;
}

export interface ActivityLog {
  date: string;
  entries: ActivityEntry[];
  totalActiveTime: number;
  totalIdleTime: number;
  productivityScore: number;
}

// ============ Screenshot Types ============
export interface Screenshot {
  id: string;
  filePath: string;
  timestamp: number;
  size: number;
  uploaded: boolean;
  uploadedAt?: number;
  windowTitle?: string;
  applicationName?: string;
  url?: string;
}

export interface ScreenshotConfig {
  enabled: boolean;
  interval: number;
  quality: number;
  uploadImmediately: boolean;
}

// ============ Productivity Types ============
export interface ProductivityStats {
  date: string;
  totalTime: number;
  productiveTime: number;
  neutralTime: number;
  unproductiveTime: number;
  idleTime: number;
  productivityScore: number;
  topApps: AppUsage[];
  hourlyBreakdown: HourlyProductivity[];
}

export interface AppUsage {
  name: string;
  time: number;
  category: keyof typeof PRODUCTIVITY_CATEGORIES;
  percentage: number;
}

export interface HourlyProductivity {
  hour: number;
  productiveTime: number;
  unproductiveTime: number;
  neutralTime: number;
  idleTime: number;
}

export interface AppCategory {
  name: string;
  category: keyof typeof PRODUCTIVITY_CATEGORIES;
  patterns: string[];
}

// ============ Bad Website Types ============
export interface BadWebsite {
  id: string;
  domain: string;
  category: string;
  severity: 'low' | 'medium' | 'high';
  blocked: boolean;
}

export interface BadWebsiteAlert {
  id: string;
  websiteId: string;
  domain: string;
  url: string;
  timestamp: number;
  duration: number;
  dismissed: boolean;
}

// ============ Focus Mode Types ============
export interface FocusSession {
  id: string;
  startTime: number;
  endTime?: number;
  plannedDuration: number;
  actualDuration: number;
  pausedDuration: number;
  status: keyof typeof FOCUS_SESSION_STATUS;
  pausedAt?: number;
  breaks: FocusBreak[];
}

export interface FocusBreak {
  startTime: number;
  endTime: number;
  duration: number;
}

// ============ Recommendations Types ============
export interface Recommendation {
  id: string;
  type: 'productivity' | 'health' | 'learning' | 'alert';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  dismissed: boolean;
  actionUrl?: string;
  priority: 'low' | 'medium' | 'high';
}

// ============ Settings Types ============
export interface AppSettings {
  general: GeneralSettings;
  monitoring: MonitoringSettings;
  screenshots: ScreenshotSettings;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
}

export interface GeneralSettings {
  startOnBoot: boolean;
  minimizeToTray: boolean;
  theme: 'light' | 'dark' | 'system';
  language: string;
}

export interface MonitoringSettings {
  enabled: boolean;
  trackUrls: boolean;
  trackApplications: boolean;
  idleDetection: boolean;
  idleThreshold: number;
}

export interface ScreenshotSettings {
  enabled: boolean;
  interval: number;
  quality: number;
  uploadImmediately: boolean;
  notifyOnCapture: boolean;
}

export interface NotificationSettings {
  enabled: boolean;
  badWebsiteAlerts: boolean;
  productivityReminders: boolean;
  focusModeReminders: boolean;
  sound: boolean;
}

export interface PrivacySettings {
  blurSensitiveInfo: boolean;
  excludeApps: string[];
  excludeDomains: string[];
}

// ============ Sync & Queue Types ============
export interface SyncQueueItem {
  id: string;
  type: 'activity' | 'screenshot' | 'focus-session' | 'bad-website-alert';
  data: unknown;
  timestamp: number;
  retryCount: number;
  lastAttempt?: number;
  error?: string;
}

export interface SyncState {
  status: keyof typeof SYNC_STATUS;
  lastSync?: number;
  pendingItems: number;
  failedItems: number;
}

// ============ Notification Types ============
export interface AppNotification {
  id: string;
  type: keyof typeof NOTIFICATION_TYPES;
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  actionUrl?: string;
}

// ============ System Types ============
export interface SystemInfo {
  platform: string;
  arch: string;
  version: string;
  hostname: string;
  totalMemory: number;
  freeMemory: number;
}

// ============ API Response Types ============
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============ Error Types ============
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: number;
}

