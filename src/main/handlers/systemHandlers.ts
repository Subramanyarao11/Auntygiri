/**
 * System IPC Handlers
 */

import { ipcMain, BrowserWindow, app } from 'electron';
import Store from 'electron-store';
import os from 'os';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

export function registerSystemHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering system handlers');

  ipcMain.handle(IPC_CHANNELS.SYSTEM.GET_INFO, async () => {
    return {
      platform: process.platform,
      arch: process.arch,
      version: app.getVersion(),
      hostname: os.hostname(),
      totalMemory: os.totalmem(),
      freeMemory: os.freemem(),
    };
  });

  ipcMain.on(IPC_CHANNELS.SYSTEM.MINIMIZE, () => {
    mainWindow.minimize();
  });

  ipcMain.on(IPC_CHANNELS.SYSTEM.MAXIMIZE, () => {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  });

  ipcMain.on(IPC_CHANNELS.SYSTEM.CLOSE, () => {
    mainWindow.close();
  });

  ipcMain.on(IPC_CHANNELS.SYSTEM.RESTART, () => {
    app.relaunch();
    app.exit(0);
  });
}

