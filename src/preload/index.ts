/**
 * Preload Script
 * Exposes secure IPC communication bridge to the renderer process
 * This runs in a sandboxed environment with access to both Node.js and renderer APIs
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/IPC_CHANNELS';
import type {
  LoginCredentials,
  AuthResponse,
  ActivityEntry,
  Screenshot,
  ProductivityStats,
  AppSettings,
  FocusSession,
  Recommendation,
  BadWebsite,
  SyncState,
  SystemInfo,
  WindowInfo,
} from '../shared/types';

// Define the API structure
export interface ElectronAPI {
  // Authentication
  auth: {
    login: (credentials: LoginCredentials) => Promise<AuthResponse>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<AuthResponse>;
    getStoredToken: () => Promise<string | null>;
    checkAuthStatus: () => Promise<boolean>;
  };

  // Activity Monitoring
  monitoring: {
    start: () => Promise<void>;
    stop: () => Promise<void>;
    getCurrentWindow: () => Promise<WindowInfo | null>;
    getActivityLog: (startDate: string, endDate: string) => Promise<ActivityEntry[]>;
    onActivityUpdate: (callback: (activity: ActivityEntry) => void) => () => void;
    onIdleStatusChanged: (callback: (isIdle: boolean) => void) => () => void;
  };

  // Screenshots
  screenshot: {
    capture: () => Promise<Screenshot>;
    getAll: (startDate: string, endDate: string) => Promise<Screenshot[]>;
    delete: (id: string) => Promise<void>;
    upload: (id: string) => Promise<void>;
    getPending: () => Promise<Screenshot[]>;
  };

  // Bad Website Detection
  badWebsite: {
    check: (url: string) => Promise<BadWebsite | null>;
    getList: () => Promise<BadWebsite[]>;
    updateList: (websites: BadWebsite[]) => Promise<void>;
    onAlert: (callback: (alert: { domain: string; url: string }) => void) => () => void;
  };

  // Productivity
  productivity: {
    getStats: (startDate: string, endDate: string) => Promise<ProductivityStats>;
    getAppUsage: (date: string) => Promise<unknown>;
    calculateScore: (activities: ActivityEntry[]) => Promise<number>;
  };

  // Focus Mode
  focus: {
    startSession: (duration: number) => Promise<FocusSession>;
    pauseSession: () => Promise<void>;
    resumeSession: () => Promise<void>;
    endSession: () => Promise<FocusSession>;
    getActiveSession: () => Promise<FocusSession | null>;
  };

  // Recommendations
  recommendations: {
    getAll: () => Promise<Recommendation[]>;
    markRead: (id: string) => Promise<void>;
    dismiss: (id: string) => Promise<void>;
    onNewRecommendation: (callback: (recommendation: Recommendation) => void) => () => void;
  };

  // Settings
  settings: {
    getAll: () => Promise<AppSettings>;
    update: (settings: Partial<AppSettings>) => Promise<AppSettings>;
    reset: () => Promise<AppSettings>;
    sync: () => Promise<void>;
  };

  // System
  system: {
    getInfo: () => Promise<SystemInfo>;
    minimize: () => void;
    maximize: () => void;
    close: () => void;
    restart: () => void;
  };

  // Updates
  update: {
    check: () => Promise<void>;
    download: () => Promise<void>;
    install: () => void;
    onAvailable: (callback: (version: string) => void) => () => void;
    onDownloaded: (callback: () => void) => () => void;
    onError: (callback: (error: string) => void) => () => void;
    onProgress: (callback: (progress: number) => void) => () => void;
  };

  // Sync
  sync: {
    start: () => Promise<void>;
    getStatus: () => Promise<SyncState>;
    retry: () => Promise<void>;
    getPending: () => Promise<unknown[]>;
  };

  // Notifications
  notification: {
    show: (title: string, message: string) => void;
    onClicked: (callback: () => void) => () => void;
  };
}

// Create the API object
const electronAPI: ElectronAPI = {
  // ============ Authentication ============
  auth: {
    login: (credentials) => ipcRenderer.invoke(IPC_CHANNELS.AUTH.LOGIN, credentials),
    logout: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH.LOGOUT),
    refreshToken: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH.REFRESH_TOKEN),
    getStoredToken: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH.GET_STORED_TOKEN),
    checkAuthStatus: () => ipcRenderer.invoke(IPC_CHANNELS.AUTH.CHECK_AUTH_STATUS),
  },

  // ============ Activity Monitoring ============
  monitoring: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.MONITORING.START),
    stop: () => ipcRenderer.invoke(IPC_CHANNELS.MONITORING.STOP),
    getCurrentWindow: () => ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_CURRENT_WINDOW),
    getActivityLog: (startDate, endDate) =>
      ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_ACTIVITY_LOG, { startDate, endDate }),
    onActivityUpdate: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, activity: ActivityEntry) =>
        callback(activity);
      ipcRenderer.on(IPC_CHANNELS.MONITORING.UPDATE_ACTIVITY, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.UPDATE_ACTIVITY, listener);
    },
    onIdleStatusChanged: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, isIdle: boolean) => callback(isIdle);
      ipcRenderer.on(IPC_CHANNELS.MONITORING.IDLE_STATUS_CHANGED, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.IDLE_STATUS_CHANGED, listener);
    },
  },

  // ============ Screenshots ============
  screenshot: {
    capture: () => ipcRenderer.invoke(IPC_CHANNELS.SCREENSHOT.CAPTURE),
    getAll: (startDate, endDate) =>
      ipcRenderer.invoke(IPC_CHANNELS.SCREENSHOT.GET_ALL, { startDate, endDate }),
    delete: (id) => ipcRenderer.invoke(IPC_CHANNELS.SCREENSHOT.DELETE, id),
    upload: (id) => ipcRenderer.invoke(IPC_CHANNELS.SCREENSHOT.UPLOAD, id),
    getPending: () => ipcRenderer.invoke(IPC_CHANNELS.SCREENSHOT.GET_PENDING),
  },

  // ============ Bad Website Detection ============
  badWebsite: {
    check: (url) => ipcRenderer.invoke(IPC_CHANNELS.BAD_WEBSITE.CHECK, url),
    getList: () => ipcRenderer.invoke(IPC_CHANNELS.BAD_WEBSITE.GET_LIST),
    updateList: (websites) => ipcRenderer.invoke(IPC_CHANNELS.BAD_WEBSITE.UPDATE_LIST, websites),
    onAlert: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, alert: { domain: string; url: string }) =>
        callback(alert);
      ipcRenderer.on(IPC_CHANNELS.BAD_WEBSITE.ALERT, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.BAD_WEBSITE.ALERT, listener);
    },
  },

  // ============ Productivity ============
  productivity: {
    getStats: (startDate, endDate) =>
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTIVITY.GET_STATS, { startDate, endDate }),
    getAppUsage: (date) => ipcRenderer.invoke(IPC_CHANNELS.PRODUCTIVITY.GET_APP_USAGE, date),
    calculateScore: (activities) =>
      ipcRenderer.invoke(IPC_CHANNELS.PRODUCTIVITY.CALCULATE_SCORE, activities),
  },

  // ============ Focus Mode ============
  focus: {
    startSession: (duration) => ipcRenderer.invoke(IPC_CHANNELS.FOCUS.START_SESSION, duration),
    pauseSession: () => ipcRenderer.invoke(IPC_CHANNELS.FOCUS.PAUSE_SESSION),
    resumeSession: () => ipcRenderer.invoke(IPC_CHANNELS.FOCUS.RESUME_SESSION),
    endSession: () => ipcRenderer.invoke(IPC_CHANNELS.FOCUS.END_SESSION),
    getActiveSession: () => ipcRenderer.invoke(IPC_CHANNELS.FOCUS.GET_ACTIVE_SESSION),
  },

  // ============ Recommendations ============
  recommendations: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.RECOMMENDATIONS.GET_ALL),
    markRead: (id) => ipcRenderer.invoke(IPC_CHANNELS.RECOMMENDATIONS.MARK_READ, id),
    dismiss: (id) => ipcRenderer.invoke(IPC_CHANNELS.RECOMMENDATIONS.DISMISS, id),
    onNewRecommendation: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, recommendation: Recommendation) =>
        callback(recommendation);
      ipcRenderer.on(IPC_CHANNELS.RECOMMENDATIONS.NEW_RECOMMENDATION, listener);
      return () =>
        ipcRenderer.removeListener(IPC_CHANNELS.RECOMMENDATIONS.NEW_RECOMMENDATION, listener);
    },
  },

  // ============ Settings ============
  settings: {
    getAll: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.GET_ALL),
    update: (settings) => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.UPDATE, settings),
    reset: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.RESET),
    sync: () => ipcRenderer.invoke(IPC_CHANNELS.SETTINGS.SYNC),
  },

  // ============ System ============
  system: {
    getInfo: () => ipcRenderer.invoke(IPC_CHANNELS.SYSTEM.GET_INFO),
    minimize: () => ipcRenderer.send(IPC_CHANNELS.SYSTEM.MINIMIZE),
    maximize: () => ipcRenderer.send(IPC_CHANNELS.SYSTEM.MAXIMIZE),
    close: () => ipcRenderer.send(IPC_CHANNELS.SYSTEM.CLOSE),
    restart: () => ipcRenderer.send(IPC_CHANNELS.SYSTEM.RESTART),
  },

  // ============ Updates ============
  update: {
    check: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE.CHECK),
    download: () => ipcRenderer.invoke(IPC_CHANNELS.UPDATE.DOWNLOAD),
    install: () => ipcRenderer.send(IPC_CHANNELS.UPDATE.INSTALL),
    onAvailable: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, version: string) => callback(version);
      ipcRenderer.on(IPC_CHANNELS.UPDATE.AVAILABLE, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.AVAILABLE, listener);
    },
    onDownloaded: (callback) => {
      const listener = () => callback();
      ipcRenderer.on(IPC_CHANNELS.UPDATE.DOWNLOADED, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.DOWNLOADED, listener);
    },
    onError: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
      ipcRenderer.on(IPC_CHANNELS.UPDATE.ERROR, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.ERROR, listener);
    },
    onProgress: (callback) => {
      const listener = (_event: Electron.IpcRendererEvent, progress: number) => callback(progress);
      ipcRenderer.on(IPC_CHANNELS.UPDATE.PROGRESS, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.UPDATE.PROGRESS, listener);
    },
  },

  // ============ Sync ============
  sync: {
    start: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC.START),
    getStatus: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC.STATUS),
    retry: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC.RETRY),
    getPending: () => ipcRenderer.invoke(IPC_CHANNELS.SYNC.GET_PENDING),
  },

  // ============ Notifications ============
  notification: {
    show: (title, message) => ipcRenderer.send(IPC_CHANNELS.NOTIFICATION.SHOW, { title, message }),
    onClicked: (callback) => {
      const listener = () => callback();
      ipcRenderer.on(IPC_CHANNELS.NOTIFICATION.CLICKED, listener);
      return () => ipcRenderer.removeListener(IPC_CHANNELS.NOTIFICATION.CLICKED, listener);
    },
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electron', electronAPI);

// TypeScript declaration for the window object
declare global {
  interface Window {
    electron: ElectronAPI;
  }
}

