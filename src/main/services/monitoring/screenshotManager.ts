/**
 * Screenshot Manager Service
 * Handles screenshot capture, storage, and upload management
 */

import { BrowserWindow, desktopCapturer, screen } from 'electron';
import Store from 'electron-store';
import fs from 'fs/promises';
import path from 'path';
import log from 'electron-log';
import { app } from 'electron';
import { APP_CONFIG } from '../../../shared/constants/APP_CONSTANTS';
import { generateId, formatDate } from '../../../shared/utils';
import type { Screenshot } from '../../../shared/types';

const SCREENSHOTS_STORE_KEY = 'screenshots';

export class ScreenshotManager {
  private store: Store;
  private screenshotsDir: string;

  constructor(_mainWindow: BrowserWindow, store: Store) {
    this.store = store;
    this.screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    this.initializeDirectory();
  }

  /**
   * Initialize screenshots directory
   */
  private async initializeDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotsDir, { recursive: true });
    } catch (error) {
      log.error('Error creating screenshots directory:', error);
    }
  }

  /**
   * Capture a screenshot
   */
  async captureScreenshot(): Promise<Screenshot> {
    try {
      log.debug('Capturing screenshot');

      // Get primary display
      const primaryDisplay = screen.getPrimaryDisplay();
      const { width, height } = primaryDisplay.size;

      // Capture screen
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width, height },
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      // Get screenshot data
      const source = sources[0];
      const thumbnail = source.thumbnail;
      const image = thumbnail.toJPEG(APP_CONFIG.SCREENSHOT_QUALITY);

      // Generate filename
      const id = generateId();
      const timestamp = Date.now();
      const date = formatDate(timestamp);
      const filename = `screenshot_${id}.jpg`;
      const filePath = path.join(this.screenshotsDir, date);

      // Create date directory
      await fs.mkdir(filePath, { recursive: true });

      // Save screenshot
      const fullPath = path.join(filePath, filename);
      await fs.writeFile(fullPath, image);

      // Create screenshot entry
      const screenshot: Screenshot = {
        id,
        filePath: fullPath,
        timestamp,
        size: image.length,
        uploaded: false,
      };

      // Store screenshot metadata
      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      screenshots.push(screenshot);
      this.store.set(SCREENSHOTS_STORE_KEY, screenshots);

      log.info('Screenshot captured:', id);
      return screenshot;
    } catch (error) {
      log.error('Error capturing screenshot:', error);
      throw error;
    }
  }

  /**
   * Get screenshots for a date range
   */
  getScreenshots(startDate: string, endDate: string): Screenshot[] {
    try {
      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();

      return screenshots.filter(s => s.timestamp >= start && s.timestamp <= end);
    } catch (error) {
      log.error('Error getting screenshots:', error);
      return [];
    }
  }

  /**
   * Delete a screenshot
   */
  async deleteScreenshot(id: string): Promise<void> {
    try {
      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      const screenshot = screenshots.find(s => s.id === id);

      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      // Delete file
      await fs.unlink(screenshot.filePath);

      // Remove from store
      const updated = screenshots.filter(s => s.id !== id);
      this.store.set(SCREENSHOTS_STORE_KEY, updated);

      log.info('Screenshot deleted:', id);
    } catch (error) {
      log.error('Error deleting screenshot:', error);
      throw error;
    }
  }

  /**
   * Upload a screenshot
   */
  async uploadScreenshot(id: string): Promise<void> {
    try {
      log.info('Uploading screenshot:', id);

      // TODO: Implement actual upload to server
      // For now, just mark as uploaded

      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      const updated = screenshots.map(s =>
        s.id === id ? { ...s, uploaded: true, uploadedAt: Date.now() } : s
      );

      this.store.set(SCREENSHOTS_STORE_KEY, updated);

      log.info('Screenshot uploaded:', id);
    } catch (error) {
      log.error('Error uploading screenshot:', error);
      throw error;
    }
  }

  /**
   * Get pending screenshots (not uploaded)
   */
  getPendingScreenshots(): Screenshot[] {
    try {
      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      return screenshots.filter(s => !s.uploaded);
    } catch (error) {
      log.error('Error getting pending screenshots:', error);
      return [];
    }
  }
}

