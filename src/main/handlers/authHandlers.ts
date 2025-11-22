/**
 * Authentication IPC Handlers
 * Handles user authentication, token management, and session handling
 */

import { ipcMain, BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { validateData, LoginCredentialsSchema } from '../../shared/validators';
import type { LoginCredentials, AuthResponse, RegisterParentStudentData } from '../../shared/types';
import * as authService from '../services/authService';

/**
 * Register authentication IPC handlers
 */
export function registerAuthHandlers(_mainWindow: BrowserWindow, store: Store): void {
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

      // Call auth service to login
      const authResponse = await authService.login(credentials);

      // Store user data
      authService.storeUserData(store, authResponse.user);

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

  // Registration handler (parent-student)
  ipcMain.handle(
    IPC_CHANNELS.AUTH.REGISTER_PARENT_STUDENT,
    async (_event, data: RegisterParentStudentData) => {
      try {
        log.info('Parent-student registration attempt');

        // Call auth service to register
        const authResponse = await authService.registerParentStudent(data);

        // Store parent and student data
        if (authResponse.parent && authResponse.student) {
          authService.storeParentStudentData(store, authResponse.parent, authResponse.student);
        }

        log.info('Registration successful');
        return authResponse;
      } catch (error) {
        log.error('Registration error:', error);
        throw error;
      }
    }
  );

  // Logout handler
  ipcMain.handle(IPC_CHANNELS.AUTH.LOGOUT, async () => {
    try {
      log.info('Logout request');

      // Call auth service to logout
      await authService.logout();

      // Clear user data
      authService.clearUserData(store);
      store.delete('remember_me');

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

      // Call auth service to refresh token
      const tokens = await authService.refreshAccessToken();

      const user = authService.getUserData(store);

      const authResponse: AuthResponse = {
        user: user!,
        tokens: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
      };

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
      return await authService.getAccessToken();
    } catch (error) {
      log.error('Get stored token error:', error);
      return null;
    }
  });

  // Check auth status handler
  ipcMain.handle(IPC_CHANNELS.AUTH.CHECK_AUTH_STATUS, async () => {
    try {
      const accessToken = await authService.getAccessToken();
      const user = authService.getUserData(store);

      if (!accessToken || !user) {
        return false;
      }

      return true;
    } catch (error) {
      log.error('Check auth status error:', error);
      return false;
    }
  });
}

