/**
 * System Metrics Tracker
 * Monitors CPU, memory, disk, and network usage
 */

import { BrowserWindow } from 'electron';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

const execAsync = promisify(exec);

interface SystemMetrics {
  cpu: {
    usage: number; // 0-100
    temperature?: number; // celsius
  };
  memory: {
    usage: number; // 0-100
    total?: number; // bytes
    used?: number; // bytes
  };
  disk: {
    usage: number; // 0-100
    read?: number; // bytes/sec
    write?: number; // bytes/sec
  };
  network: {
    in?: number; // bytes/sec
    out?: number; // bytes/sec
  };
  timestamp: number;
}

export class SystemMetricsTracker {
  private isTracking = false;
  private trackingInterval: NodeJS.Timeout | null = null;
  private intervalMs = 30000; // 30 seconds default
  private mainWindow: BrowserWindow | null = null;
  private lastNetworkStats: { rx: number; tx: number; timestamp: number } | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Start system metrics tracking
   */
  public startMetricsTracking(intervalMs = 30000): void {
    if (this.isTracking) {
      log.warn('System metrics tracking is already running');
      return;
    }

    this.intervalMs = intervalMs;
    this.isTracking = true;

    log.info(`Starting system metrics tracking with ${intervalMs}ms interval`);

    // Initial capture
    this.captureMetrics();

    // Set up periodic tracking
    this.trackingInterval = setInterval(() => {
      this.captureMetrics();
    }, this.intervalMs);
  }

