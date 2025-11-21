/**
 * Activity Logger Service
 * Logs and stores user activity entries
 */

import Store from 'electron-store';
import log from 'electron-log';
import { formatDate } from '../../../shared/utils';
import type { ActivityEntry } from '../../../shared/types';

const ACTIVITY_STORE_KEY = 'activity_logs';

export class ActivityLogger {
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  /**
   * Log an activity entry
   */
  async logActivity(activity: ActivityEntry): Promise<void> {
    try {
      const date = formatDate(activity.timestamp);
      const activities = this.store.get(`${ACTIVITY_STORE_KEY}.${date}`, []) as ActivityEntry[];
      
      activities.push(activity);
      
      this.store.set(`${ACTIVITY_STORE_KEY}.${date}`, activities);
      
      log.debug('Activity logged:', activity.type);
    } catch (error) {
      log.error('Error logging activity:', error);
      throw error;
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

