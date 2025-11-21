/**
 * Focus Mode IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { FocusManager } from '../services/focus/focusManager';

let focusManager: FocusManager | null = null;

export function registerFocusHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering focus handlers');

  focusManager = new FocusManager(mainWindow, store);

  ipcMain.handle(IPC_CHANNELS.FOCUS.START_SESSION, async (_event, duration: number) => {
    try {
      if (!focusManager) throw new Error('Focus manager not initialized');
      return await focusManager.startSession(duration);
    } catch (error) {
      log.error('Error starting focus session:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FOCUS.PAUSE_SESSION, async () => {
    try {
      if (!focusManager) throw new Error('Focus manager not initialized');
      await focusManager.pauseSession();
    } catch (error) {
      log.error('Error pausing focus session:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FOCUS.RESUME_SESSION, async () => {
    try {
      if (!focusManager) throw new Error('Focus manager not initialized');
      await focusManager.resumeSession();
    } catch (error) {
      log.error('Error resuming focus session:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FOCUS.END_SESSION, async () => {
    try {
      if (!focusManager) throw new Error('Focus manager not initialized');
      return await focusManager.endSession();
    } catch (error) {
      log.error('Error ending focus session:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.FOCUS.GET_ACTIVE_SESSION, async () => {
    try {
      if (!focusManager) return null;
      return focusManager.getActiveSession();
    } catch (error) {
      log.error('Error getting active session:', error);
      return null;
    }
  });
}

