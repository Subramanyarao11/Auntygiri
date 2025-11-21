/**
 * Bad Website Detection IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import type { BadWebsite } from '../../shared/types';

export function registerBadWebsiteHandlers(_mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering bad website handlers');

  ipcMain.handle(IPC_CHANNELS.BAD_WEBSITE.CHECK, async (_event, url: string) => {
    try {
      const badWebsites = store.get('bad_websites', []) as BadWebsite[];
      const domain = new URL(url).hostname;
      return badWebsites.find(site => site.domain === domain) || null;
    } catch (error) {
      log.error('Error checking bad website:', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.BAD_WEBSITE.GET_LIST, async () => {
    return store.get('bad_websites', []) as BadWebsite[];
  });

  ipcMain.handle(IPC_CHANNELS.BAD_WEBSITE.UPDATE_LIST, async (_event, websites: BadWebsite[]) => {
    store.set('bad_websites', websites);
  });
}

