/**
 * Permissions Handlers
 * IPC handlers for checking and requesting system permissions
 */

import { ipcMain } from 'electron';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';
import { PermissionsChecker } from '../utils/permissionsChecker';

export function setupPermissionsHandlers(): void {
  /**
   * Check accessibility permissions
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.CHECK_ACCESSIBILITY, async () => {
    try {
      const hasPermission = await PermissionsChecker.hasAccessibilityPermissions();
      return { success: true, hasPermission };
    } catch (error: any) {
      log.error('Error checking accessibility permissions:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Request accessibility permissions
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.REQUEST_ACCESSIBILITY, async () => {
    try {
      const granted = await PermissionsChecker.requestAccessibilityPermissions();
      return { success: true, granted };
    } catch (error: any) {
      log.error('Error requesting accessibility permissions:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Check screen recording permissions
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.CHECK_SCREEN_RECORDING, async () => {
    try {
      const hasPermission = await PermissionsChecker.hasScreenRecordingPermissions();
      return { success: true, hasPermission };
    } catch (error: any) {
      log.error('Error checking screen recording permissions:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Request screen recording permissions
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.REQUEST_SCREEN_RECORDING, async () => {
    try {
      const granted = await PermissionsChecker.requestScreenRecordingPermissions();
      return { success: true, granted };
    } catch (error: any) {
      log.error('Error requesting screen recording permissions:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Check all permissions
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.CHECK_ALL, async () => {
    try {
      const permissions = await PermissionsChecker.checkAllPermissions();
      return { success: true, permissions };
    } catch (error: any) {
      log.error('Error checking permissions:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Open accessibility settings
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.OPEN_ACCESSIBILITY_SETTINGS, async () => {
    try {
      await PermissionsChecker.openAccessibilitySettings();
      return { success: true };
    } catch (error: any) {
      log.error('Error opening accessibility settings:', error);
      return { success: false, error: error.message };
    }
  });

  /**
   * Open screen recording settings
   */
  ipcMain.handle(IPC_CHANNELS.PERMISSIONS.OPEN_SCREEN_RECORDING_SETTINGS, async () => {
    try {
      await PermissionsChecker.openScreenRecordingSettings();
      return { success: true };
    } catch (error: any) {
      log.error('Error opening screen recording settings:', error);
      return { success: false, error: error.message };
    }
  });

  log.info('Permissions handlers registered');
}
