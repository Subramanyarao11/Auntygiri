/**
 * Monitoring Preload Bridge
 * Secure IPC bridge for activity monitoring between main and renderer processes
 */

import { contextBridge, ipcRenderer } from 'electron';
import { IPC_CHANNELS } from '../shared/constants/IPC_CHANNELS';
import { 
  WindowEventPayload,
  BrowserEventPayload,
  IdleEventPayload,
  FocusEventPayload,
  ProductivityEventPayload,
  FocusSession
} from '../shared/types/activity';

// Define the monitoring API interface
export interface MonitoringAPI {
  // Event listeners
  onWindowEvent: (callback: (payload: WindowEventPayload) => void) => () => void;
  onBrowserEvent: (callback: (payload: BrowserEventPayload) => void) => () => void;
  onIdleEvent: (callback: (payload: IdleEventPayload) => void) => () => void;
  onActiveEvent: (callback: (payload: IdleEventPayload) => void) => () => void;
  onFocusEvent: (callback: (payload: FocusEventPayload) => void) => () => void;
  onProductivityUpdate: (callback: (payload: ProductivityEventPayload) => void) => () => void;
  onMetricsUpdate: (callback: (payload: { metrics: any; timestamp: number }) => void) => () => void;

  // Control methods
  startWindowTracking: (intervalMs?: number) => Promise<boolean>;
  stopWindowTracking: () => Promise<boolean>;
  startBrowserTracking: (intervalMs?: number) => Promise<boolean>;
  stopBrowserTracking: () => Promise<boolean>;
  startIdleMonitor: (idleThresholdSeconds?: number) => Promise<boolean>;
  stopIdleMonitor: () => Promise<boolean>;
  startMetricsTracking: (intervalMs?: number) => Promise<boolean>;
  stopMetricsTracking: () => Promise<boolean>;

  // Focus session management
  startFocusSession: (targetDurationSeconds: number, sessionType?: string) => Promise<string>;
  endFocusSession: (reason?: 'completed' | 'cancelled' | 'interrupted') => Promise<FocusSession | null>;
  pauseFocusSession: (reason?: 'idle' | 'manual' | 'distraction') => Promise<boolean>;
  resumeFocusSession: () => Promise<boolean>;
  getCurrentFocusSession: () => Promise<FocusSession | null>;

  // Data retrieval
  getWindowTrackingState: () => Promise<{ isTracking: boolean; appTimeMap: Record<string, number> }>;
  getBrowserTrackingState: () => Promise<{ isTracking: boolean; domainTimeMap: Record<string, number> }>;
  getIdleState: () => Promise<{ isIdle: boolean; totalIdleTime: number; totalActiveTime: number }>;
  getProductivityStats: () => Promise<{
    productiveTime: number;
    unproductiveTime: number;
    neutralTime: number;
    score: number;
    totalTime: number;
  }>;
  getCurrentMetrics: () => Promise<any>;

  // Configuration
  updateProductivityRules: (rules: {
    productiveApps?: string[];
    unproductiveApps?: string[];
    productiveDomains?: string[];
    unproductiveDomains?: string[];
  }) => Promise<boolean>;

  // Utility methods
  resetTrackingData: () => Promise<boolean>;
  exportActivityData: (startDate: string, endDate: string) => Promise<any>;
}

