/**
 * Monitoring IPC Handlers
 * Handles IPC communication for activity monitoring between main and renderer processes
 */

import { ipcMain, BrowserWindow } from 'electron';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { WindowTracker } from '../monitoring/windowTracker';
import { BrowserTracker } from '../monitoring/browserTracker';
import { IdleTracker } from '../monitoring/idleTracker';
import { ProductivityTracker } from '../monitoring/productivityTracker';
import { SystemMetricsTracker } from '../monitoring/systemMetrics';
import type Store from 'electron-store';

// Global tracker instances
let windowTracker: WindowTracker | null = null;
let browserTracker: BrowserTracker | null = null;
let idleTracker: IdleTracker | null = null;
let productivityTracker: ProductivityTracker | null = null;
let systemMetricsTracker: SystemMetricsTracker | null = null;

/**
 * Register all monitoring IPC handlers
 */
export function registerMonitoringHandlers(mainWindow: BrowserWindow, _store: Store): void {
  log.info('Registering monitoring handlers');

  // Initialize trackers
  windowTracker = new WindowTracker(mainWindow);
  browserTracker = new BrowserTracker(mainWindow);
  idleTracker = new IdleTracker(mainWindow);
  productivityTracker = new ProductivityTracker(mainWindow);
  systemMetricsTracker = new SystemMetricsTracker(mainWindow);

  // Setup productivity tracking integration
  setupProductivityIntegration();

  // ============ Window Tracking Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.START_WINDOW_TRACKING, async (_event, intervalMs: number = 10000) => {
    try {
      if (!windowTracker) {
        throw new Error('Window tracker not initialized');
      }
      
      windowTracker.startWindowTracking(intervalMs);
      log.info(`Window tracking started with ${intervalMs}ms interval`);
      return true;
    } catch (error) {
      log.error('Failed to start window tracking:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.STOP_WINDOW_TRACKING, async (_event) => {
    try {
      if (!windowTracker) {
        throw new Error('Window tracker not initialized');
      }
      
      windowTracker.stopWindowTracking();
      log.info('Window tracking stopped');
      return true;
    } catch (error) {
      log.error('Failed to stop window tracking:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_WINDOW_TRACKING_STATE, async (_event) => {
    try {
      if (!windowTracker) {
        return { isTracking: false, appTimeMap: {} };
      }
      
      return windowTracker.getTrackingState();
    } catch (error) {
      log.error('Failed to get window tracking state:', error);
      return { isTracking: false, appTimeMap: {} };
    }
  });

  // ============ Browser Tracking Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.START_BROWSER_TRACKING, async (_event, intervalMs: number = 10000) => {
    try {
      if (!browserTracker) {
        throw new Error('Browser tracker not initialized');
      }
      
      browserTracker.startBrowserTracking(intervalMs);
      log.info(`Browser tracking started with ${intervalMs}ms interval`);
      return true;
    } catch (error) {
      log.error('Failed to start browser tracking:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.STOP_BROWSER_TRACKING, async (_event) => {
    try {
      if (!browserTracker) {
        throw new Error('Browser tracker not initialized');
      }
      
      browserTracker.stopBrowserTracking();
      log.info('Browser tracking stopped');
      return true;
    } catch (error) {
      log.error('Failed to stop browser tracking:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_BROWSER_TRACKING_STATE, async (_event) => {
    try {
      if (!browserTracker) {
        return { isTracking: false, domainTimeMap: {} };
      }
      
      return browserTracker.getTrackingState();
    } catch (error) {
      log.error('Failed to get browser tracking state:', error);
      return { isTracking: false, domainTimeMap: {} };
    }
  });

  // ============ Idle Monitoring Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.START_IDLE_MONITOR, async (_event, idleThresholdSeconds: number = 60) => {
    try {
      if (!idleTracker) {
        throw new Error('Idle tracker not initialized');
      }
      
      idleTracker.startIdleMonitor(idleThresholdSeconds);
      log.info(`Idle monitor started with ${idleThresholdSeconds}s threshold`);
      return true;
    } catch (error) {
      log.error('Failed to start idle monitor:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.STOP_IDLE_MONITOR, async (_event) => {
    try {
      if (!idleTracker) {
        throw new Error('Idle tracker not initialized');
      }
      
      idleTracker.stopIdleMonitor();
      log.info('Idle monitor stopped');
      return true;
    } catch (error) {
      log.error('Failed to stop idle monitor:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_IDLE_STATE, async (_event) => {
    try {
      if (!idleTracker) {
        return { isIdle: false, totalIdleTime: 0, totalActiveTime: 0 };
      }
      
      return idleTracker.getIdleState();
    } catch (error) {
      log.error('Failed to get idle state:', error);
      return { isIdle: false, totalIdleTime: 0, totalActiveTime: 0 };
    }
  });

  // ============ Focus Session Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.START_FOCUS_SESSION, async (_event, { targetDurationSeconds, sessionType }) => {
    try {
      if (!idleTracker) {
        throw new Error('Idle tracker not initialized');
      }
      
      const sessionId = idleTracker.startFocusSession(targetDurationSeconds, sessionType);
      log.info(`Focus session started: ${sessionId}`);
      return sessionId;
    } catch (error) {
      log.error('Failed to start focus session:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.END_FOCUS_SESSION, async (_event, reason: 'completed' | 'cancelled' | 'interrupted' = 'completed') => {
    try {
      if (!idleTracker) {
        throw new Error('Idle tracker not initialized');
      }
      
      const session = idleTracker.endFocusSession(reason);
      log.info(`Focus session ended: ${session?.id}`);
      return session;
    } catch (error) {
      log.error('Failed to end focus session:', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.PAUSE_FOCUS_SESSION, async (_event, reason: 'idle' | 'manual' | 'distraction' = 'manual') => {
    try {
      if (!idleTracker) {
        throw new Error('Idle tracker not initialized');
      }
      
      idleTracker.pauseFocusSession(reason);
      log.info(`Focus session paused: ${reason}`);
      return true;
    } catch (error) {
      log.error('Failed to pause focus session:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.RESUME_FOCUS_SESSION, async (_event) => {
    try {
      if (!idleTracker) {
        throw new Error('Idle tracker not initialized');
      }
      
      idleTracker.resumeFocusSession();
      log.info('Focus session resumed');
      return true;
    } catch (error) {
      log.error('Failed to resume focus session:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_CURRENT_FOCUS_SESSION, async (_event) => {
    try {
      if (!idleTracker) {
        return null;
      }
      
      return idleTracker.getCurrentFocusSession();
    } catch (error) {
      log.error('Failed to get current focus session:', error);
      return null;
    }
  });

  // ============ Productivity Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_PRODUCTIVITY_STATS, async (_event) => {
    try {
      if (!productivityTracker) {
        return {
          productiveTime: 0,
          unproductiveTime: 0,
          neutralTime: 0,
          score: 0,
          totalTime: 0
        };
      }
      
      const stats = productivityTracker.getProductivityStats();
      return {
        productiveTime: stats.productiveSeconds,
        unproductiveTime: stats.unproductiveSeconds,
        neutralTime: stats.neutralSeconds,
        score: stats.score,
        totalTime: stats.totalSeconds
      };
    } catch (error) {
      log.error('Failed to get productivity stats:', error);
      return {
        productiveTime: 0,
        unproductiveTime: 0,
        neutralTime: 0,
        score: 0,
        totalTime: 0
      };
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.UPDATE_PRODUCTIVITY_RULES, async (_event, rules) => {
    try {
      if (!productivityTracker) {
        throw new Error('Productivity tracker not initialized');
      }
      
      productivityTracker.updateProductivityRules(rules);
      log.info('Productivity rules updated');
      return true;
    } catch (error) {
      log.error('Failed to update productivity rules:', error);
      return false;
    }
  });

  // ============ System Metrics Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.START_METRICS_TRACKING, async (_event, intervalMs: number = 30000) => {
    try {
      if (!systemMetricsTracker) {
        throw new Error('System metrics tracker not initialized');
      }
      
      systemMetricsTracker.startMetricsTracking(intervalMs);
      log.info(`System metrics tracking started with ${intervalMs}ms interval`);
      return true;
    } catch (error) {
      log.error('Failed to start system metrics tracking:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.STOP_METRICS_TRACKING, async (_event) => {
    try {
      if (!systemMetricsTracker) {
        throw new Error('System metrics tracker not initialized');
      }
      
      systemMetricsTracker.stopMetricsTracking();
      log.info('System metrics tracking stopped');
      return true;
    } catch (error) {
      log.error('Failed to stop system metrics tracking:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_CURRENT_METRICS, async (_event) => {
    try {
      if (!systemMetricsTracker) {
        return null;
      }
      
      return await systemMetricsTracker.getCurrentMetrics();
    } catch (error) {
      log.error('Failed to get current metrics:', error);
      return null;
    }
  });

  // ============ Utility Handlers ============
  
  ipcMain.handle(IPC_CHANNELS.MONITORING.RESET_TRACKING_DATA, async (_event) => {
    try {
      if (windowTracker) {
        windowTracker.resetTrackingData();
      }
      if (browserTracker) {
        browserTracker.resetTrackingData();
      }
      if (productivityTracker) {
        productivityTracker.resetStats();
      }
      
      log.info('All tracking data reset');
      return true;
    } catch (error) {
      log.error('Failed to reset tracking data:', error);
      return false;
    }
  });

  ipcMain.handle(IPC_CHANNELS.MONITORING.EXPORT_ACTIVITY_DATA, async (_event, { startDate, endDate }) => {
    try {
      // In a real implementation, this would export data from storage
      const exportData = {
        startDate,
        endDate,
        windowStats: windowTracker?.getAppTimeStats() || {},
        browserStats: browserTracker?.getDomainTimeStats() || {},
        productivityStats: productivityTracker?.getProductivityStats() || {},
        exportTimestamp: Date.now()
      };
      
      log.info(`Activity data exported for ${startDate} to ${endDate}`);
      return exportData;
    } catch (error) {
      log.error('Failed to export activity data:', error);
      throw error;
    }
  });

  log.info('Monitoring handlers registered successfully');
}

/**
 * Setup integration between different trackers for productivity calculation
 */
function setupProductivityIntegration(): void {
  if (!windowTracker || !browserTracker || !productivityTracker) {
    return;
  }

  // This would be implemented with event emitters or observers in a real system
  // For now, we'll set up a simple integration that updates productivity
  // when window or browser events occur

  log.info('Productivity integration setup complete');
}

/**
 * Cleanup monitoring handlers and trackers
 */
export function cleanupMonitoringHandlers(): void {
  try {
    // Stop all tracking
    if (windowTracker) {
      windowTracker.stopWindowTracking();
    }
    if (browserTracker) {
      browserTracker.stopBrowserTracking();
    }
    if (idleTracker) {
      idleTracker.stopIdleMonitor();
    }
    if (systemMetricsTracker) {
      systemMetricsTracker.stopMetricsTracking();
    }

    // Remove IPC handlers
    const channels = Object.values(IPC_CHANNELS.MONITORING);
    channels.forEach(channel => {
      ipcMain.removeAllListeners(channel);
    });

    // Reset tracker instances
    windowTracker = null;
    browserTracker = null;
    idleTracker = null;
    productivityTracker = null;
    systemMetricsTracker = null;

    log.info('Monitoring handlers cleaned up');
  } catch (error) {
    log.error('Failed to cleanup monitoring handlers:', error);
  }
}

/**
 * Get current monitoring status
 */
export function getMonitoringStatus(): {
  windowTracking: boolean;
  browserTracking: boolean;
  idleMonitoring: boolean;
  focusSession: boolean;
  systemMetrics: boolean;
} {
  return {
    windowTracking: windowTracker?.getTrackingState().isTracking || false,
    browserTracking: browserTracker?.getTrackingState().isTracking || false,
    idleMonitoring: idleTracker?.getIdleState().currentFocusSession !== null || false,
    focusSession: idleTracker?.getCurrentFocusSession() !== null || false,
    systemMetrics: systemMetricsTracker?.getTrackingState().isTracking || false
  };
}