/**
 * Enhanced Screenshot IPC Handlers
 * Handles screenshot capture, storage, upload management, and retry queue
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { ScreenshotManager } from '../services/monitoring/screenshotManager';

let screenshotManager: ScreenshotManager | null = null;

/**
 * Register screenshot IPC handlers
 */
export function registerScreenshotHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering enhanced screenshot handlers');

  // Initialize screenshot manager
  screenshotManager = new ScreenshotManager(mainWindow, store);

  // Capture screenshot handler (now returns array for multi-monitor)
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.CAPTURE, async () => {
    try {
      log.info('Screenshot capture requested');

      if (!screenshotManager) {
        throw new Error('Screenshot manager not initialized');
      }

      const screenshots = await screenshotManager.captureScreenshot();
      log.info(`${screenshots.length} screenshot(s) captured`);

      return screenshots;
    } catch (error) {
      log.error('Error capturing screenshot:', error);
      throw error;
    }
  });

  // Get all screenshots handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.GET_ALL, async (_event, { startDate, endDate }) => {
    try {
      log.info('Getting screenshots:', { startDate, endDate });

      if (!screenshotManager) {
        return [];
      }

      return screenshotManager.getScreenshots(startDate, endDate);
    } catch (error) {
      log.error('Error getting screenshots:', error);
      return [];
    }
  });

  // Delete screenshot handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.DELETE, async (_event, id: string) => {
    try {
      log.info('Deleting screenshot:', id);

      if (!screenshotManager) {
        throw new Error('Screenshot manager not initialized');
      }

      await screenshotManager.deleteScreenshot(id);
      log.info('Screenshot deleted:', id);
    } catch (error) {
      log.error('Error deleting screenshot:', error);
      throw error;
    }
  });

  // Upload screenshot handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.UPLOAD, async (_event, id: string) => {
    try {
      log.info('Uploading screenshot:', id);

      if (!screenshotManager) {
        throw new Error('Screenshot manager not initialized');
      }

      await screenshotManager.uploadScreenshot(id);
      log.info('Screenshot uploaded:', id);
    } catch (error) {
      log.error('Error uploading screenshot:', error);
      throw error;
    }
  });

  // Get pending screenshots handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.GET_PENDING, async () => {
    try {
      if (!screenshotManager) {
        return [];
      }

      return screenshotManager.getPendingScreenshots();
    } catch (error) {
      log.error('Error getting pending screenshots:', error);
      return [];
    }
  });

  // NEW: Configure API handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.CONFIGURE_API, async (_event, config: { endpoint: string; token: string; deleteAfterUpload?: boolean }) => {
    try {
      log.info('Configuring screenshot API');

      if (!screenshotManager) {
        throw new Error('Screenshot manager not initialized');
      }

      screenshotManager.configureAPI(
        config.endpoint,
        config.deleteAfterUpload ?? true
      );

      log.info('API configured successfully');
      return { success: true };
    } catch (error) {
      log.error('Error configuring API:', error);
      throw error;
    }
  });

  // NEW: Get retry queue status handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.GET_QUEUE_STATUS, async () => {
    try {
      if (!screenshotManager) {
        return { queueSize: 0, items: [] };
      }

      return screenshotManager.getRetryQueueStatus();
    } catch (error) {
      log.error('Error getting queue status:', error);
      return { queueSize: 0, items: [] };
    }
  });

  // NEW: Get API status handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.GET_API_STATUS, async () => {
    try {
      if (!screenshotManager) {
        return { configured: false, endpoint: null, deleteAfterUpload: true };
      }

      return screenshotManager.getAPIStatus();
    } catch (error) {
      log.error('Error getting API status:', error);
      return { configured: false, endpoint: null, deleteAfterUpload: true };
    }
  });
}

/**
 * Cleanup screenshot manager on app quit
 */
export function cleanupScreenshotManager(): void {
  if (screenshotManager) {
    screenshotManager.cleanup();
    screenshotManager = null;
    log.info('Screenshot manager cleaned up');
  }
}
