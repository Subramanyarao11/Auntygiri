/**
 * Idle & Focus Detection Tracker
 * Detects user idle/active states and manages focus sessions
 */

import { BrowserWindow, powerMonitor, systemPreferences } from 'electron';
import log from 'electron-log';
import { 
  IdleActivity, 
  FocusActivity,
  ActivityState,
  FocusSession,
  IdleEventPayload,
  FocusEventPayload,
  ActivityTrackingError,
  ActivityErrorCodes 
} from '../../shared/types/activity';
import { IPC_CHANNELS } from '../../shared/constants/IPC_CHANNELS';

interface IdleState {
  isIdle: boolean;
  lastActiveTime: number;
  idleStartTime: number | null;
  totalIdleTime: number;
  totalActiveTime: number;
}

export class IdleTracker {
  private isTracking = false;
  private checkInterval: NodeJS.Timeout | null = null;
  private idleThreshold = 60; // seconds
  private checkIntervalMs = 5000; // 5 seconds
  private mainWindow: BrowserWindow | null = null;
  
  private idleState: IdleState = {
    isIdle: false,
    lastActiveTime: Date.now(),
    idleStartTime: null,
    totalIdleTime: 0,
    totalActiveTime: 0
  };

  private currentFocusSession: FocusSession | null = null;
  private focusSessionPauseTime: number | null = null;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.setupPowerMonitor();
  }

  /**
   * Setup power monitor events
   */
  private setupPowerMonitor(): void {
    // Monitor system sleep/wake
    powerMonitor.on('suspend', () => {
      log.info('System suspended - marking as idle');
      this.handleIdleStart('system');
    });

    powerMonitor.on('resume', () => {
      log.info('System resumed - marking as active');
      this.handleActiveStart('system');
    });

    // Monitor screen lock/unlock (macOS/Windows)
    powerMonitor.on('lock-screen', () => {
      log.info('Screen locked - marking as idle');
      this.handleIdleStart('system');
    });

    powerMonitor.on('unlock-screen', () => {
      log.info('Screen unlocked - marking as active');
      this.handleActiveStart('system');
    });
  }

  /**
   * Start idle monitoring
   */
  public startIdleMonitor(idleThresholdSeconds = 60, checkIntervalMs = 5000): void {
    if (this.isTracking) {
      log.warn('Idle monitoring is already running');
      return;
    }

    this.idleThreshold = idleThresholdSeconds;
    this.checkIntervalMs = checkIntervalMs;
    this.isTracking = true;
    this.idleState.lastActiveTime = Date.now();

    log.info(`Starting idle monitor with ${idleThresholdSeconds}s threshold`);

    // Start periodic idle checking
    this.checkInterval = setInterval(() => {
      this.checkIdleState();
    }, this.checkIntervalMs);
  }

  /**
   * Stop idle monitoring
   */
  public stopIdleMonitor(): void {
    if (!this.isTracking) {
      return;
    }

    log.info('Stopping idle monitor');
    this.isTracking = false;

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    // End any active focus session
    if (this.currentFocusSession && this.currentFocusSession.status === 'active') {
      this.endFocusSession('cancelled');
    }
  }

  /**
   * Check current idle state
   */
  private async checkIdleState(): Promise<void> {
    try {
      const idleTime = await this.getSystemIdleTime();
      const isCurrentlyIdle = idleTime >= this.idleThreshold;

      if (isCurrentlyIdle && !this.idleState.isIdle) {
        // Transition to idle
        this.handleIdleStart('keyboard');
      } else if (!isCurrentlyIdle && this.idleState.isIdle) {
        // Transition to active
        this.handleActiveStart('keyboard');
      }

      // Update active time if not idle
      if (!this.idleState.isIdle) {
        const now = Date.now();
        const activeTime = Math.floor((now - this.idleState.lastActiveTime) / 1000);
        this.idleState.totalActiveTime += activeTime;
        this.idleState.lastActiveTime = now;
      }

    } catch (error) {
      log.error('Failed to check idle state:', error);
    }
  }

  /**
   * Get system idle time in seconds
   */
  private async getSystemIdleTime(): Promise<number> {
    try {
      if (process.platform === 'darwin') {
        // macOS - use system preferences (if available)
        if (typeof (systemPreferences as any).getSystemIdleTime === 'function') {
          return (systemPreferences as any).getSystemIdleTime();
        }
        // Fallback for macOS
        return 0;
      } else if (process.platform === 'win32') {
        // Windows - use PowerShell
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        const script = `
          Add-Type -TypeDefinition '
            using System;
            using System.Runtime.InteropServices;
            public class IdleTime {
              [DllImport("user32.dll")]
              public static extern bool GetLastInputInfo(ref LASTINPUTINFO plii);
              public struct LASTINPUTINFO {
                public uint cbSize;
                public uint dwTime;
              }
            }
          ';
          $lastInput = New-Object IdleTime+LASTINPUTINFO;
          $lastInput.cbSize = [System.Runtime.InteropServices.Marshal]::SizeOf($lastInput);
          [IdleTime]::GetLastInputInfo([ref]$lastInput);
          $idleTime = ([Environment]::TickCount - $lastInput.dwTime) / 1000;
          Write-Output $idleTime;
        `;

        const { stdout } = await execAsync(`powershell -Command "${script}"`);
        return Math.floor(parseFloat(stdout.trim()));
      } else {
        // Linux - use xprintidle if available
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);
        
        try {
          const { stdout } = await execAsync('xprintidle');
          return Math.floor(parseInt(stdout.trim()) / 1000); // Convert ms to seconds
        } catch {
          // Fallback: assume not idle if we can't detect
          return 0;
        }
      }
    } catch (error) {
      log.error('Failed to get system idle time:', error);
      return 0;
    }
  }

  /**
   * Handle transition to idle state
   */
  private handleIdleStart(inputType: 'mouse' | 'keyboard' | 'system'): void {
    if (this.idleState.isIdle) return;

    const now = Date.now();
    this.idleState.isIdle = true;
    this.idleState.idleStartTime = now;

    // Update active time before going idle
    const activeTime = Math.floor((now - this.idleState.lastActiveTime) / 1000);
    this.idleState.totalActiveTime += activeTime;

    // Create idle activity event
    const activity: IdleActivity = {
      id: `idle_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'idle',
      timestamp: now,
      inputType,
      lastActiveTimestamp: this.idleState.lastActiveTime
    };

    // Pause focus session if active
    if (this.currentFocusSession && this.currentFocusSession.status === 'active') {
      this.pauseFocusSession('idle');
    }

    // Send to renderer
    this.emitIdleEvent(activity, ActivityState.ACTIVE, ActivityState.IDLE);

    log.info(`User went idle (${inputType})`);
  }

  /**
   * Handle transition to active state
   */
  private handleActiveStart(inputType: 'mouse' | 'keyboard' | 'system'): void {
    if (!this.idleState.isIdle) return;

    const now = Date.now();
    const idleDuration = this.idleState.idleStartTime ? 
      Math.floor((now - this.idleState.idleStartTime) / 1000) : 0;

    this.idleState.isIdle = false;
    this.idleState.totalIdleTime += idleDuration;
    this.idleState.lastActiveTime = now;
    this.idleState.idleStartTime = null;

    // Create active activity event
    const activity: IdleActivity = {
      id: `active_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'active',
      timestamp: now,
      idleDuration,
      inputType
    };

    // Resume focus session if paused due to idle
    if (this.currentFocusSession && this.currentFocusSession.status === 'paused') {
      this.resumeFocusSession();
    }

    // Send to renderer
    this.emitIdleEvent(activity, ActivityState.IDLE, ActivityState.ACTIVE);

    log.info(`User became active (${inputType}) after ${idleDuration}s idle`);
  }

  /**
   * Start a focus session
   */
  public startFocusSession(targetDurationSeconds: number, _sessionType = 'general'): string {
    if (this.currentFocusSession && this.currentFocusSession.status === 'active') {
      throw new ActivityTrackingError(
        'Focus session already active',
        ActivityErrorCodes.FOCUS_SESSION_ERROR
      );
    }

    const sessionId = `focus_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const now = Date.now();

    this.currentFocusSession = {
      id: sessionId,
      startTime: now,
      targetDuration: targetDurationSeconds,
      actualDuration: 0,
      pausedDuration: 0,
      productivityScore: 0,
      distractions: 0,
      status: 'active',
      activities: []
    };

    // Create focus start event
    const activity: FocusActivity = {
      id: `focus_start_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'focus_start',
      timestamp: now,
      sessionId,
      targetDuration: targetDurationSeconds
    };

    this.currentFocusSession.activities.push(activity);

    // Send to renderer
    this.emitFocusEvent(activity, this.currentFocusSession);

    log.info(`Focus session started: ${sessionId} (${targetDurationSeconds}s target)`);
    return sessionId;
  }

  /**
   * End the current focus session
   */
  public endFocusSession(reason: 'completed' | 'cancelled' | 'interrupted' = 'completed'): FocusSession | null {
    if (!this.currentFocusSession) {
      log.warn('No active focus session to end');
      return null;
    }

    const now = Date.now();
    const session = this.currentFocusSession;
    
    // Calculate final duration
    session.endTime = now;
    session.actualDuration = Math.floor((now - session.startTime) / 1000) - session.pausedDuration;
    session.status = reason === 'completed' ? 'completed' : 'cancelled';

    // Calculate productivity score based on session performance
    session.productivityScore = this.calculateFocusScore(session);

    // Create focus end event
    const activity: FocusActivity = {
      id: `focus_end_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'focus_end',
      timestamp: now,
      sessionId: session.id,
      sessionDuration: session.actualDuration,
      focusScore: session.productivityScore
    };

    session.activities.push(activity);

    // Send to renderer
    this.emitFocusEvent(activity, session);

    log.info(`Focus session ended: ${session.id} (${session.actualDuration}s actual, score: ${session.productivityScore})`);

    const completedSession = { ...session };
    this.currentFocusSession = null;
    this.focusSessionPauseTime = null;

    return completedSession;
  }

  /**
   * Pause the current focus session
   */
  public pauseFocusSession(reason: 'idle' | 'manual' | 'distraction' = 'manual'): void {
    if (!this.currentFocusSession || this.currentFocusSession.status !== 'active') {
      return;
    }

    const now = Date.now();
    this.currentFocusSession.status = 'paused';
    this.focusSessionPauseTime = now;

    if (reason === 'distraction') {
      this.currentFocusSession.distractions++;
    }

    // Create focus pause event
    const activity: FocusActivity = {
      id: `focus_pause_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'focus_pause',
      timestamp: now,
      sessionId: this.currentFocusSession.id,
      pauseReason: reason
    };

    this.currentFocusSession.activities.push(activity);

    // Send to renderer
    this.emitFocusEvent(activity, this.currentFocusSession);

    log.info(`Focus session paused: ${this.currentFocusSession.id} (reason: ${reason})`);
  }

  /**
   * Resume the current focus session
   */
  public resumeFocusSession(): void {
    if (!this.currentFocusSession || this.currentFocusSession.status !== 'paused') {
      return;
    }

    const now = Date.now();
    
    // Add paused time to total
    if (this.focusSessionPauseTime) {
      const pausedTime = Math.floor((now - this.focusSessionPauseTime) / 1000);
      this.currentFocusSession.pausedDuration += pausedTime;
    }

    this.currentFocusSession.status = 'active';
    this.focusSessionPauseTime = null;

    // Create focus resume event
    const activity: FocusActivity = {
      id: `focus_resume_${now}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'focus_resume',
      timestamp: now,
      sessionId: this.currentFocusSession.id
    };

    this.currentFocusSession.activities.push(activity);

    // Send to renderer
    this.emitFocusEvent(activity, this.currentFocusSession);

    log.info(`Focus session resumed: ${this.currentFocusSession.id}`);
  }

  /**
   * Calculate focus score for a session
   */
  private calculateFocusScore(session: FocusSession): number {
    const targetRatio = session.actualDuration / session.targetDuration;
    const pauseRatio = session.pausedDuration / (session.actualDuration + session.pausedDuration);
    const distractionPenalty = Math.min(session.distractions * 5, 30); // Max 30 point penalty

    let score = 100;
    
    // Penalize for not meeting target (if under 80% of target)
    if (targetRatio < 0.8) {
      score -= (0.8 - targetRatio) * 50;
    }
    
    // Penalize for pauses
    score -= pauseRatio * 40;
    
    // Penalize for distractions
    score -= distractionPenalty;
    
    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Emit idle event to renderer process
   */
  private emitIdleEvent(activity: IdleActivity, previousState: ActivityState, newState: ActivityState): void {
    if (!this.mainWindow) return;

    const payload: IdleEventPayload = {
      event: activity,
      previousState,
      newState
    };

    this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.IDLE_EVENT, payload);
  }

  /**
   * Emit focus event to renderer process
   */
  private emitFocusEvent(activity: FocusActivity, session?: FocusSession): void {
    if (!this.mainWindow) return;

    const payload: FocusEventPayload = {
      event: activity,
      session: session ? { ...session } : undefined
    };

    this.mainWindow.webContents.send(IPC_CHANNELS.MONITORING.FOCUS_EVENT, payload);
  }

  /**
   * Get current idle state
   */
  public getIdleState(): IdleState & { currentFocusSession: FocusSession | null } {
    return {
      ...this.idleState,
      currentFocusSession: this.currentFocusSession ? { ...this.currentFocusSession } : null
    };
  }

  /**
   * Get focus session history (would typically come from storage)
   */
  public getFocusSessionHistory(): FocusSession[] {
    // In a real implementation, this would fetch from storage
    return [];
  }

  /**
   * Check if user is currently idle
   */
  public isCurrentlyIdle(): boolean {
    return this.idleState.isIdle;
  }

  /**
   * Get current focus session
   */
  public getCurrentFocusSession(): FocusSession | null {
    return this.currentFocusSession ? { ...this.currentFocusSession } : null;
  }
}
