/**
 * Productivity Calculator Service
 * Calculates productivity scores and statistics
 */

import Store from 'electron-store';
import log from 'electron-log';
import { formatDate } from '../../../shared/utils';
import { PRODUCTIVITY_CATEGORIES } from '../../../shared/constants/APP_CONSTANTS';
import type { ProductivityStats, ActivityEntry, AppUsage, HourlyProductivity } from '../../../shared/types';

const ACTIVITY_STORE_KEY = 'activity_logs';

export class ProductivityCalculator {
  private store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  /**
   * Get productivity statistics for a date range
   */
  async getStats(startDate: string, endDate: string): Promise<ProductivityStats> {
    try {
      const activities = this.getActivities(startDate, endDate);
      
      return {
        date: startDate,
        totalTime: this.calculateTotalTime(activities),
        productiveTime: this.calculateCategoryTime(activities, PRODUCTIVITY_CATEGORIES.PRODUCTIVE),
        neutralTime: this.calculateCategoryTime(activities, PRODUCTIVITY_CATEGORIES.NEUTRAL),
        unproductiveTime: this.calculateCategoryTime(activities, PRODUCTIVITY_CATEGORIES.UNPRODUCTIVE),
        idleTime: this.calculateIdleTime(activities),
        productivityScore: this.calculateScore(activities),
        topApps: this.getTopApps(activities),
        hourlyBreakdown: this.getHourlyBreakdown(activities),
      };
    } catch (error) {
      log.error('Error getting productivity stats:', error);
      throw error;
    }
  }

  /**
   * Get app usage for a specific date
   */
  async getAppUsage(date: string): Promise<AppUsage[]> {
    try {
      const activities = this.getActivities(date, date);
      return this.getTopApps(activities);
    } catch (error) {
      log.error('Error getting app usage:', error);
      return [];
    }
  }

  /**
   * Calculate productivity score
   */
  calculateScore(activities: ActivityEntry[]): number {
    // Simple scoring algorithm - can be enhanced
    const totalTime = this.calculateTotalTime(activities);
    if (totalTime === 0) return 0;

    const productiveTime = this.calculateCategoryTime(activities, PRODUCTIVITY_CATEGORIES.PRODUCTIVE);
    return Math.round((productiveTime / totalTime) * 100);
  }

  /**
   * Get activities for date range
   */
  private getActivities(startDate: string, endDate: string): ActivityEntry[] {
    const allActivities: ActivityEntry[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const date = formatDate(d.getTime());
      const activities = this.store.get(`${ACTIVITY_STORE_KEY}.${date}`, []) as ActivityEntry[];
      allActivities.push(...activities);
    }

    return allActivities;
  }

  /**
   * Calculate total active time
   */
  private calculateTotalTime(activities: ActivityEntry[]): number {
    // Placeholder implementation
    return activities.length * 60000; // Assume 1 minute per activity
  }

  /**
   * Calculate time spent in a specific category
   */
  private calculateCategoryTime(activities: ActivityEntry[], category: string): number {
    const categoryActivities = activities.filter(a => a.category === category);
    return categoryActivities.length * 60000; // Assume 1 minute per activity
  }

  /**
   * Calculate idle time
   */
  private calculateIdleTime(activities: ActivityEntry[]): number {
    return activities
      .filter(a => a.type === 'IDLE_START')
      .reduce((sum, a) => sum + (a.duration || 0), 0);
  }

  /**
   * Get top applications by usage
   */
  private getTopApps(activities: ActivityEntry[]): AppUsage[] {
    const appMap = new Map<string, number>();

    activities.forEach(activity => {
      if (activity.applicationName) {
        const current = appMap.get(activity.applicationName) || 0;
        appMap.set(activity.applicationName, current + 60000); // Assume 1 minute
      }
    });

    const totalTime = Array.from(appMap.values()).reduce((sum, time) => sum + time, 0);

    return Array.from(appMap.entries())
      .map(([name, time]) => ({
        name,
        time,
        category: PRODUCTIVITY_CATEGORIES.NEUTRAL as any, // TODO: Implement category mapping
        percentage: (time / totalTime) * 100,
      }))
      .sort((a, b) => b.time - a.time)
      .slice(0, 10);
  }

  /**
   * Get hourly breakdown of productivity
   */
  private getHourlyBreakdown(activities: ActivityEntry[]): HourlyProductivity[] {
    const hourly: HourlyProductivity[] = [];

    for (let hour = 0; hour < 24; hour++) {
      const hourActivities = activities.filter(a => {
        const activityHour = new Date(a.timestamp).getHours();
        return activityHour === hour;
      });

      hourly.push({
        hour,
        productiveTime: this.calculateCategoryTime(hourActivities, PRODUCTIVITY_CATEGORIES.PRODUCTIVE),
        unproductiveTime: this.calculateCategoryTime(hourActivities, PRODUCTIVITY_CATEGORIES.UNPRODUCTIVE),
        neutralTime: this.calculateCategoryTime(hourActivities, PRODUCTIVITY_CATEGORIES.NEUTRAL),
        idleTime: this.calculateIdleTime(hourActivities),
      });
    }

    return hourly;
  }
}