  /**
   * Stop system metrics tracking
   */
  public stopMetricsTracking(): void {
    if (!this.isTracking) {
      return;
    }

    log.info('Stopping system metrics tracking');
    this.isTracking = false;

    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
    }
  }

  /**
   * Get current tracking state
   */
  public getTrackingState(): { isTracking: boolean } {
    return { isTracking: this.isTracking };
  }

  /**
   * Capture current system metrics
   */
  private async captureMetrics(): Promise<void> {
    try {
      const metrics = await this.getSystemMetrics();
      
      if (metrics) {
        // Send to renderer
        this.emitMetricsEvent(metrics);
        log.debug('System metrics captured:', {
          cpu: metrics.cpu.usage,
          memory: metrics.memory.usage,
          disk: metrics.disk.usage
        });
      }
    } catch (error) {
      log.error('Failed to capture system metrics:', error);
    }
  }

  /**
   * Get system metrics based on platform
   */
  private async getSystemMetrics(): Promise<SystemMetrics | null> {
    try {
      switch (process.platform) {
        case 'darwin':
          return await this.getMetricsMacOS();
        case 'win32':
          return await this.getMetricsWindows();
        case 'linux':
          return await this.getMetricsLinux();
        default:
          throw new Error(`Unsupported platform: ${process.platform}`);
      }
    } catch (error) {
      log.error('Failed to get system metrics:', error);
      return null;
    }
  }

  /**
   * Get system metrics on macOS
   */
  private async getMetricsMacOS(): Promise<SystemMetrics | null> {
    try {
      // CPU usage
      const { stdout: cpuOutput } = await execAsync('top -l 1 -n 0 | grep "CPU usage"');
      const cpuMatch = cpuOutput.match(/(\d+\.\d+)% user/);
      const cpuUsage = cpuMatch ? parseFloat(cpuMatch[1]) : 0;

      // Memory usage
      const { stdout: memOutput } = await execAsync('vm_stat');
      const pageSize = 4096; // 4KB pages on macOS
      const freeMatch = memOutput.match(/Pages free:\s+(\d+)/);
      const activeMatch = memOutput.match(/Pages active:\s+(\d+)/);
      const inactiveMatch = memOutput.match(/Pages inactive:\s+(\d+)/);
      const wiredMatch = memOutput.match(/Pages wired down:\s+(\d+)/);

      const freePages = freeMatch ? parseInt(freeMatch[1]) : 0;
      const activePages = activeMatch ? parseInt(activeMatch[1]) : 0;
      const inactivePages = inactiveMatch ? parseInt(inactiveMatch[1]) : 0;
      const wiredPages = wiredMatch ? parseInt(wiredMatch[1]) : 0;

      const totalPages = freePages + activePages + inactivePages + wiredPages;
      const usedPages = activePages + inactivePages + wiredPages;
      const memoryUsage = totalPages > 0 ? (usedPages / totalPages) * 100 : 0;

      // Disk usage (root partition)
      const { stdout: diskOutput } = await execAsync('df -h /');
      const diskLines = diskOutput.split('\n');
      const diskLine = diskLines[1];
      const diskParts = diskLine.split(/\s+/);
      const diskUsageStr = diskParts[4];
      const diskUsage = diskUsageStr ? parseFloat(diskUsageStr.replace('%', '')) : 0;

      // Network stats (simplified)
      const { stdout: netOutput } = await execAsync('netstat -ib | grep -E "en0|en1" | head -1');
      const netParts = netOutput.split(/\s+/);
      const rxBytes = netParts[6] ? parseInt(netParts[6]) : 0;
      const txBytes = netParts[9] ? parseInt(netParts[9]) : 0;

      // Calculate network rate if we have previous stats
      let networkIn = 0;
      let networkOut = 0;
      const now = Date.now();

      if (this.lastNetworkStats) {
        const timeDiff = (now - this.lastNetworkStats.timestamp) / 1000; // seconds
        networkIn = (rxBytes - this.lastNetworkStats.rx) / timeDiff;
        networkOut = (txBytes - this.lastNetworkStats.tx) / timeDiff;
      }

      this.lastNetworkStats = { rx: rxBytes, tx: txBytes, timestamp: now };

      return {
        cpu: { usage: cpuUsage },
        memory: { 
          usage: memoryUsage,
          total: totalPages * pageSize,
          used: usedPages * pageSize
        },
        disk: { usage: diskUsage },
        network: { in: networkIn, out: networkOut },
        timestamp: now
      };
    } catch (error) {
      log.error('Failed to get macOS metrics:', error);
      return null;
    }
  }

  /**
   * Get system metrics on Windows
   */
  private async getMetricsWindows(): Promise<SystemMetrics | null> {
    try {
      // CPU usage
      const { stdout: cpuOutput } = await execAsync(
        'wmic cpu get loadpercentage /value'
      );
      const cpuMatch = cpuOutput.match(/LoadPercentage=(\d+)/);
      const cpuUsage = cpuMatch ? parseInt(cpuMatch[1]) : 0;

      // Memory usage
      const { stdout: memOutput } = await execAsync(
        'wmic OS get TotalVisibleMemorySize,FreePhysicalMemory /value'
      );
      const totalMatch = memOutput.match(/TotalVisibleMemorySize=(\d+)/);
      const freeMatch = memOutput.match(/FreePhysicalMemory=(\d+)/);
      
      const totalMemory = totalMatch ? parseInt(totalMatch[1]) * 1024 : 0; // Convert KB to bytes
      const freeMemory = freeMatch ? parseInt(freeMatch[1]) * 1024 : 0;
      const usedMemory = totalMemory - freeMemory;
      const memoryUsage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

      // Disk usage (C: drive)
      const { stdout: diskOutput } = await execAsync(
        'wmic logicaldisk where caption="C:" get size,freespace /value'
      );
      const diskSizeMatch = diskOutput.match(/Size=(\d+)/);
      const diskFreeMatch = diskOutput.match(/FreeSpace=(\d+)/);
      
      const diskSize = diskSizeMatch ? parseInt(diskSizeMatch[1]) : 0;
      const diskFree = diskFreeMatch ? parseInt(diskFreeMatch[1]) : 0;
      const diskUsed = diskSize - diskFree;
      const diskUsage = diskSize > 0 ? (diskUsed / diskSize) * 100 : 0;

      return {
        cpu: { usage: cpuUsage },
        memory: { 
          usage: memoryUsage,
          total: totalMemory,
          used: usedMemory
        },
        disk: { usage: diskUsage },
        network: { in: 0, out: 0 }, // Simplified for Windows
        timestamp: Date.now()
      };
    } catch (error) {
      log.error('Failed to get Windows metrics:', error);
      return null;
    }
  }

  /**
   * Get system metrics on Linux
   */
  private async getMetricsLinux(): Promise<SystemMetrics | null> {
    try {
      // CPU usage from /proc/stat
      const { stdout: cpuOutput } = await execAsync(
        'grep "cpu " /proc/stat | awk \'{usage=($2+$4)*100/($2+$3+$4+$5)} END {print usage}\''
      );
      const cpuUsage = parseFloat(cpuOutput.trim()) || 0;

      // Memory usage from /proc/meminfo
      const { stdout: memOutput } = await execAsync('cat /proc/meminfo');
      const totalMatch = memOutput.match(/MemTotal:\s+(\d+) kB/);
      const availableMatch = memOutput.match(/MemAvailable:\s+(\d+) kB/);
      
      const totalMemory = totalMatch ? parseInt(totalMatch[1]) * 1024 : 0; // Convert KB to bytes
      const availableMemory = availableMatch ? parseInt(availableMatch[1]) * 1024 : 0;
      const usedMemory = totalMemory - availableMemory;
      const memoryUsage = totalMemory > 0 ? (usedMemory / totalMemory) * 100 : 0;

      // Disk usage (root partition)
      const { stdout: diskOutput } = await execAsync('df / | tail -1');
      const diskParts = diskOutput.split(/\s+/);
      const diskUsageStr = diskParts[4];
      const diskUsage = diskUsageStr ? parseFloat(diskUsageStr.replace('%', '')) : 0;

      return {
        cpu: { usage: cpuUsage },
        memory: { 
          usage: memoryUsage,
          total: totalMemory,
          used: usedMemory
        },
        disk: { usage: diskUsage },
        network: { in: 0, out: 0 }, // Simplified for Linux
        timestamp: Date.now()
      };
    } catch (error) {
      log.error('Failed to get Linux metrics:', error);
      return null;
    }
  }

  /**
   * Emit metrics event to renderer process
   */
  private emitMetricsEvent(metrics: SystemMetrics): void {
    if (!this.mainWindow) return;

    this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.METRICS_UPDATE, {
      metrics,
      timestamp: Date.now()
    });
  }

  /**
   * Get current system metrics (one-time)
   */
  public async getCurrentMetrics(): Promise<SystemMetrics | null> {
    return await this.getSystemMetrics();
  }
}
