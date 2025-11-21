/**
 * Notification IPC Handlers
 */

import { ipcMain, BrowserWindow, Notification } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

export function registerNotificationHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering notification handlers');

  ipcMain.on(IPC_CHANNELS.NOTIFICATION.SHOW, (_event, { title, message }) => {
    const notification = new Notification({
      title,
      body: message,
    });

    notification.on('click', () => {
      mainWindow.webContents.send(IPC_CHANNELS.NOTIFICATION.CLICKED);
    });

    notification.show();
  });
}

