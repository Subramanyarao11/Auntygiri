/**
 * Main Process Services Initialization
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { WindowTracker } from '../monitoring/windowTracker';
import { BrowserTracker } from '../monitoring/browserTracker';
import { IdleTracker } from '../monitoring/idleTracker';
import { SystemMetricsTracker } from '../monitoring/systemMetrics';

export async function initializeServices(mainWindow: BrowserWindow, _store: Store): Promise<void> {
  try {
    log.info('Initializing main process services...');

    // Auto-start activity monitoring
    await startActivityMonitoring(mainWindow);

    log.info('Main process services initialized');
  } catch (error) {
    log.error('Error initializing services:', error);
    throw error;
  }
}

/**
 * Auto-start activity monitoring services
 */
async function startActivityMonitoring(mainWindow: BrowserWindow): Promise<void> {
  try {
    log.info('Auto-starting activity monitoring services...');

    // Wait a bit for the app to fully initialize
    setTimeout(async () => {
      try {
        // Initialize trackers
        const windowTracker = new WindowTracker(mainWindow);
        const browserTracker = new BrowserTracker(mainWindow);
        const idleTracker = new IdleTracker(mainWindow);
        const systemMetricsTracker = new SystemMetricsTracker(mainWindow);

        // Start window tracking (every 10 seconds)
        windowTracker.startWindowTracking(10000);
        log.info('✅ Window tracking auto-started (10s interval)');

        // Start browser tracking (every 10 seconds)  
        browserTracker.startBrowserTracking(10000);
        log.info('✅ Browser tracking auto-started (10s interval)');

        // Start idle tracking (check every 60 seconds)
        idleTracker.startIdleMonitor(60, 5000);
        log.info('✅ Idle tracking auto-started (60s threshold, 5s check interval)');

        // Start system metrics tracking (every 30 seconds)
        systemMetricsTracker.startMetricsTracking(30000);
        log.info('✅ System metrics tracking auto-started (30s interval)');

        log.info('🚀 All activity monitoring services started automatically');
      } catch (error) {
        log.error('Error auto-starting activity monitoring:', error);
      }
    }, 3000); // Wait 3 seconds for full initialization

  } catch (error) {
    log.error('Error in startActivityMonitoring:', error);
  }
}

