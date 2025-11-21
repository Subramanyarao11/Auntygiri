/**
 * Focus Manager Service
 * Manages focus mode sessions
 */

import { BrowserWindow } from 'electron';
import Store from 'electron-store';
import log from 'electron-log';
import { generateId } from '../../../shared/utils';
import { FOCUS_SESSION_STATUS } from '../../../shared/constants/APP_CONSTANTS';
import type { FocusSession } from '../../../shared/types';

const FOCUS_SESSION_KEY = 'active_focus_session';

export class FocusManager {
  private store: Store;

  constructor(_mainWindow: BrowserWindow, store: Store) {
    this.store = store;
  }

  /**
   * Start a focus session
   */
  async startSession(duration: number): Promise<FocusSession> {
    try {
      log.info('Starting focus session:', duration);

      const session: FocusSession = {
        id: generateId(),
        startTime: Date.now(),
        plannedDuration: duration,
        actualDuration: 0,
        pausedDuration: 0,
        status: FOCUS_SESSION_STATUS.ACTIVE,
        breaks: [],
      };

      this.store.set(FOCUS_SESSION_KEY, session);

      return session;
    } catch (error) {
      log.error('Error starting focus session:', error);
      throw error;
    }
  }

  /**
   * Pause the active session
   */
  async pauseSession(): Promise<void> {
    try {
      const session = this.getActiveSession();
      if (!session || session.status !== FOCUS_SESSION_STATUS.ACTIVE) {
        throw new Error('No active session to pause');
      }

      session.status = FOCUS_SESSION_STATUS.PAUSED;
      session.pausedAt = Date.now();

      this.store.set(FOCUS_SESSION_KEY, session);
      log.info('Focus session paused');
    } catch (error) {
      log.error('Error pausing focus session:', error);
      throw error;
    }
  }

  /**
   * Resume a paused session
   */
  async resumeSession(): Promise<void> {
    try {
      const session = this.getActiveSession();
      if (!session || session.status !== FOCUS_SESSION_STATUS.PAUSED) {
        throw new Error('No paused session to resume');
      }

      if (session.pausedAt) {
        const pauseDuration = Date.now() - session.pausedAt;
        session.pausedDuration += pauseDuration;

        session.breaks.push({
          startTime: session.pausedAt,
          endTime: Date.now(),
          duration: pauseDuration,
        });
      }

      session.status = FOCUS_SESSION_STATUS.ACTIVE;
      session.pausedAt = undefined;

      this.store.set(FOCUS_SESSION_KEY, session);
      log.info('Focus session resumed');
    } catch (error) {
      log.error('Error resuming focus session:', error);
      throw error;
    }
  }

  /**
   * End the active session
   */
  async endSession(): Promise<FocusSession> {
    try {
      const session = this.getActiveSession();
      if (!session) {
        throw new Error('No active session to end');
      }

      session.endTime = Date.now();
      session.actualDuration = session.endTime - session.startTime - session.pausedDuration;
      session.status = FOCUS_SESSION_STATUS.COMPLETED;

      // Store completed session in history
      const history = this.store.get('focus_session_history', []) as FocusSession[];
      history.push(session);
      this.store.set('focus_session_history', history);

      // Clear active session
      this.store.delete(FOCUS_SESSION_KEY);

      log.info('Focus session ended:', session.id);
      return session;
    } catch (error) {
      log.error('Error ending focus session:', error);
      throw error;
    }
  }

  /**
   * Get the active session
   */
  getActiveSession(): FocusSession | null {
    return this.store.get(FOCUS_SESSION_KEY) as FocusSession | null;
  }
}

