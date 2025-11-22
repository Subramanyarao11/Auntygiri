/**
 * Window Tracker Service
 * Tracks active window changes and captures window information
 */

import { BrowserWindow } from 'electron';
import activeWin from 'active-win';
import log from 'electron-log';
import { APP_CONFIG, ACTIVITY_TYPES } from '../../../shared/constants/APP_CONSTANTS';
import { IPC_CHANNELS } from '../../../shared/constants/IPC_CHANNELS';
import type { WindowInfo, ActivityEntry } from '../../../shared/types';
import type { ActivityLogger } from './activityLogger';
import { generateId } from '../../../shared/utils';

export class WindowTracker {
  private mainWindow: BrowserWindow;
  private activityLogger: ActivityLogger;
  private intervalId: NodeJS.Timeout | null = null;
  private currentWindow: WindowInfo | null = null;
  private isTracking = false;

  constructor(mainWindow: BrowserWindow, activityLogger: ActivityLogger) {
    this.mainWindow = mainWindow;
    this.activityLogger = activityLogger;
  }

  /**
   * Start tracking window changes
   */
  async start(): Promise<void> {
    if (this.isTracking) {
      log.warn('Window tracker already running');
      return;
    }

    log.info('Starting window tracker');
    this.isTracking = true;

    // Track immediately
    await this.trackWindow();

    // Track periodically
    this.intervalId = setInterval(async () => {
      await this.trackWindow();
    }, APP_CONFIG.ACTIVITY_CHECK_INTERVAL);
  }

  /**
   * Stop tracking window changes
   */
  async stop(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    log.info('Stopping window tracker');
    this.isTracking = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Get current window information
   */
  async getCurrentWindow(): Promise<WindowInfo | null> {
    try {
      const window = await activeWin();

      if (!window) {
        return null;
      }

      return {
        title: window.title,
        owner: {
          name: window.owner.name,
          path: window.owner.path,
        },
        url: (window as any).url || undefined,
        timestamp: Date.now(),
      };
    } catch (error: any) {
      // Check if this is a permissions error on macOS
      if (process.platform === 'darwin' && error.message?.includes('Command failed')) {
        log.warn('⚠️  active-win failed - likely missing macOS accessibility permissions');
        log.warn('Please grant accessibility permissions in System Settings → Privacy & Security → Accessibility');
      } else {
        log.error('Error getting current window:', error);
      }
      return null;
    }
  }

  /**
   * Track current window
   */
  private async trackWindow(): Promise<void> {
    try {
      const window = await this.getCurrentWindow();

      if (!window) {
        return;
      }

      // Check if window changed
      const hasChanged =
        !this.currentWindow ||
        this.currentWindow.title !== window.title ||
        this.currentWindow.owner.name !== window.owner.name;

      if (hasChanged) {
        log.debug('Window changed:', window.owner.name, '-', window.title);

        // Create activity entry
        const activity: ActivityEntry = {
          id: generateId(),
          type: ACTIVITY_TYPES.WINDOW_CHANGE,
          timestamp: window.timestamp,
          windowTitle: window.title,
          applicationName: window.owner.name,
          url: window.url,
        };

        // Log activity
        await this.activityLogger.logActivity(activity);

        // Send to renderer
        this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.UPDATE_ACTIVITY, activity);

        // Update current window
        this.currentWindow = window;
      }
    } catch (error) {
      log.error('Error tracking window:', error);
    }
  }
}

