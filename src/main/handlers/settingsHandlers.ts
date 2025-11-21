/**
 * Settings IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import type { AppSettings } from '../../shared/types';

const DEFAULT_SETTINGS: AppSettings = {
  general: {
    startOnBoot: false,
    minimizeToTray: true,
    theme: 'system',
    language: 'en',
  },
  monitoring: {
    enabled: true,
    trackUrls: true,
    trackApplications: true,
    idleDetection: true,
    idleThreshold: 300000,
  },
  screenshots: {
    enabled: true,
    interval: 300000,
    quality: 80,
    uploadImmediately: false,
    notifyOnCapture: false,
  },
  notifications: {
    enabled: true,
    badWebsiteAlerts: true,
    productivityReminders: true,
    focusModeReminders: true,
    sound: true,
  },
  privacy: {
    blurSensitiveInfo: false,
    excludeApps: [],
    excludeDomains: [],
  },
};

export function registerSettingsHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering settings handlers');

  ipcMain.handle(IPC_CHANNELS.SETTINGS.GET_ALL, async () => {
    return store.get('settings', DEFAULT_SETTINGS) as AppSettings;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS.UPDATE, async (_event, settings: Partial<AppSettings>) => {
    const current = store.get('settings', DEFAULT_SETTINGS) as AppSettings;
    const updated = { ...current, ...settings };
    store.set('settings', updated);
    return updated;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS.RESET, async () => {
    store.set('settings', DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  });

  ipcMain.handle(IPC_CHANNELS.SETTINGS.SYNC, async () => {
    // TODO: Implement settings sync with server
    log.info('Settings sync requested');
  });
}

