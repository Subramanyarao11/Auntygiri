/**
 * Productivity IPC Handlers
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { ProductivityCalculator } from '../services/productivity/productivityCalculator';

let productivityCalculator: ProductivityCalculator | null = null;

export function registerProductivityHandlers(_mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering productivity handlers');

  productivityCalculator = new ProductivityCalculator(store);

  ipcMain.handle(IPC_CHANNELS.PRODUCTIVITY.GET_STATS, async (_event, { startDate, endDate }) => {
    try {
      if (!productivityCalculator) throw new Error('Productivity calculator not initialized');
      return await productivityCalculator.getStats(startDate, endDate);
    } catch (error) {
      log.error('Error getting productivity stats:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRODUCTIVITY.GET_APP_USAGE, async (_event, date: string) => {
    try {
      if (!productivityCalculator) throw new Error('Productivity calculator not initialized');
      return await productivityCalculator.getAppUsage(date);
    } catch (error) {
      log.error('Error getting app usage:', error);
      throw error;
    }
  });

  ipcMain.handle(IPC_CHANNELS.PRODUCTIVITY.CALCULATE_SCORE, async (_event, activities) => {
    try {
      if (!productivityCalculator) throw new Error('Productivity calculator not initialized');
      return productivityCalculator.calculateScore(activities);
    } catch (error) {
      log.error('Error calculating score:', error);
      return 0;
    }
  });
}

