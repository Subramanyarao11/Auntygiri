/**
 * Main Process Services Initialization
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';

export async function initializeServices(mainWindow: BrowserWindow, store: Store): Promise<void> {
  try {
    log.info('Initializing main process services...');

    // Services are initialized in their respective handlers
    // This function can be used for any global service initialization

    log.info('Main process services initialized');
  } catch (error) {
    log.error('Error initializing services:', error);
    throw error;
  }
}

