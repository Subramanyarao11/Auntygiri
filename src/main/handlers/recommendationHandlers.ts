/**
 * Recommendations IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

export function registerRecommendationHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering recommendation handlers');

  ipcMain.handle(IPC_CHANNELS.RECOMMENDATIONS.GET_ALL, async () => {
    return store.get('recommendations', []);
  });

  ipcMain.handle(IPC_CHANNELS.RECOMMENDATIONS.MARK_READ, async (_event, id: string) => {
    const recommendations = store.get('recommendations', []) as any[];
    const updated = recommendations.map(r => r.id === id ? { ...r, read: true } : r);
    store.set('recommendations', updated);
  });

  ipcMain.handle(IPC_CHANNELS.RECOMMENDATIONS.DISMISS, async (_event, id: string) => {
    const recommendations = store.get('recommendations', []) as any[];
    const updated = recommendations.map(r => r.id === id ? { ...r, dismissed: true } : r);
    store.set('recommendations', updated);
  });
}

