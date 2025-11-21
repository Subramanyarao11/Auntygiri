/**
 * Activity Monitoring IPC Handlers
 * Handles window tracking, URL monitoring, and activity logging
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { WindowTracker } from '../services/monitoring/windowTracker';
import { IdleDetector } from '../services/monitoring/idleDetector';
import { ActivityLogger } from '../services/monitoring/activityLogger';

let windowTracker: WindowTracker | null = null;
let idleDetector: IdleDetector | null = null;
let activityLogger: ActivityLogger | null = null;

/**
 * Register monitoring IPC handlers
 */
export function registerMonitoringHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering monitoring handlers');

  // Initialize services
  activityLogger = new ActivityLogger(store);
  windowTracker = new WindowTracker(mainWindow, activityLogger);
  idleDetector = new IdleDetector(mainWindow, activityLogger);

  // Start monitoring handler
  ipcMain.handle(IPC_CHANNELS.MONITORING.START, async () => {
    try {
      log.info('Starting activity monitoring');

      if (!windowTracker || !idleDetector) {
        throw new Error('Monitoring services not initialized');
      }

      await windowTracker.start();
      await idleDetector.start();

      log.info('Activity monitoring started');
    } catch (error) {
      log.error('Error starting monitoring:', error);
      throw error;
    }
  });

  // Stop monitoring handler
  ipcMain.handle(IPC_CHANNELS.MONITORING.STOP, async () => {
    try {
      log.info('Stopping activity monitoring');

      if (windowTracker) {
        await windowTracker.stop();
      }

      if (idleDetector) {
        await idleDetector.stop();
      }

      log.info('Activity monitoring stopped');
    } catch (error) {
      log.error('Error stopping monitoring:', error);
      throw error;
    }
  });

  // Get current window handler
  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_CURRENT_WINDOW, async () => {
    try {
      if (!windowTracker) {
        return null;
      }

      return await windowTracker.getCurrentWindow();
    } catch (error) {
      log.error('Error getting current window:', error);
      return null;
    }
  });

  // Get activity log handler
  ipcMain.handle(IPC_CHANNELS.MONITORING.GET_ACTIVITY_LOG, async (_event, { startDate, endDate }) => {
    try {
      log.info('Getting activity log:', { startDate, endDate });

      if (!activityLogger) {
        return [];
      }

      return activityLogger.getActivities(startDate, endDate);
    } catch (error) {
      log.error('Error getting activity log:', error);
      return [];
    }
  });
}

/**
 * Cleanup monitoring services
 */
export async function cleanupMonitoring(): Promise<void> {
  if (windowTracker) {
    await windowTracker.stop();
  }
  if (idleDetector) {
    await idleDetector.stop();
  }
}

