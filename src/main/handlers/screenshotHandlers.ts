/**
 * Screenshot IPC Handlers
 * Handles screenshot capture, storage, and upload management
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
  log.info('Registering screenshot handlers');

  // Initialize screenshot manager
  screenshotManager = new ScreenshotManager(mainWindow, store);

  // Capture screenshot handler
  ipcMain.handle(IPC_CHANNELS.SCREENSHOT.CAPTURE, async () => {
    try {
      log.info('Screenshot capture requested');

      if (!screenshotManager) {
        throw new Error('Screenshot manager not initialized');
      }

      const screenshot = await screenshotManager.captureScreenshot();
      log.info('Screenshot captured:', screenshot.id);

      return screenshot;
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
}

