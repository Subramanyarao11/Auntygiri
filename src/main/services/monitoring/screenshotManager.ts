/**
 * Enhanced Screenshot Manager Service
 * Handles screenshot capture (multi-monitor), storage, retry logic, and API upload management
 */

import { BrowserWindow, desktopCapturer, screen } from 'electron';
import Store from 'electron-store';
import fs from 'fs/promises';
import path from 'path';
import log from 'electron-log';
import { app } from 'electron';
import axios, { AxiosError } from 'axios';
import { APP_CONFIG } from '../../../shared/constants/APP_CONSTANTS';
import { generateId, formatDate } from '../../../shared/utils';
import type { Screenshot } from '../../../shared/types';

const SCREENSHOTS_STORE_KEY = 'screenshots';
const FAILED_UPLOADS_KEY = 'failed_uploads';

interface UploadQueueItem {
  screenshot: Screenshot;
  retryCount: number;
  nextRetryTime: number;
}

interface APIConfig {
  endpoint: string | null;
  deleteAfterUpload: boolean;
}

export class ScreenshotManager {
  private store: Store;
  private screenshotsDir: string;
  private apiConfig: APIConfig;
  private uploadRetryQueue: UploadQueueItem[];
  private retryQueueInterval: NodeJS.Timeout | null;
  
  // Retry configuration
  private readonly MAX_RETRIES = 3;
  private readonly INITIAL_RETRY_DELAY = 1000; // 1 second
  private readonly MAX_RETRY_DELAY = 60000; // 1 minute
  private readonly QUEUE_CHECK_INTERVAL = 10000; // 10 seconds
  private readonly UPLOAD_TIMEOUT = 30000; // 30 seconds

  constructor(_mainWindow: BrowserWindow, store: Store) {
    this.store = store;
    this.screenshotsDir = path.join(app.getPath('userData'), 'screenshots');
    this.uploadRetryQueue = [];
    this.retryQueueInterval = null;
    
    // API configuration - using anonymous upload endpoint from backend
    this.apiConfig = {
      endpoint: 'http://localhost:3000/api/v1/monitor/screenshot',
      deleteAfterUpload: true,
    };
    
    this.initializeDirectory();
    this.loadFailedUploads();
    this.startRetryQueueProcessor();
  }

