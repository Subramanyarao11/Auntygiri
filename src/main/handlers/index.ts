/**
 * IPC Handlers Index
 * Registers all IPC handlers for communication between main and renderer processes
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

import { registerAuthHandlers } from './authHandlers';
import { registerMonitoringHandlers } from './monitoringHandlers';
import { registerScreenshotHandlers } from './screenshotHandlers';
import { registerBadWebsiteHandlers } from './badWebsiteHandlers';
import { registerProductivityHandlers } from './productivityHandlers';
import { registerFocusHandlers } from './focusHandlers';
import { registerRecommendationsHandlers } from './recommendationsHandlers';
import { registerSettingsHandlers } from './settingsHandlers';
import { registerSystemHandlers } from './systemHandlers';
import { registerUpdateHandlers } from './updateHandlers';
import { registerSyncHandlers } from './syncHandlers';
import { registerNotificationHandlers } from './notificationHandlers';

/**
 * Setup all IPC handlers
 */
export function setupIpcHandlers(mainWindow: BrowserWindow, store: Store): void {
  try {
    log.info('Setting up IPC handlers...');

    // Register all handlers
    registerAuthHandlers(mainWindow, store);
    registerMonitoringHandlers(mainWindow, store);
    registerScreenshotHandlers(mainWindow, store);
    registerBadWebsiteHandlers(mainWindow, store);
    registerProductivityHandlers(mainWindow, store);
    registerFocusHandlers(mainWindow, store);
    registerRecommendationsHandlers(); // API-based recommendations
    registerSettingsHandlers(mainWindow, store);
    registerSystemHandlers(mainWindow, store);
    registerUpdateHandlers(mainWindow, store);
    registerSyncHandlers(mainWindow, store);
    registerNotificationHandlers(mainWindow, store);

    log.info('IPC handlers setup complete');
  } catch (error) {
    log.error('Error setting up IPC handlers:', error);
    throw error;
  }
}

