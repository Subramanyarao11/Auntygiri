/**
 * Window Activity Tracker
 * Tracks active windows and applications across platforms
 */

import { BrowserWindow, systemPreferences } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import { 
  WindowActivity, 
  WindowEventPayload,
  ActivityTrackingError,
  ActivityErrorCodes 
} from '../../shared/types/activity';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

const execAsync = promisify(exec);

interface WindowInfo {
  appName: string;
  windowTitle: string;
  processName: string;
  processId: number;
  platform: NodeJS.Platform;
}

interface AppTimeTracker {
  [appName: string]: {
    totalTime: number;
    lastActiveTime: number;
    isCurrentlyActive: boolean;
  };
}

export class WindowTracker {
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private intervalMs = 10000; // 10 seconds default
  private mainWindow: BrowserWindow | null = null;
  private appTimeMap: AppTimeTracker = {};
  private currentWindow: WindowInfo | null = null;
  private lastUpdateTime = Date.now();

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupPermissions();
  }

  /**
   * Setup required permissions for window tracking
   */
  private async setupPermissions(): Promise<void> {
    try {
      if (process.platform === 'darwin') {
        // Request accessibility permissions on macOS
        const hasAccess = systemPreferences.isTrustedAccessibilityClient(false);
        if (!hasAccess) {
          log.warn('Accessibility permissions not granted. Window tracking may be limited.');
          // Prompt user to grant permissions
          systemPreferences.isTrustedAccessibilityClient(true);
        }
      }
    } catch (error) {
      log.error('Failed to setup window tracking permissions:', error);
    }
  }

  /**
   * Start window tracking
   */
  public startWindowTracking(intervalMs = 10000): void {
    if (this.isTracking) {
      log.warn('Window tracking is already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.isTracking = true;
    this.lastUpdateTime = Date.now();

    log.info(`Starting window tracking with ${intervalMs}ms interval`);

    // Initial capture
    this.captureActiveWindow();

    // Set up periodic tracking
    this.trackingInterval = setInterval(() => {
      this.captureActiveWindow();
    }, this.intervalMs);

    // Track when our app loses/gains focus
    this.setupAppFocusTracking();
  }

  /**
   * Stop window tracking
   */
  public stopWindowTracking(): void {
    if (!this.isTracking) {
      return;
    }

    log.info('Stopping window tracking');
    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Update final time for current app
    this.updateAppTime();
  }

  /**
   * Get current tracking state
   */
  public getTrackingState(): { isTracking: boolean; appTimeMap: AppTimeTracker } {
    return {
      isTracking: this.isTracking,
      appTimeMap: { ...this.appTimeMap }
    };
  }

  /**
   * Reset tracking data
   */
  public resetTrackingData(): void {
    this.appTimeMap = {};
    this.currentWindow = null;
    log.info('Window tracking data reset');
  }

  /**
   * Capture active window information
   */
  private async captureActiveWindow(): Promise<void> {
    try {
      const windowInfo = await this.getActiveWindowInfo();
      
      if (!windowInfo) {
        return;
      }

      // Update time for previous app before switching
      this.updateAppTime();

      // Check if window changed
      const windowChanged = !this.currentWindow || 
        this.currentWindow.appName !== windowInfo.appName ||
        this.currentWindow.windowTitle !== windowInfo.windowTitle;

      if (windowChanged) {
        this.currentWindow = windowInfo;
        this.lastUpdateTime = Date.now();

        // Initialize app in time tracker if not exists
        if (!this.appTimeMap[windowInfo.appName]) {
          this.appTimeMap[windowInfo.appName] = {
            totalTime: 0,
            lastActiveTime: Date.now(),
            isCurrentlyActive: true
          };
        } else {
          this.appTimeMap[windowInfo.appName].lastActiveTime = Date.now();
          this.appTimeMap[windowInfo.appName].isCurrentlyActive = true;
        }

        // Mark other apps as inactive
        Object.keys(this.appTimeMap).forEach(appName => {
          if (appName !== windowInfo.appName) {
            this.appTimeMap[appName].isCurrentlyActive = false;
          }
        });

        // Create activity event
        const activity: WindowActivity = {
          id: `window_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'window',
          timestamp: Date.now(),
          appName: windowInfo.appName,
          windowTitle: windowInfo.windowTitle,
          processName: windowInfo.processName,
          processId: windowInfo.processId,
          duration: 0, // Will be updated as time passes
          isActive: true,
          platform: windowInfo.platform as 'darwin' | 'win32' | 'linux'
        };

        // Send to renderer
        this.emitWindowEvent(activity);

        log.info(`Active window: ${windowInfo.appName} - ${windowInfo.windowTitle}`);
      }

    } catch (error) {
      log.error('Failed to capture active window:', error);
      throw new ActivityTrackingError(
        'Failed to capture active window',
        ActivityErrorCodes.TRACKING_FAILED,
        error
      );
    }
  }

  /**
   * Update time spent in current app
   */
  private updateAppTime(): void {
    if (!this.currentWindow) return;

    const now = Date.now();
    const timeSpent = Math.floor((now - this.lastUpdateTime) / 1000); // seconds
    
    if (this.appTimeMap[this.currentWindow.appName]) {
      this.appTimeMap[this.currentWindow.appName].totalTime += timeSpent;
    }

    this.lastUpdateTime = now;
  }

  /**
   * Get active window information based on platform
   */
  private async getActiveWindowInfo(): Promise<WindowInfo | null> {
    try {
      switch (process.platform) {
        case 'darwin':
          return await this.getActiveWindowMacOS();
        case 'win32':
          return await this.getActiveWindowWindows();
        case 'linux':
          return await this.getActiveWindowLinux();
        default:
          throw new Error(`Unsupported platform: ${process.platform}`);
      }
    } catch (error) {
      log.error('Failed to get active window info:', error);
      return null;
    }
  }

  /**
   * Get active window on macOS using AppleScript
   */
  private async getActiveWindowMacOS(): Promise<WindowInfo | null> {
    try {
      const script = `
        tell application "System Events"
          set frontApp to first application process whose frontmost is true
          set appName to name of frontApp
          set windowTitle to ""
          try
            set windowTitle to name of front window of frontApp
          end try
          return appName & "|||" & windowTitle & "|||" & (unix id of frontApp)
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const [appName, windowTitle, processId] = stdout.trim().split('|||');

      if (!appName) return null;

      return {
        appName: appName.trim(),
        windowTitle: windowTitle?.trim() || '',
        processName: appName.trim(),
        processId: parseInt(processId) || 0,
        platform: 'darwin'
      };
    } catch (error) {
      log.error('Failed to get macOS active window:', error);
      return null;
    }
  }

  /**
   * Get active window on Windows using PowerShell
   */
  private async getActiveWindowWindows(): Promise<WindowInfo | null> {
    try {
      const script = `
        Add-Type -TypeDefinition '
          using System;
          using System.Diagnostics;
          using System.Runtime.InteropServices;
          using System.Text;
          public class Win32 {
            [DllImport("user32.dll")]
            public static extern IntPtr GetForegroundWindow();
            [DllImport("user32.dll")]
            public static extern int GetWindowText(IntPtr hWnd, StringBuilder text, int count);
            [DllImport("user32.dll")]
            public static extern int GetWindowThreadProcessId(IntPtr hWnd, out int processId);
          }
        ';
        $hwnd = [Win32]::GetForegroundWindow();
        $processId = 0;
        [Win32]::GetWindowThreadProcessId($hwnd, [ref]$processId);
        $process = Get-Process -Id $processId -ErrorAction SilentlyContinue;
        $title = New-Object System.Text.StringBuilder 256;
        [Win32]::GetWindowText($hwnd, $title, $title.Capacity);
        if ($process) {
          Write-Output "$($process.ProcessName)|||$($title.ToString())|||$($processId)";
        }
      `;

      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      const [processName, windowTitle, processId] = stdout.trim().split('|||');

      if (!processName) return null;

      return {
        appName: processName.trim(),
        windowTitle: windowTitle?.trim() || '',
        processName: processName.trim(),
        processId: parseInt(processId) || 0,
        platform: 'win32'
      };
    } catch (error) {
      log.error('Failed to get Windows active window:', error);
      return null;
    }
  }

  /**
   * Get active window on Linux using xdotool/wmctrl
   */
  private async getActiveWindowLinux(): Promise<WindowInfo | null> {
    try {
      // Try xdotool first
      try {
        const { stdout: windowId } = await execAsync('xdotool getactivewindow');
        const { stdout: windowInfo } = await execAsync(`xdotool getwindowname ${windowId.trim()}`);
        const { stdout: processInfo } = await execAsync(`xdotool getwindowpid ${windowId.trim()}`);
        
        const processId = parseInt(processInfo.trim());
        const { stdout: processName } = await execAsync(`ps -p ${processId} -o comm=`);

        return {
          appName: processName.trim(),
          windowTitle: windowInfo.trim(),
          processName: processName.trim(),
          processId,
          platform: 'linux'
        };
      } catch {
        // Fallback to wmctrl
        const { stdout } = await execAsync('wmctrl -l -p');
        const lines = stdout.trim().split('\n');
        
        for (const line of lines) {
          const parts = line.split(/\s+/);
          if (parts.length >= 4) {
            const processId = parseInt(parts[2]);
            const windowTitle = parts.slice(4).join(' ');
            const { stdout: processName } = await execAsync(`ps -p ${processId} -o comm=`);
            
            return {
              appName: processName.trim(),
              windowTitle,
              processName: processName.trim(),
              processId,
              platform: 'linux'
            };
          }
        }
      }
      
      return null;
    } catch (error) {
      log.error('Failed to get Linux active window:', error);
      return null;
    }
  }

  /**
   * Setup app focus tracking to pause when our app is active
   */
  private setupAppFocusTracking(): void {
    if (!this.mainWindow) return;

    this.mainWindow.on('focus', () => {
      // Optionally pause tracking when our app is focused
      log.debug('Main window focused - continuing tracking');
    });

    this.mainWindow.on('blur', () => {
      // Resume tracking when our app loses focus
      log.debug('Main window blurred - tracking external apps');
    });
  }

  /**
   * Emit window event to renderer process
   */
  private emitWindowEvent(activity: WindowActivity): void {
    if (!this.mainWindow) return;

    const payload: WindowEventPayload = {
      event: activity,
      summary: {
        totalTime: Object.values(this.appTimeMap).reduce((sum, app) => sum + app.totalTime, 0),
        appTimeMap: Object.fromEntries(
          Object.entries(this.appTimeMap).map(([app, data]) => [app, data.totalTime])
        )
      }
    };

    this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.WINDOW_EVENT, payload);
  }

  /**
   * Get app time statistics
   */
  public getAppTimeStats(): { [appName: string]: number } {
    this.updateAppTime(); // Update current app time
    return Object.fromEntries(
      Object.entries(this.appTimeMap).map(([app, data]) => [app, data.totalTime])
    );
  }

  /**
   * Get total active time
   */
  public getTotalActiveTime(): number {
    this.updateAppTime();
    return Object.values(this.appTimeMap).reduce((sum, app) => sum + app.totalTime, 0);
  }
}
