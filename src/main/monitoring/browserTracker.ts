/**
 * Browser Activity Tracker
 * Tracks active browser tabs and URLs across different browsers
 */

import { BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import { 
  BrowserActivity, 
  BrowserEventPayload
} from '../../shared/types/activity';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

const execAsync = promisify(exec);

interface BrowserInfo {
  browserName: string;
  url: string;
  title: string;
  domain: string;
  tabId?: string;
  isIncognito?: boolean;
}

interface DomainTimeTracker {
  [domain: string]: {
    totalTime: number;
    visits: number;
    lastVisitTime: number;
  };
}

export class BrowserTracker {
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private intervalMs = 10000; // 10 seconds default
  private mainWindow: BrowserWindow | null = null;
  private domainTimeMap: DomainTimeTracker = {};
  private currentBrowser: BrowserInfo | null = null;
  private lastUpdateTime = Date.now();

  // Supported browsers and their process names
  private readonly BROWSERS = {
    chrome: ['Google Chrome', 'chrome', 'chromium'],
    firefox: ['Firefox', 'firefox'],
    safari: ['Safari', 'safari'],
    edge: ['Microsoft Edge', 'msedge', 'edge'],
    brave: ['Brave Browser', 'brave'],
    opera: ['Opera', 'opera']
  };

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Start browser tracking
   */
  public startBrowserTracking(intervalMs = 10000): void {
    if (this.isTracking) {
      log.warn('Browser tracking is already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.isTracking = true;
    this.lastUpdateTime = Date.now();

    log.info(`Starting browser tracking with ${intervalMs}ms interval`);

    // Initial capture
    this.captureActiveBrowserTab();

    // Set up periodic tracking
    this.trackingInterval = setInterval(() => {
      this.captureActiveBrowserTab();
    }, this.intervalMs);
  }

  /**
   * Stop browser tracking
   */
  public stopBrowserTracking(): void {
    if (!this.isTracking) {
      return;
    }

    log.info('Stopping browser tracking');
    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }

    // Update final time for current domain
    this.updateDomainTime();
  }

  /**
   * Get current tracking state
   */
  public getTrackingState(): { isTracking: boolean; domainTimeMap: DomainTimeTracker } {
    return {
      isTracking: this.isTracking,
      domainTimeMap: { ...this.domainTimeMap }
    };
  }

  /**
   * Reset tracking data
   */
  public resetTrackingData(): void {
    this.domainTimeMap = {};
    this.currentBrowser = null;
    log.info('Browser tracking data reset');
  }

  /**
   * Capture active browser tab information
   */
  private async captureActiveBrowserTab(): Promise<void> {
    try {
      const browserInfo = await this.getActiveBrowserTab();
      
      if (!browserInfo) {
        return;
      }

      // Update time for previous domain before switching
      this.updateDomainTime();

      // Check if browser tab changed
      const tabChanged = !this.currentBrowser || 
        this.currentBrowser.url !== browserInfo.url ||
        this.currentBrowser.title !== browserInfo.title;

      if (tabChanged) {
        this.currentBrowser = browserInfo;
        this.lastUpdateTime = Date.now();

        // Initialize domain in time tracker if not exists
        if (!this.domainTimeMap[browserInfo.domain]) {
          this.domainTimeMap[browserInfo.domain] = {
            totalTime: 0,
            visits: 1,
            lastVisitTime: Date.now()
          };
        } else {
          this.domainTimeMap[browserInfo.domain].visits++;
          this.domainTimeMap[browserInfo.domain].lastVisitTime = Date.now();
        }

        // Create activity event
        const activity: BrowserActivity = {
          id: `browser_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'browser',
          timestamp: Date.now(),
          url: browserInfo.url,
          domain: browserInfo.domain,
          title: browserInfo.title,
          browserName: browserInfo.browserName,
          tabId: browserInfo.tabId,
          isIncognito: browserInfo.isIncognito
        };

        // Send to renderer
        this.emitBrowserEvent(activity);

        log.info(`Active browser tab: ${browserInfo.browserName} - ${browserInfo.domain} - ${browserInfo.title}`);
      }

    } catch (error) {
      log.error('Failed to capture active browser tab:', error);
    }
  }

  /**
   * Update time spent on current domain
   */
  private updateDomainTime(): void {
    if (!this.currentBrowser) return;

    const now = Date.now();
    const timeSpent = Math.floor((now - this.lastUpdateTime) / 1000); // seconds
    
    if (this.domainTimeMap[this.currentBrowser.domain]) {
      this.domainTimeMap[this.currentBrowser.domain].totalTime += timeSpent;
    }

    this.lastUpdateTime = now;
  }

  /**
   * Get active browser tab based on platform
   */
  public async getActiveBrowserTab(): Promise<BrowserInfo | null> {
    try {
      switch (process.platform) {
        case 'darwin':
          return await this.getActiveBrowserTabMacOS();
        case 'win32':
          return await this.getActiveBrowserTabWindows();
        case 'linux':
          return await this.getActiveBrowserTabLinux();
        default:
          throw new Error(`Unsupported platform: ${process.platform}`);
      }
    } catch (error) {
      log.error('Failed to get active browser tab:', error);
      return null;
    }
  }

  /**
   * Get active browser tab on macOS using AppleScript
   */
  private async getActiveBrowserTabMacOS(): Promise<BrowserInfo | null> {
    try {
      // Try Chrome first
      const chromeInfo = await this.getChromeTabMacOS();
      if (chromeInfo) return chromeInfo;

      // Try Safari
      const safariInfo = await this.getSafariTabMacOS();
      if (safariInfo) return safariInfo;

      // Try Firefox
      const firefoxInfo = await this.getFirefoxTabMacOS();
      if (firefoxInfo) return firefoxInfo;

      return null;
    } catch (error) {
      log.error('Failed to get macOS browser tab:', error);
      return null;
    }
  }

  /**
   * Get Chrome tab info on macOS
   */
  private async getChromeTabMacOS(): Promise<BrowserInfo | null> {
    try {
      const script = `
        tell application "System Events"
          if exists (application process "Google Chrome") then
            tell application "Google Chrome"
              if (count of windows) > 0 then
                set activeTab to active tab of front window
                set tabURL to URL of activeTab
                set tabTitle to title of activeTab
                return tabURL & "|||" & tabTitle
              end if
            end tell
          end if
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const [url, title] = stdout.trim().split('|||');

      if (!url || url === '') return null;

      return {
        browserName: 'chrome',
        url: url.trim(),
        title: title?.trim() || '',
        domain: this.extractDomain(url.trim()),
        isIncognito: url.includes('chrome://newtab') ? false : undefined
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get Safari tab info on macOS
   */
  private async getSafariTabMacOS(): Promise<BrowserInfo | null> {
    try {
      const script = `
        tell application "System Events"
          if exists (application process "Safari") then
            tell application "Safari"
              if (count of windows) > 0 then
                set activeTab to current tab of front window
                set tabURL to URL of activeTab
                set tabTitle to name of activeTab
                return tabURL & "|||" & tabTitle
              end if
            end tell
          end if
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const [url, title] = stdout.trim().split('|||');

      if (!url || url === '') return null;

      return {
        browserName: 'safari',
        url: url.trim(),
        title: title?.trim() || '',
        domain: this.extractDomain(url.trim())
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get Firefox tab info on macOS
   */
  private async getFirefoxTabMacOS(): Promise<BrowserInfo | null> {
    try {
      // Firefox doesn't support AppleScript as well, so we'll use a different approach
      // This is a simplified version - in production you might want to use Firefox's remote debugging protocol
      const script = `
        tell application "System Events"
          if exists (application process "Firefox") then
            tell application process "Firefox"
              set windowTitle to name of front window
              return windowTitle
            end tell
          end if
        end tell
      `;

      const { stdout } = await execAsync(`osascript -e '${script}'`);
      const windowTitle = stdout.trim();

      if (!windowTitle) return null;

      // Extract URL from window title (Firefox usually shows "Page Title - Mozilla Firefox")
      const title = windowTitle.replace(' - Mozilla Firefox', '');

      return {
        browserName: 'firefox',
        url: '', // Firefox doesn't easily expose URL via AppleScript
        title,
        domain: 'unknown' // Would need more sophisticated detection
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Get active browser tab on Windows
   */
  private async getActiveBrowserTabWindows(): Promise<BrowserInfo | null> {
    try {
      // This is a simplified implementation
      // In production, you'd want to use browser-specific APIs or automation libraries
      const script = `
        $processes = Get-Process | Where-Object {$_.ProcessName -match "chrome|firefox|msedge|safari"} | Where-Object {$_.MainWindowTitle -ne ""}
        foreach ($process in $processes) {
          $title = $process.MainWindowTitle
          if ($title -ne "") {
            Write-Output "$($process.ProcessName)|||$title"
            break
          }
        }
      `;

      const { stdout } = await execAsync(`powershell -Command "${script}"`);
      const [processName, windowTitle] = stdout.trim().split('|||');

      if (!processName || !windowTitle) return null;

      const browserName = this.mapProcessNameToBrowser(processName);

      return {
        browserName,
        url: '', // Would need more sophisticated detection
        title: windowTitle.trim(),
        domain: 'unknown' // Would need URL extraction
      };
    } catch (error) {
      log.error('Failed to get Windows browser tab:', error);
      return null;
    }
  }

  /**
   * Get active browser tab on Linux
   */
  private async getActiveBrowserTabLinux(): Promise<BrowserInfo | null> {
    try {
      // Similar to Windows, this is simplified
      const { stdout } = await execAsync('wmctrl -l | grep -E "(Chrome|Firefox|Safari)"');
      const lines = stdout.trim().split('\n');
      
      if (lines.length === 0) return null;

      const firstLine = lines[0];
      const parts = firstLine.split(/\s+/);
      const windowTitle = parts.slice(4).join(' ');
      
      const browserName = this.detectBrowserFromTitle(windowTitle);

      return {
        browserName,
        url: '', // Would need more sophisticated detection
        title: windowTitle,
        domain: 'unknown'
      };
    } catch (error) {
      log.error('Failed to get Linux browser tab:', error);
      return null;
    }
  }

  /**
   * Extract domain from URL
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Map process name to browser name
   */
  private mapProcessNameToBrowser(processName: string): string {
    const lowerProcess = processName.toLowerCase();
    
    for (const [browser, processes] of Object.entries(this.BROWSERS)) {
      if (processes.some(p => lowerProcess.includes(p.toLowerCase()))) {
        return browser;
      }
    }
    
    return 'unknown';
  }

  /**
   * Detect browser from window title
   */
  private detectBrowserFromTitle(title: string): string {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('chrome')) return 'chrome';
    if (lowerTitle.includes('firefox')) return 'firefox';
    if (lowerTitle.includes('safari')) return 'safari';
    if (lowerTitle.includes('edge')) return 'edge';
    if (lowerTitle.includes('brave')) return 'brave';
    if (lowerTitle.includes('opera')) return 'opera';
    
    return 'unknown';
  }

  /**
   * Emit browser event to renderer process
   */
  private emitBrowserEvent(activity: BrowserActivity): void {
    if (!this.mainWindow) return;

    const payload: BrowserEventPayload = {
      event: activity,
      summary: {
        totalTime: Object.values(this.domainTimeMap).reduce((sum, domain) => sum + domain.totalTime, 0),
        domainTimeMap: Object.fromEntries(
          Object.entries(this.domainTimeMap).map(([domain, data]) => [domain, data.totalTime])
        )
      }
    };

    this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.URL_EVENT, payload);
  }

  /**
   * Get domain time statistics
   */
  public getDomainTimeStats(): { [domain: string]: number } {
    this.updateDomainTime(); // Update current domain time
    return Object.fromEntries(
      Object.entries(this.domainTimeMap).map(([domain, data]) => [domain, data.totalTime])
    );
  }

  /**
   * Get total browsing time
   */
  public getTotalBrowsingTime(): number {
    this.updateDomainTime();
    return Object.values(this.domainTimeMap).reduce((sum, domain) => sum + domain.totalTime, 0);
  }

  /**
   * Get top domains by time spent
   */
  public getTopDomains(limit = 10): Array<{ domain: string; timeSpent: number; visits: number }> {
    this.updateDomainTime();
    
    return Object.entries(this.domainTimeMap)
      .map(([domain, data]) => ({
        domain,
        timeSpent: data.totalTime,
        visits: data.visits
      }))
      .sort((a, b) => b.timeSpent - a.timeSpent)
      .slice(0, limit);
  }
}