// Create the monitoring API
const monitoringAPI: MonitoringAPI = {
  // Event listeners with automatic cleanup
  onWindowEvent: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: WindowEventPayload) => {
      callback(payload);
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.WINDOW_EVENT, handler);
    
    // Return cleanup function
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.WINDOW_EVENT, handler);
    };
  },

  onBrowserEvent: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: BrowserEventPayload) => {
      callback(payload);
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.URL_EVENT, handler);
    
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.URL_EVENT, handler);
    };
  },

  onIdleEvent: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: IdleEventPayload) => {
      if (payload.event.type === 'idle') {
        callback(payload);
      }
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.IDLE_EVENT, handler);
    
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.IDLE_EVENT, handler);
    };
  },

  onActiveEvent: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: IdleEventPayload) => {
      if (payload.event.type === 'active') {
        callback(payload);
      }
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.IDLE_EVENT, handler);
    
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.IDLE_EVENT, handler);
    };
  },

  onFocusEvent: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: FocusEventPayload) => {
      callback(payload);
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.FOCUS_EVENT, handler);
    
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.FOCUS_EVENT, handler);
    };
  },

  onProductivityUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: ProductivityEventPayload) => {
      callback(payload);
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.PRODUCTIVITY_UPDATE, handler);
    
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.PRODUCTIVITY_UPDATE, handler);
    };
  },

  onMetricsUpdate: (callback) => {
    const handler = (_event: Electron.IpcRendererEvent, payload: { metrics: any; timestamp: number }) => {
      callback(payload);
    };
    
    ipcRenderer.on(IPC_CHANNELS.MONITORING.METRICS_UPDATE, handler);
    
    return () => {
      ipcRenderer.removeListener(IPC_CHANNELS.MONITORING.METRICS_UPDATE, handler);
    };
  },

  // Control methods
  startWindowTracking: (intervalMs = 10000) => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.START_WINDOW_TRACKING, intervalMs);
  },

  stopWindowTracking: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.STOP_WINDOW_TRACKING);
  },

  startBrowserTracking: (intervalMs = 10000) => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.START_BROWSER_TRACKING, intervalMs);
  },

  stopBrowserTracking: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.STOP_BROWSER_TRACKING);
  },

  startIdleMonitor: (idleThresholdSeconds = 60) => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.START_IDLE_MONITOR, idleThresholdSeconds);
  },

  stopIdleMonitor: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.STOP_IDLE_MONITOR);
  },

  startMetricsTracking: (intervalMs = 30000) => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.START_METRICS_TRACKING, intervalMs);
  },

  stopMetricsTracking: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.STOP_METRICS_TRACKING);
  },

  // Focus session management
  startFocusSession: (targetDurationSeconds, sessionType = 'general') => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.START_FOCUS_SESSION, {
      targetDurationSeconds,
      sessionType
    });
  },

  endFocusSession: (reason = 'completed') => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.END_FOCUS_SESSION, reason);
  },

  pauseFocusSession: (reason = 'manual') => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.PAUSE_FOCUS_SESSION, reason);
  },

  resumeFocusSession: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.RESUME_FOCUS_SESSION);
  },

  getCurrentFocusSession: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_CURRENT_FOCUS_SESSION);
  },

  // Data retrieval
  getWindowTrackingState: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_WINDOW_TRACKING_STATE);
  },

  getBrowserTrackingState: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_BROWSER_TRACKING_STATE);
  },

  getIdleState: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_IDLE_STATE);
  },

  getProductivityStats: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_PRODUCTIVITY_STATS);
  },

  getCurrentMetrics: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.GET_CURRENT_METRICS);
  },

  // Configuration
  updateProductivityRules: (rules) => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.UPDATE_PRODUCTIVITY_RULES, rules);
  },

  // Utility methods
  resetTrackingData: () => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.RESET_TRACKING_DATA);
  },

  exportActivityData: (startDate, endDate) => {
    return ipcRenderer.invoke(IPC_CHANNELS.MONITORING.EXPORT_ACTIVITY_DATA, {
      startDate,
      endDate
    });
  }
};

// Expose the monitoring API to the renderer process
contextBridge.exposeInMainWorld('monitoring', monitoringAPI);

// Also expose individual event listeners for convenience
contextBridge.exposeInMainWorld('monitoringEvents', {
  // Simplified event listeners that return promises
  waitForWindowEvent: (): Promise<WindowEventPayload> => {
    return new Promise((resolve) => {
      const cleanup = monitoringAPI.onWindowEvent((payload) => {
        cleanup();
        resolve(payload);
      });
    });
  },

  waitForBrowserEvent: (): Promise<BrowserEventPayload> => {
    return new Promise((resolve) => {
      const cleanup = monitoringAPI.onBrowserEvent((payload) => {
        cleanup();
        resolve(payload);
      });
    });
  },

  waitForIdleEvent: (): Promise<IdleEventPayload> => {
    return new Promise((resolve) => {
      const cleanup = monitoringAPI.onIdleEvent((payload) => {
        cleanup();
        resolve(payload);
      });
    });
  },

  waitForFocusEvent: (): Promise<FocusEventPayload> => {
    return new Promise((resolve) => {
      const cleanup = monitoringAPI.onFocusEvent((payload) => {
        cleanup();
        resolve(payload);
      });
    });
  },

  waitForProductivityUpdate: (): Promise<ProductivityEventPayload> => {
    return new Promise((resolve) => {
      const cleanup = monitoringAPI.onProductivityUpdate((payload) => {
        cleanup();
        resolve(payload);
      });
    });
  }
});

// Type definitions for the global window object
declare global {
  interface Window {
    monitoring: MonitoringAPI;
    monitoringEvents: {
      waitForWindowEvent: () => Promise<WindowEventPayload>;
      waitForBrowserEvent: () => Promise<BrowserEventPayload>;
      waitForIdleEvent: () => Promise<IdleEventPayload>;
      waitForFocusEvent: () => Promise<FocusEventPayload>;
      waitForProductivityUpdate: () => Promise<ProductivityEventPayload>;
    };
  }
}

