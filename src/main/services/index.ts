/**
 * Main Process Services Initialization
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { WindowTracker } from './monitoring/windowTracker';
import { ActivityLogger } from './monitoring/activityLogger';
import { IdleDetector } from './monitoring/idleDetector';

export async function initializeServices(mainWindow: BrowserWindow, store: Store): Promise<void> {
  try {
    log.info('Initializing main process services...');

    // Auto-start activity monitoring with API integration
    await startActivityMonitoring(mainWindow, store);

    log.info('Main process services initialized');
  } catch (error) {
    log.error('Error initializing services:', error);
    throw error;
  }
}

/**
 * Auto-start activity monitoring services with API integration
 */
async function startActivityMonitoring(mainWindow: BrowserWindow, store: Store): Promise<void> {
  try {
    log.info('Auto-starting activity monitoring with API integration...');

    // Wait a bit for the app to fully initialize
    setTimeout(async () => {
      try {
        // Initialize activity logger with API integration
        const activityLogger = new ActivityLogger(store);
        log.info('✅ Activity logger initialized with API integration');

        // Initialize trackers with activity logger
        const windowTracker = new WindowTracker(mainWindow, activityLogger);
        const idleDetector = new IdleDetector(mainWindow, activityLogger);

        // Start window tracking
        await windowTracker.start();
        log.info('✅ Window tracking started - activities will be sent to API');

        // Start idle detection
        await idleDetector.start();
        log.info('✅ Idle detection started - idle events will be sent to API');

        log.info('🚀 Activity monitoring with API integration active');
      } catch (error) {
        log.error('Error auto-starting activity monitoring:', error);
      }
    }, 3000); // Wait 3 seconds for full initialization

  } catch (error) {
    log.error('Error in startActivityMonitoring:', error);
  }
}

