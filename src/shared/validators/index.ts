/**
 * Validation schemas using Zod
 * Used for validating data passed between main and renderer processes
 */

import { z } from 'zod';

// ============ Authentication Validators ============
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  rememberMe: z.boolean().optional(),
});

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['student', 'teacher', 'admin']),
  studentId: z.string().optional(),
  avatar: z.string().optional(),
});

// ============ Activity Validators ============
export const ActivityEntrySchema = z.object({
  id: z.string(),
  type: z.enum(['window_change', 'url_change', 'idle_start', 'idle_end', 'screenshot', 'bad_website_detected']),
  timestamp: z.number(),
  windowTitle: z.string().optional(),
  applicationName: z.string().optional(),
  url: z.string().optional(),
  duration: z.number().optional(),
  category: z.enum(['productive', 'neutral', 'unproductive', 'blocked']).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// ============ Screenshot Validators ============
export const ScreenshotConfigSchema = z.object({
  enabled: z.boolean(),
  interval: z.number().min(60000, 'Minimum interval is 1 minute'),
  quality: z.number().min(1).max(100),
  uploadImmediately: z.boolean(),
});

// ============ Settings Validators ============
export const GeneralSettingsSchema = z.object({
  startOnBoot: z.boolean(),
  minimizeToTray: z.boolean(),
  theme: z.enum(['light', 'dark', 'system']),
  language: z.string(),
});

export const MonitoringSettingsSchema = z.object({
  enabled: z.boolean(),
  trackUrls: z.boolean(),
  trackApplications: z.boolean(),
  idleDetection: z.boolean(),
  idleThreshold: z.number().min(60000, 'Minimum idle threshold is 1 minute'),
});

export const ScreenshotSettingsSchema = z.object({
  enabled: z.boolean(),
  interval: z.number().min(60000),
  quality: z.number().min(1).max(100),
  uploadImmediately: z.boolean(),
  notifyOnCapture: z.boolean(),
});

export const NotificationSettingsSchema = z.object({
  enabled: z.boolean(),
  badWebsiteAlerts: z.boolean(),
  productivityReminders: z.boolean(),
  focusModeReminders: z.boolean(),
  sound: z.boolean(),
});

export const PrivacySettingsSchema = z.object({
  blurSensitiveInfo: z.boolean(),
  excludeApps: z.array(z.string()),
  excludeDomains: z.array(z.string()),
});

export const AppSettingsSchema = z.object({
  general: GeneralSettingsSchema,
  monitoring: MonitoringSettingsSchema,
  screenshots: ScreenshotSettingsSchema,
  notifications: NotificationSettingsSchema,
  privacy: PrivacySettingsSchema,
});

// ============ Focus Mode Validators ============
export const FocusSessionSchema = z.object({
  id: z.string(),
  startTime: z.number(),
  endTime: z.number().optional(),
  plannedDuration: z.number().min(60000, 'Minimum session duration is 1 minute'),
  actualDuration: z.number(),
  pausedDuration: z.number(),
  status: z.enum(['active', 'paused', 'completed', 'cancelled']),
  pausedAt: z.number().optional(),
  breaks: z.array(z.object({
    startTime: z.number(),
    endTime: z.number(),
    duration: z.number(),
  })),
});

// ============ Helper Functions ============
export function validateData<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; error: string } {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: 'Validation failed' };
  }
}

export function sanitizeString(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .trim()
    .substring(0, 1000); // Limit length
}

export function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.href;
  } catch {
    return '';
  }
}

