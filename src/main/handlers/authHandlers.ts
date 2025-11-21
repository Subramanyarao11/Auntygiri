/**
 * Authentication IPC Handlers
 * Handles user authentication, token management, and session handling
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { validateData, LoginCredentialsSchema } from '../../shared/validators';
import type { LoginCredentials, AuthResponse } from '../../shared/types';

const AUTH_TOKEN_KEY = 'auth_tokens';
const USER_KEY = 'user_data';

/**
 * Register authentication IPC handlers
 */
export function registerAuthHandlers(mainWindow: BrowserWindow, store: Store): void {
  log.info('Registering authentication handlers');

  // Login handler
  ipcMain.handle(IPC_CHANNELS.AUTH.LOGIN, async (_event, credentials: LoginCredentials) => {
    try {
      log.info('Login attempt:', credentials.email);

      // Validate credentials
      const validation = validateData(LoginCredentialsSchema, credentials);
      if (!validation.success) {
        throw new Error(validation.error);
      }

      // TODO: Implement actual API call to authentication server
      // For now, this is a stub that simulates authentication
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock response (replace with actual API call)
      const authResponse: AuthResponse = {
        user: {
          id: '123',
          email: credentials.email,
          name: 'Test User',
          role: 'student',
          studentId: 'STU001',
        },
        tokens: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
          expiresAt: Date.now() + 3600000, // 1 hour from now
        },
      };

      // Store tokens and user data securely
      store.set(AUTH_TOKEN_KEY, authResponse.tokens);
      store.set(USER_KEY, authResponse.user);

      if (credentials.rememberMe) {
        store.set('remember_me', true);
      }

      log.info('Login successful:', authResponse.user.email);
      return authResponse;
    } catch (error) {
      log.error('Login error:', error);
      throw error;
    }
  });

  // Logout handler
  ipcMain.handle(IPC_CHANNELS.AUTH.LOGOUT, async () => {
    try {
      log.info('Logout request');

      // Clear stored tokens and user data
      store.delete(AUTH_TOKEN_KEY);
      store.delete(USER_KEY);
      store.delete('remember_me');

      // TODO: Notify server about logout

      log.info('Logout successful');
    } catch (error) {
      log.error('Logout error:', error);
      throw error;
    }
  });

  // Refresh token handler
  ipcMain.handle(IPC_CHANNELS.AUTH.REFRESH_TOKEN, async () => {
    try {
      log.info('Token refresh request');

      const tokens = store.get(AUTH_TOKEN_KEY) as any;
      
      if (!tokens || !tokens.refreshToken) {
        throw new Error('No refresh token available');
      }

      // TODO: Implement actual token refresh API call
      // For now, return mock data

      const authResponse: AuthResponse = {
        user: store.get(USER_KEY) as any,
        tokens: {
          accessToken: 'new_mock_access_token',
          refreshToken: tokens.refreshToken,
          expiresAt: Date.now() + 3600000,
        },
      };

      store.set(AUTH_TOKEN_KEY, authResponse.tokens);

      log.info('Token refresh successful');
      return authResponse;
    } catch (error) {
      log.error('Token refresh error:', error);
      throw error;
    }
  });

  // Get stored token handler
  ipcMain.handle(IPC_CHANNELS.AUTH.GET_STORED_TOKEN, async () => {
    try {
      const tokens = store.get(AUTH_TOKEN_KEY) as any;
      return tokens?.accessToken || null;
    } catch (error) {
      log.error('Get stored token error:', error);
      return null;
    }
  });

  // Check auth status handler
  ipcMain.handle(IPC_CHANNELS.AUTH.CHECK_AUTH_STATUS, async () => {
    try {
      const tokens = store.get(AUTH_TOKEN_KEY) as any;
      const user = store.get(USER_KEY);

      if (!tokens || !user) {
        return false;
      }

      // Check if token is expired
      if (tokens.expiresAt && tokens.expiresAt < Date.now()) {
        log.info('Token expired');
        return false;
      }

      return true;
    } catch (error) {
      log.error('Check auth status error:', error);
      return false;
    }
  });
}

