/**
 * Activity Logger Service
 * Logs and stores user activity entries and sends them to backend
 */

import Store from 'electron-store';
import log from 'electron-log';
import axios from 'axios';
import { formatDate } from '../../../shared/utils';
import type { ActivityEntry } from '../../../shared/types';

const ACTIVITY_STORE_KEY = 'activity_logs';
const API_BASE_URL = 'http://localhost:3000';

export class ActivityLogger {
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  /**
   * Log an activity entry (store locally and send to backend)
   */
  async logActivity(activity: ActivityEntry): Promise<void> {
    try {
      const date = formatDate(activity.timestamp);
      const activities = this.store.get(`${ACTIVITY_STORE_KEY}.${date}`, []) as ActivityEntry[];
      
      activities.push(activity);
      
      this.store.set(`${ACTIVITY_STORE_KEY}.${date}`, activities);
      
      log.debug('Activity logged locally:', activity.type);
      
      // Send to backend API
      await this.sendActivityToBackend(activity);
    } catch (error) {
      log.error('Error logging activity:', error);
      throw error;
    }
  }

  /**
   * Send activity to backend API
   */
  private async sendActivityToBackend(activity: ActivityEntry): Promise<void> {
    try {
      // Get access token from keychain
      const keytar = await import('keytar');
      const accessToken = await keytar.getPassword('StudentMonitorApp', 'accessToken');
      
      if (!accessToken) {
        log.warn('No access token found - skipping activity upload');
        return;
      }

      // Map ActivityEntry to backend API format
      const startTime = new Date(activity.timestamp);
      const endTime = activity.duration 
        ? new Date(activity.timestamp + activity.duration) 
        : new Date(activity.timestamp + 1000); // Default 1 second duration
      
      const payload = {
        window_title: activity.windowTitle || 'Unknown',
        app_name: activity.applicationName || 'Unknown',
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        activity_type: activity.type === 'WINDOW_CHANGE' ? 'application' : activity.type === 'URL_CHANGE' ? 'browser' : 'system',
        url: activity.url || null,
        metadata: {
          duration: activity.duration || 0,
          activity_type: activity.type,
          category: activity.category,
        },
      };

      const response = await axios.post(
        `${API_BASE_URL}/api/v1/monitor/activity`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000,
        }
      );

      if (response.status === 201) {
        log.debug('Activity sent to backend successfully');
      }
    } catch (error: any) {
      // Log error but don't throw - we don't want to break the app if backend is down
      if (error.code === 'ECONNREFUSED') {
        log.warn('Backend API not reachable - activity stored locally only');
      } else if (error.response?.status === 401) {
        log.error('Authentication failed when sending activity - token may be expired');
      } else {
        log.error('Error sending activity to backend:', error.message);
      }
    }
  }

  /**
   * Get activities for a date range
   */
  getActivities(startDate: string, endDate: string): ActivityEntry[] {
    try {
      const allActivities: ActivityEntry[] = [];
      const start = new Date(startDate);
      const end = new Date(endDate);

      // Iterate through each day
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const date = formatDate(d.getTime());
        const activities = this.store.get(`${ACTIVITY_STORE_KEY}.${date}`, []) as ActivityEntry[];
        allActivities.push(...activities);
      }

      return allActivities;
    } catch (error) {
      log.error('Error getting activities:', error);
      return [];
    }
  }

  /**
   * Clear activities for a date
   */
  clearActivities(date: string): void {
    try {
      this.store.delete(`${ACTIVITY_STORE_KEY}.${date}`);
      log.info('Activities cleared for date:', date);
    } catch (error) {
      log.error('Error clearing activities:', error);
    }
  }
}

