/**
 * Recommendations IPC Handlers
 * Handles fetching recommendations and opening URLs
 */

import { ipcMain, shell } from 'electron';
import log from 'electron-log'
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import * as recommendationsService from '../services/recommendationsService';

/**
 * Register recommendations IPC handlers
 */
export function registerRecommendationsHandlers(): void {
  log.info('Registering recommendations handlers');

  // Get user recommendations
  ipcMain.handle(
    IPC_CHANNELS.RECOMMENDATIONS.GET_ALL,
    async (_event) => {
      try {
        log.info('Fetching recommendations from API');
        const result = await recommendationsService.fetchUserRecommendations();
        return result;
      } catch (error: any) {
        log.error('Error fetching recommendations:', error);
        throw error;
      }
    }
  );

  // Open recommendation URL in external browser
  ipcMain.on('recommendations:open-url', (_event, url: string) => {
    try {
      log.info('Opening recommendation URL:', url);
      shell.openExternal(url);
    } catch (error) {
      log.error('Error opening URL:', error);
    }
  });

  log.info('Recommendations handlers registered');
}
