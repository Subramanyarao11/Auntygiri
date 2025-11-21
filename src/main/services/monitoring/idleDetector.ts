/**
 * Idle Detector Service
 * Detects user idle time and logs idle status changes
 */

import { BrowserWindow, powerMonitor } from 'electron';
import log from 'electron-log';
import { APP_CONFIG, ACTIVITY_TYPES } from '../../../shared/constants/APP_CONSTANTS';
import { IPC_CHANNELS } from '../../../shared/constants/IPC_CHANNELS';
import type { ActivityEntry } from '../../../shared/types';
import type { ActivityLogger } from './activityLogger';
import { generateId } from '../../../shared/utils';

export class IdleDetector {
  private mainWindow: BrowserWindow;
  private activityLogger: ActivityLogger;
  private intervalId: NodeJS.Timeout | null = null;
  private isIdle = false;
  private idleStartTime: number | null = null;
  private isTracking = false;

  constructor(mainWindow: BrowserWindow, activityLogger: ActivityLogger) {
    this.mainWindow = mainWindow;
    this.activityLogger = activityLogger;
  }

  /**
   * Start idle detection
   */
  async start(): Promise<void> {
    if (this.isTracking) {
      log.warn('Idle detector already running');
      return;
    }

    log.info('Starting idle detector');
    this.isTracking = true;

    // Check immediately
    await this.checkIdleState();

    // Check periodically
    this.intervalId = setInterval(async () => {
      await this.checkIdleState();
    }, APP_CONFIG.IDLE_DETECTION_INTERVAL);
  }

  /**
   * Stop idle detection
   */
  async stop(): Promise<void> {
    if (!this.isTracking) {
      return;
    }

    log.info('Stopping idle detector');
    this.isTracking = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Check idle state
   */
  private async checkIdleState(): Promise<void> {
    try {
      const idleTime = powerMonitor.getSystemIdleTime() * 1000; // Convert to milliseconds
      const isCurrentlyIdle = idleTime >= APP_CONFIG.IDLE_THRESHOLD;

      // Idle state changed
      if (isCurrentlyIdle !== this.isIdle) {
        this.isIdle = isCurrentlyIdle;

        if (this.isIdle) {
          // User became idle
          this.idleStartTime = Date.now();
          log.debug('User became idle');

          const activity: ActivityEntry = {
            id: generateId(),
            type: ACTIVITY_TYPES.IDLE_START,
            timestamp: this.idleStartTime,
          };

          await this.activityLogger.logActivity(activity);
          this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.IDLE_STATUS_CHANGED, true);
        } else {
          // User became active
          const idleEndTime = Date.now();
          const idleDuration = this.idleStartTime ? idleEndTime - this.idleStartTime : 0;
          log.debug('User became active after', idleDuration, 'ms');

          const activity: ActivityEntry = {
            id: generateId(),
            type: ACTIVITY_TYPES.IDLE_END,
            timestamp: idleEndTime,
            duration: idleDuration,
          };

          await this.activityLogger.logActivity(activity);
          this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.IDLE_STATUS_CHANGED, false);

          this.idleStartTime = null;
        }
      }
    } catch (error) {
      log.error('Error checking idle state:', error);
    }
  }
}

