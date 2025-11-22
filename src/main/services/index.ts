/**
 * Main Process Services Initialization
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { WindowTracker } from './monitoring/windowTracker';
import { ActivityLogger } from './monitoring/activityLogger';
import { IdleDetector } from './monitoring/idleDetector';
import { BrowserTracker } from '../monitoring/browserTracker';
import { PermissionsChecker } from '../utils/permissionsChecker';
import { APP_CONFIG } from '../../shared/constants/APP_CONSTANTS';

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
        // Check permissions on macOS
        if (process.platform === 'darwin') {
          log.info('Checking macOS permissions...');
          const permissions = await PermissionsChecker.checkAllPermissions();
          
          if (!permissions.accessibility) {
            log.warn('⚠️  Missing Accessibility permissions - window tracking will not work');
            log.warn('Go to: System Settings → Privacy & Security → Accessibility');
            log.warn('Enable access for: Electron (or Terminal/Warp in dev mode)');
          }
          
          if (!permissions.screenRecording) {
            log.warn('⚠️  Missing Screen Recording permissions - screenshots may not work');
            log.warn('Go to: System Settings → Privacy & Security → Screen Recording');
          }
          
          if (!permissions.allGranted) {
            // Show permissions dialog to user
            await PermissionsChecker.showPermissionsDialogIfNeeded();
          }
        }

        // Initialize activity logger with API integration
        const activityLogger = new ActivityLogger(store);
        log.info('✅ Activity logger initialized with API integration');

        // Initialize trackers with activity logger
        const windowTracker = new WindowTracker(mainWindow, activityLogger);
        const idleDetector = new IdleDetector(mainWindow, activityLogger);
        const browserTracker = new BrowserTracker(mainWindow, activityLogger);

        // Start window tracking
        await windowTracker.start();
        log.info('✅ Window tracking started - activities will be sent to API');

        // Start browser tracking (URL capture for Chrome, Safari, Firefox)
        browserTracker.startBrowserTracking(APP_CONFIG.BROWSER_CHECK_INTERVAL);
        log.info('✅ Browser tracking started - URLs will be captured every 10 seconds');

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

