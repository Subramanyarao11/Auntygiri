/**
 * Permissions Checker Utility
 * Checks and requests necessary macOS permissions for activity monitoring
 */

import { systemPreferences, shell, dialog } from 'electron';
import log from 'electron-log';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class PermissionsChecker {
  /**
   * Check if the app has macOS accessibility permissions
   */
  static async hasAccessibilityPermissions(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return true; // Not needed on other platforms
    }

    try {
      // Try to get the trusted status
      const isTrusted = systemPreferences.isTrustedAccessibilityClient(false);
      log.info(`Accessibility permissions status: ${isTrusted}`);
      return isTrusted;
    } catch (error) {
      log.error('Error checking accessibility permissions:', error);
      return false;
    }
  }

  /**
   * Request accessibility permissions with user prompt
   */
  static async requestAccessibilityPermissions(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return true;
    }

    try {
      // Prompt the system to request permissions
      const isTrusted = systemPreferences.isTrustedAccessibilityClient(true);
      
      if (!isTrusted) {
        log.info('Accessibility permissions not granted, showing user dialog');
        
        // Show a dialog explaining the need for permissions
        const result = await dialog.showMessageBox({
          type: 'warning',
          title: 'Accessibility Permissions Required',
          message: 'Activity Monitoring Requires Accessibility Access',
          detail: 'To track your active applications and windows, this app needs accessibility permissions.\n\n' +
                  'Steps:\n' +
                  '1. Click "Open System Settings" below\n' +
                  '2. Go to Privacy & Security → Accessibility\n' +
                  '3. Enable access for this app (or Electron/Terminal/Warp if running in dev mode)\n' +
                  '4. Restart the app after granting permissions\n\n' +
                  'Without these permissions, activity tracking will not work.',
          buttons: ['Open System Settings', 'Remind Me Later'],
          defaultId: 0,
          cancelId: 1,
        });

        if (result.response === 0) {
          // Open System Preferences to Accessibility
          await this.openAccessibilitySettings();
        }
        
        return false;
      }

      return true;
    } catch (error) {
      log.error('Error requesting accessibility permissions:', error);
      return false;
    }
  }

  /**
   * Open macOS System Settings to Accessibility panel
   */
  static async openAccessibilitySettings(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        // Try new System Settings (macOS 13+)
        try {
          await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility');
        } catch (error) {
          // Fallback to older System Preferences
          await execAsync('open "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility"');
        }
        log.info('Opened System Settings → Privacy & Security → Accessibility');
      }
    } catch (error) {
      log.error('Error opening accessibility settings:', error);
    }
  }

  /**
   * Check if the app has screen recording permissions (for screenshots)
   */
  static async hasScreenRecordingPermissions(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return true;
    }

    try {
      // Screen recording permission status
      const status = systemPreferences.getMediaAccessStatus('screen');
      log.info(`Screen recording permissions status: ${status}`);
      return status === 'granted';
    } catch (error) {
      log.error('Error checking screen recording permissions:', error);
      return false;
    }
  }

  /**
   * Request screen recording permissions
   */
  static async requestScreenRecordingPermissions(): Promise<boolean> {
    if (process.platform !== 'darwin') {
      return true;
    }

    try {
      const status = systemPreferences.getMediaAccessStatus('screen');
      
      if (status !== 'granted') {
        log.info('Screen recording permissions not granted, showing user dialog');
        
        const result = await dialog.showMessageBox({
          type: 'warning',
          title: 'Screen Recording Permissions Required',
          message: 'Screenshot Capture Requires Screen Recording Access',
          detail: 'To capture screenshots for activity monitoring, this app needs screen recording permissions.\n\n' +
                  'Steps:\n' +
                  '1. Click "Open System Settings" below\n' +
                  '2. Go to Privacy & Security → Screen Recording\n' +
                  '3. Enable access for this app\n' +
                  '4. Restart the app after granting permissions',
          buttons: ['Open System Settings', 'Remind Me Later'],
          defaultId: 0,
          cancelId: 1,
        });

        if (result.response === 0) {
          await this.openScreenRecordingSettings();
        }
        
        return false;
      }

      return true;
    } catch (error) {
      log.error('Error requesting screen recording permissions:', error);
      return false;
    }
  }

  /**
   * Open macOS System Settings to Screen Recording panel
   */
  static async openScreenRecordingSettings(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        await shell.openExternal('x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture');
        log.info('Opened System Settings → Privacy & Security → Screen Recording');
      }
    } catch (error) {
      log.error('Error opening screen recording settings:', error);
    }
  }

  /**
   * Check all required permissions at once
   */
  static async checkAllPermissions(): Promise<{
    accessibility: boolean;
    screenRecording: boolean;
    allGranted: boolean;
  }> {
    const accessibility = await this.hasAccessibilityPermissions();
    const screenRecording = await this.hasScreenRecordingPermissions();
    
    return {
      accessibility,
      screenRecording,
      allGranted: accessibility && screenRecording,
    };
  }

  /**
   * Show a comprehensive permissions dialog if any are missing
   */
  static async showPermissionsDialogIfNeeded(): Promise<boolean> {
    const permissions = await this.checkAllPermissions();
    
    if (permissions.allGranted) {
      log.info('✅ All required permissions granted');
      return true;
    }

    const missingPermissions: string[] = [];
    if (!permissions.accessibility) {
      missingPermissions.push('• Accessibility (for window tracking)');
    }
    if (!permissions.screenRecording) {
      missingPermissions.push('• Screen Recording (for screenshots)');
    }

    log.warn(`Missing permissions: ${missingPermissions.join(', ')}`);

    const result = await dialog.showMessageBox({
      type: 'warning',
      title: 'Permissions Required',
      message: 'Activity Monitoring Requires System Permissions',
      detail: `The following permissions are required:\n\n${missingPermissions.join('\n')}\n\n` +
              'The app will continue to run, but features requiring these permissions will not work until granted.\n\n' +
              'Click "Grant Permissions" to open System Settings.',
      buttons: ['Grant Permissions', 'Continue Anyway'],
      defaultId: 0,
      cancelId: 1,
    });

    if (result.response === 0) {
      if (!permissions.accessibility) {
        await this.requestAccessibilityPermissions();
      }
      if (!permissions.screenRecording) {
        await this.requestScreenRecordingPermissions();
      }
    }

    return permissions.allGranted;
  }
}
