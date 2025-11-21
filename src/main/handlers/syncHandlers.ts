/**
 * Sync IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { SyncManager } from '../services/sync/syncManager';

let syncManager: SyncManager | null = null;

export function registerSyncHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering sync handlers');

  syncManager = new SyncManager(store);

  ipcMain.handle(IPC_CHANNELS.SYNC.START, async () => {
    try {
      if (!syncManager) throw new Error('Sync manager not initialized');
      await syncManager.startSync();
    } catch (error) {
      log.error('Error starting sync:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYNC.STATUS, async () => {
    try {
      if (!syncManager) return null;
      return syncManager.getStatus();
    } catch (error) {
      log.error('Error getting sync status:', error);
      return null;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYNC.RETRY, async () => {
    try {
      if (!syncManager) throw new Error('Sync manager not initialized');
      await syncManager.retryFailed();
    } catch (error) {
      log.error('Error retrying sync:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.SYNC.GET_PENDING, async () => {
    try {
      if (!syncManager) return [];
      return syncManager.getPendingItems();
    } catch (error) {
      log.error('Error getting pending items:', error);
      return [];
    }
  });
}

