/**
 * Focus Mode IPC Handlers
 * Integrated with backend API
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import axios from 'axios';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { FocusManager } from '../services/focus/focusManager';

const API_BASE_URL = 'http://localhost:3000';
let focusManager: FocusManager | null = null;

/**
 * Get access token for API requests
 */
async function getAccessToken(): Promise<string | null> {
  try {
    const keytar = await import('keytar');
    return await keytar.getPassword('StudentMonitorApp', 'accessToken');
  } catch (error) {
    log.error('Error getting access token:', error);
    return null;
  }
}

export function registerFocusHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering focus handlers with API integration');

  focusManager = new FocusManager(mainWindow, store);

  ipcMain.handle(IPC_CHANNELS.FOCUS.START_SESSION, async (_event, config: any) => {
    try {
      log.info('START_SESSION called with config:', config);
      
      if (!focusManager) {
        return { success: false, error: 'Focus manager not initialized' };
      }

      // Get access token
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return { success: false, error: 'Not authenticated. Please log in first.' };
      }

      // Call backend API to start session
      try {
        const response = await axios.post(
          `${API_BASE_URL}/api/v1/focus/sessions/start`,
          {
            goal: config.goal,
            subject: config.subject,
            planned_duration: config.planned_duration,
            session_type: config.session_type || 'custom',
          },
          {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            timeout: 10000,
          }
        );

        log.info('Backend API response:', response.data);

        if (response.data.status === 'success') {
          const apiData = response.data.data;
          
          // Start local session for UI
          const localSession = await focusManager.startSession(config.planned_duration);
          
          // Merge with API data
          const session = {
            ...localSession,
            id: apiData.session_id,
            goal: config.goal,
            subject: config.subject,
            sessionType: config.session_type,
          };

          return { success: true, session };
        }

        return { success: false, error: 'Failed to start session on backend' };
      } catch (apiError: any) {
        log.error('API Error:', apiError.message);
        return {
          success: false,
          error: apiError.response?.data?.message || apiError.message || 'Failed to connect to backend',
        };
      }
    } catch (error: any) {
      log.error('Error in START_SESSION handler:', error);
      return {
        success: false,
        error: error.message || 'Failed to start session',
      };
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
      if (!focusManager) return { success: false, session: null };
      const session = focusManager.getActiveSession();
      return { success: true, session };
    } catch (error) {
      log.error('Error getting active session:', error);
      return { success: false, session: null };
    }
  });

  ipcMain.handle(IPC_CHANNELS.FOCUS.GET_SESSION_HISTORY, async (_event, params?: any) => {
    try {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        return { success: false, error: 'Not authenticated' };
      }

      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.append('page', String(params.page));
      if (params?.limit) queryParams.append('limit', String(params.limit));
      if (params?.startDate) queryParams.append('startDate', params.startDate);
      if (params?.endDate) queryParams.append('endDate', params.endDate);
      if (params?.subject) queryParams.append('subject', params.subject);

      const response = await axios.get(
        `${API_BASE_URL}/api/v1/focus/sessions?${queryParams.toString()}`,
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          timeout: 10000,
        }
      );

      return { 
        success: true, 
        sessions: response.data?.data?.sessions || [], 
        total: response.data?.data?.total || 0 
      };
    } catch (error: any) {
      log.error('Error in GET_SESSION_HISTORY handler:', error?.message || error);
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Failed to get history' 
      };
    }
  });
}