  /**
   * Initialize screenshots directory
   */
  private async initializeDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.screenshotsDir, { recursive: true });
      log.info('Screenshots directory initialized:', this.screenshotsDir);
    } catch (error) {
      log.error('Error creating screenshots directory:', error);
    }
  }

  /**
   * Load failed uploads from store on startup
   */
  private loadFailedUploads(): void {
    try {
      const saved = this.store.get(FAILED_UPLOADS_KEY, []) as UploadQueueItem[];
      this.uploadRetryQueue = saved;
      
      if (saved.length > 0) {
        log.info(`Loaded ${saved.length} failed uploads from previous session`);
      }
    } catch (error) {
      log.error('Error loading failed uploads:', error);
    }
  }

  /**
   * Save failed uploads to store
   */
  private saveFailedUploads(): void {
    try {
      this.store.set(FAILED_UPLOADS_KEY, this.uploadRetryQueue);
    } catch (error) {
      log.error('Error saving failed uploads:', error);
    }
  }

  /**
   * Configure API settings (anonymous uploads - no token required)
   */
  configureAPI(endpoint: string, deleteAfterUpload = true): void {
    this.apiConfig.endpoint = endpoint;
    this.apiConfig.deleteAfterUpload = deleteAfterUpload;
    
    log.info('API configured for anonymous uploads:', {
      endpoint,
      deleteAfterUpload,
    });
  }

  /**
   * Capture screenshots from all monitors
   */
  async captureScreenshot(): Promise<Screenshot[]> {
    try {
      log.debug('Capturing screenshots from all monitors');

      // Get all displays
      const displays = screen.getAllDisplays();
      log.info(`Found ${displays.length} display(s)`);

      // Capture all screens
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: 1920,
          height: 1080,
        },
      });

      if (sources.length === 0) {
        throw new Error('No screen sources available');
      }

      log.info(`Captured ${sources.length} screen source(s)`);

      const screenshots: Screenshot[] = [];
      const timestamp = Date.now();
      const date = formatDate(timestamp);
      const datePath = path.join(this.screenshotsDir, date);

      // Create date directory
      await fs.mkdir(datePath, { recursive: true });

      // Process each screen
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const thumbnail = source.thumbnail;
        const image = thumbnail.toJPEG(APP_CONFIG.SCREENSHOT_QUALITY);

        // Generate filename
        const id = generateId();
        const filename = `screenshot_${id}_screen${i + 1}.jpg`;
        const fullPath = path.join(datePath, filename);

        // Save screenshot
        await fs.writeFile(fullPath, image);

        // Create screenshot entry
        const screenshot: Screenshot = {
          id,
          filePath: fullPath,
          timestamp,
          size: image.length,
          uploaded: false,
          // Add display info for multi-monitor tracking
          windowTitle: `Screen ${i + 1}`,
          applicationName: source.name,
        };

        screenshots.push(screenshot);

        // Store screenshot metadata
        const allScreenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
        allScreenshots.push(screenshot);
        this.store.set(SCREENSHOTS_STORE_KEY, allScreenshots);

        log.info(`Screenshot captured: ${id} (Screen ${i + 1})`);
      }

      // Upload screenshots if API is configured
      if (this.apiConfig.endpoint) {
        for (const screenshot of screenshots) {
          await this.uploadScreenshotWithRetry(screenshot, 0);
        }
      } else {
        log.debug('API not configured, skipping upload');
      }

      return screenshots;
    } catch (error) {
      log.error('Error capturing screenshots:', error);
      throw error;
    }
  }

  /**
   * Upload screenshot with retry logic using anonymous multipart upload
   */
  private async uploadScreenshotWithRetry(
    screenshot: Screenshot,
    retryCount: number
  ): Promise<boolean> {
    if (!this.apiConfig.endpoint) {
      log.warn('API not configured, skipping upload');
      return false;
    }

    try {
      log.info(`Uploading screenshot ${screenshot.id} (attempt ${retryCount + 1}/${this.MAX_RETRIES + 1})`);

      // Read file as buffer for FormData
      const imageBuffer = await fs.readFile(screenshot.filePath);
      
      // Create FormData for multipart upload
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Add the screenshot file with proper field name
      formData.append('screenshot', imageBuffer, {
        filename: `${screenshot.id}.jpg`,
        contentType: 'image/jpeg',
      });

      // Upload to API using FormData
      const response = await axios.post(this.apiConfig.endpoint, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: this.UPLOAD_TIMEOUT,
        validateStatus: (status) => status < 600,
      });

      // Handle successful upload (2xx)
      if (response.status >= 200 && response.status < 300) {
        const responseData = response.data;
        log.info(`Screenshot ${screenshot.id} uploaded successfully`);
        
        // Log API response details
        if (responseData?.data?.screenshot) {
          log.info(`API Response - File ID: ${responseData.data.screenshot.id}, Size: ${responseData.data.screenshot.file_size} bytes`);
        }

        // Mark as uploaded
        await this.markAsUploaded(screenshot.id);

        // Delete local file if configured
        if (this.apiConfig.deleteAfterUpload) {
          await this.deleteScreenshot(screenshot.id);
          log.info(`Local file deleted: ${screenshot.id}`);
        }

        // Remove from retry queue if present
        this.removeFromRetryQueue(screenshot.id);

        return true;
      }
      
      // Handle rate limiting (429)
      else if (response.status === 429) {
        const retryAfter = response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateBackoff(retryCount);
        
        log.warn(`Rate limited for screenshot ${screenshot.id}. Waiting ${waitTime / 1000}s before retry`);
        
        this.addToRetryQueue(screenshot, retryCount + 1, Date.now() + waitTime);
        return false;
      }
      
      // Handle other errors
      else {
        log.error(`Upload failed for screenshot ${screenshot.id}: ${response.status} ${response.statusText}`);
        
        if (retryCount < this.MAX_RETRIES) {
          const backoffTime = this.calculateBackoff(retryCount);
          log.info(`Will retry in ${backoffTime / 1000}s...`);
          
          this.addToRetryQueue(screenshot, retryCount + 1, Date.now() + backoffTime);
        } else {
          log.error(`Max retries reached for screenshot ${screenshot.id}. Giving up.`);
        }
        
        return false;
      }
    } catch (error) {
      const axiosError = error as AxiosError;
      
      // Log specific error types
      if (axiosError.code === 'ECONNABORTED') {
        log.error(`Upload timeout for screenshot ${screenshot.id}`);
      } else if (axiosError.code === 'ENOTFOUND' || axiosError.code === 'ECONNREFUSED') {
        log.error(`Network error: Cannot reach API server`);
      } else {
        log.error(`Upload error for screenshot ${screenshot.id}:`, axiosError.message);
      }

      // Retry on network errors
      if (retryCount < this.MAX_RETRIES) {
        const backoffTime = this.calculateBackoff(retryCount);
        log.info(`Will retry in ${backoffTime / 1000}s...`);
        
        this.addToRetryQueue(screenshot, retryCount + 1, Date.now() + backoffTime);
      } else {
        log.error(`Max retries reached for screenshot ${screenshot.id}. Giving up.`);
      }

      return false;
    }
  }

  /**
   * Calculate exponential backoff delay
   */
  private calculateBackoff(retryCount: number): number {
    const backoff = this.INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
    return Math.min(backoff, this.MAX_RETRY_DELAY);
  }

  /**
   * Add screenshot to retry queue
   */
  private addToRetryQueue(screenshot: Screenshot, retryCount: number, nextRetryTime: number): void {
    // Remove if already in queue
    this.removeFromRetryQueue(screenshot.id);
    
    // Add to queue
    this.uploadRetryQueue.push({
      screenshot,
      retryCount,
      nextRetryTime,
    });
    
    this.saveFailedUploads();
    log.info(`Added to retry queue. Queue size: ${this.uploadRetryQueue.length}`);
  }

  /**
   * Remove screenshot from retry queue
   */
  private removeFromRetryQueue(screenshotId: string): void {
    this.uploadRetryQueue = this.uploadRetryQueue.filter(item => item.screenshot.id !== screenshotId);
    this.saveFailedUploads();
  }

  /**
   * Start retry queue processor
   */
  private startRetryQueueProcessor(): void {
    this.retryQueueInterval = setInterval(() => {
      this.processRetryQueue();
    }, this.QUEUE_CHECK_INTERVAL);
    
    log.info('Retry queue processor started');
  }

  /**
   * Process retry queue
   */
  private async processRetryQueue(): Promise<void> {
    if (this.uploadRetryQueue.length === 0) {
      return;
    }

    const now = Date.now();
    const readyToRetry = this.uploadRetryQueue.filter(item => item.nextRetryTime <= now);

    if (readyToRetry.length > 0) {
      log.info(`Processing ${readyToRetry.length} failed upload(s) from queue...`);

      for (const item of readyToRetry) {
        // Remove from queue before retrying
        this.removeFromRetryQueue(item.screenshot.id);
        
        // Retry upload
        await this.uploadScreenshotWithRetry(item.screenshot, item.retryCount);
      }
    }
  }

  /**
   * Mark screenshot as uploaded
   */
  private async markAsUploaded(id: string): Promise<void> {
    try {
      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      const updated = screenshots.map(s =>
        s.id === id ? { ...s, uploaded: true, uploadedAt: Date.now() } : s
      );
      this.store.set(SCREENSHOTS_STORE_KEY, updated);
    } catch (error) {
      log.error('Error marking screenshot as uploaded:', error);
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
      try {
        await fs.unlink(screenshot.filePath);
      } catch (fileError) {
        // File might already be deleted, log but don't throw
        log.warn(`Could not delete file ${screenshot.filePath}:`, fileError);
      }

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
   * Upload a screenshot (public method for manual uploads)
   */
  async uploadScreenshot(id: string): Promise<void> {
    try {
      const screenshots = this.store.get(SCREENSHOTS_STORE_KEY, []) as Screenshot[];
      const screenshot = screenshots.find(s => s.id === id);

      if (!screenshot) {
        throw new Error('Screenshot not found');
      }

      log.info('Manual upload requested for screenshot:', id);
      await this.uploadScreenshotWithRetry(screenshot, 0);
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

  /**
   * Get retry queue status
   */
  getRetryQueueStatus(): { queueSize: number; items: UploadQueueItem[] } {
    return {
      queueSize: this.uploadRetryQueue.length,
      items: this.uploadRetryQueue,
    };
  }

  /**
   * Get API configuration status
   */
  getAPIStatus(): { configured: boolean; endpoint: string | null; deleteAfterUpload: boolean } {
    return {
      configured: !!this.apiConfig.endpoint,
      endpoint: this.apiConfig.endpoint,
      deleteAfterUpload: this.apiConfig.deleteAfterUpload,
    };
  }

  /**
   * Cleanup - stop retry queue processor
   */
  cleanup(): void {
    if (this.retryQueueInterval) {
      clearInterval(this.retryQueueInterval);
      this.retryQueueInterval = null;
      log.info('Retry queue processor stopped');
    }
  }
}
