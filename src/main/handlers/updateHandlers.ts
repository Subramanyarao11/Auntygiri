/**
 * Update IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

export function registerUpdateHandlers(_mainWindow: BrowserWindow, _store: Store): void {
  log.info('Registering update handlers');

  ipcMain.handle(IPC_CHANNELS.UPDATE.CHECK, async () => {
    // TODO: Implement update check with electron-updater
    log.info('Checking for updates');
  });

  ipcMain.handle(IPC_CHANNELS.UPDATE.DOWNLOAD, async () => {
    // TODO: Implement update download
    log.info('Downloading update');
  });

  ipcMain.on(IPC_CHANNELS.UPDATE.INSTALL, () => {
    // TODO: Implement update installation
    log.info('Installing update');
  });
}

