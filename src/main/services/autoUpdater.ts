/**
 * Auto Updater Service
 * Manages application auto-updates
 */

import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

export function setupAutoUpdater(mainWindow: BrowserWindow): void {
  log.info('Setting up auto updater');

  // Configure logger
  autoUpdater.logger = log;

  // Check for updates on startup
  autoUpdater.checkForUpdatesAndNotify();

  // Update available
  autoUpdater.on('update-available', (info) => {
    log.info('Update available:', info.version);
    mainWindow.webContents.send(IPC_CHANNELS.UPDATE.AVAILABLE, info.version);
  });

  // Update downloaded
  autoUpdater.on('update-downloaded', (info) => {
    log.info('Update downloaded:', info.version);
    mainWindow.webContents.send(IPC_CHANNELS.UPDATE.DOWNLOADED);
  });

  // Download progress
  autoUpdater.on('download-progress', (progress) => {
    mainWindow.webContents.send(IPC_CHANNELS.UPDATE.PROGRESS, progress.percent);
  });

  // Error
  autoUpdater.on('error', (error) => {
    log.error('Update error:', error);
    mainWindow.webContents.send(IPC_CHANNELS.UPDATE.ERROR, error.message);
  });

  // Check for updates every hour
  setInterval(() => {
    autoUpdater.checkForUpdates();
  }, 3600000);
}

