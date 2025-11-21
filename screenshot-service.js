const { desktopCapturer, screen, systemPreferences } = require('electron');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const config = require('./config');

class ScreenshotService {
  constructor() {
    this.captureInterval = null;
    this.isRunning = false;
    this.captureIntervalMs = 60 * 1000; // 1 minute in milliseconds
    this.screenshotsDir = path.join(require('os').homedir(), '.monitoring-screenshots');
    this.hasPermission = false;
    
    // Retry configuration
    this.maxRetries = 3;
    this.retryDelay = 1000; // Start with 1 second
    this.maxRetryDelay = 60000; // Max 1 minute
    
    // Failed uploads queue
    this.failedUploads = [];
    this.retryQueueInterval = null;
    
    // API configuration (to be set when ready)
    this.apiEndpoint = null; // e.g., 'https://api.yourapp.com/screenshots'
    this.apiToken = null; // e.g., 'Bearer token'
    this.deleteAfterUpload = true; // Auto-delete after successful upload
    
    // Create screenshots directory if it doesn't exist
    this.ensureScreenshotsDirectory();
    
    // Check permissions on startup
    this.checkPermissions();
    
    // Start retry queue processor
    this.startRetryQueue();
  }
  
  async checkPermissions() {
    try {
      // Check screen recording permission (macOS only)
      if (process.platform === 'darwin') {
        const status = systemPreferences.getMediaAccessStatus('screen');
        this.hasPermission = status === 'granted';
        
        console.log(`🔐 Screen Recording Permission: ${status}`);
        
        if (status === 'not-determined') {
          console.log('⚠️  Screen recording permission not yet requested');
          console.log('📝 Permission will be requested on first capture attempt');
        } else if (status === 'denied') {
          console.log('❌ Screen recording permission DENIED');
          console.log('📝 Please grant permission in System Settings:');
          console.log('   System Settings → Privacy & Security → Screen Recording');
          console.log('   Enable permission for this app, then restart');
        } else if (status === 'granted') {
          console.log('✅ Screen recording permission GRANTED');
        }
      } else {
        this.hasPermission = true; // Assume granted on non-macOS
      }
    } catch (error) {
      console.error('❌ Error checking permissions:', error);
    }
  }

  ensureScreenshotsDirectory() {
    if (!fs.existsSync(this.screenshotsDir)) {
      fs.mkdirSync(this.screenshotsDir, { recursive: true });
      console.log('📁 Screenshots directory created:', this.screenshotsDir);
    }
  }

  async captureAllScreens() {
    try {
      console.log('📸 Starting screenshot capture...');
      
      // Check permission before capturing
      await this.checkPermissions();
      
      if (!this.hasPermission && process.platform === 'darwin') {
        console.log('⚠️  Attempting capture without confirmed permission...');
        console.log('💡 macOS will prompt for permission if not granted');
      }
      
      // Get all displays
      const displays = screen.getAllDisplays();
      console.log(`🖥️ Found ${displays.length} display(s)`);
      
      // Get all available sources (screens)
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: {
          width: 1920,
          height: 1080
        }
      });
      
      console.log(`📷 Captured ${sources.length} screen source(s)`);
      
      const screenshots = [];
      const timestamp = Date.now();
      
      // Process each screen
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        const thumbnail = source.thumbnail;
        
        // Convert to PNG buffer
        const pngBuffer = thumbnail.toPNG();
        
        // Create filename with timestamp and screen number
        const filename = `screen_${i + 1}_${timestamp}.png`;
        const filepath = path.join(this.screenshotsDir, filename);
        
        // Save to disk for testing
        fs.writeFileSync(filepath, pngBuffer);
        console.log(`✅ Screenshot saved: ${filename}`);
        
        // Prepare data for API
        const screenshotData = {
          screenNumber: i + 1,
          displayId: source.display_id,
          screenName: source.name,
          timestamp: timestamp,
          filename: filename,
          buffer: pngBuffer,
          base64: pngBuffer.toString('base64'),
          size: {
            width: thumbnail.getSize().width,
            height: thumbnail.getSize().height
          }
        };
        
        screenshots.push(screenshotData);
      }
      
      // Send to API if configured
      await this.sendToAPI(screenshots);
      
      return screenshots;
      
    } catch (error) {
      console.error('❌ Error capturing screenshots:', error);
      return [];
    }
  }

  async sendToAPI(screenshots) {
    // Check if API is configured
    if (!this.apiEndpoint) {
      console.log('⚠️  API endpoint not configured. Skipping upload.');
      console.log('💡 Set apiEndpoint and apiToken to enable uploads');
      return;
    }

    try {
      console.log('📤 Preparing to send screenshots to API...');
      
      // Get parent info from config
      const parentEmail = config.get('parentEmail');
      const childName = config.get('childName');
      
      // Process each screenshot
      for (const screenshot of screenshots) {
        const filepath = path.join(this.screenshotsDir, screenshot.filename);
        
        await this.uploadScreenshotWithRetry({
          screenshot,
          parentEmail,
          childName,
          filepath,
          retryCount: 0
        });
      }
      
    } catch (error) {
      console.error('❌ Error in sendToAPI:', error);
    }
  }

  async uploadScreenshotWithRetry(uploadData) {
    const { screenshot, parentEmail, childName, filepath, retryCount } = uploadData;
    
    try {
      // Prepare payload
      const payload = {
        parentEmail: parentEmail,
        childName: childName,
        screenNumber: screenshot.screenNumber,
        displayId: screenshot.displayId,
        screenName: screenshot.screenName,
        timestamp: screenshot.timestamp,
        image: screenshot.base64,
        metadata: {
          width: screenshot.size.width,
          height: screenshot.size.height,
          capturedAt: new Date(screenshot.timestamp).toISOString()
        }
      };

      console.log(`📤 Uploading ${screenshot.filename} (attempt ${retryCount + 1}/${this.maxRetries + 1})...`);

      // Send to API using axios with timeout
      const response = await axios.post(this.apiEndpoint, payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.apiToken
        },
        timeout: 30000, // 30 second timeout
        validateStatus: (status) => status < 600 // Don't throw on any status < 600
      });

      // Handle successful upload
      if (response.status >= 200 && response.status < 300) {
        console.log(`✅ Screenshot ${screenshot.filename} uploaded successfully`);
        
        // Delete local file after successful upload
        if (this.deleteAfterUpload && fs.existsSync(filepath)) {
          fs.unlinkSync(filepath);
          console.log(`🗑️  Deleted local file: ${screenshot.filename}`);
        }
        
        return true;
      }
      
      // Handle rate limiting (429 Too Many Requests)
      else if (response.status === 429) {
        const retryAfter = response.headers['retry-after'];
        const waitTime = retryAfter ? parseInt(retryAfter) * 1000 : this.calculateBackoff(retryCount);
        
        console.log(`⏳ Rate limited. Waiting ${waitTime / 1000} seconds before retry...`);
        
        // Add to failed queue for retry
        this.addToFailedQueue({
          ...uploadData,
          retryCount: retryCount + 1,
          nextRetryTime: Date.now() + waitTime
        });
        
        return false;
      }
      
      // Handle other errors
      else {
        console.error(`❌ Upload failed with status ${response.status}: ${response.statusText}`);
        
        if (retryCount < this.maxRetries) {
          const backoffTime = this.calculateBackoff(retryCount);
          console.log(`🔄 Will retry in ${backoffTime / 1000} seconds...`);
          
          this.addToFailedQueue({
            ...uploadData,
            retryCount: retryCount + 1,
            nextRetryTime: Date.now() + backoffTime
          });
        } else {
          console.error(`❌ Max retries reached for ${screenshot.filename}. Giving up.`);
          // Keep local file if upload permanently failed
        }
        
        return false;
      }
      
    } catch (error) {
      // Handle network errors
      if (error.code === 'ECONNABORTED') {
        console.error(`⏱️  Upload timeout for ${screenshot.filename}`);
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        console.error(`🌐 Network error: Cannot reach API server`);
      } else {
        console.error(`❌ Upload error for ${screenshot.filename}:`, error.message);
      }
      
      // Retry on network errors
      if (retryCount < this.maxRetries) {
        const backoffTime = this.calculateBackoff(retryCount);
        console.log(`🔄 Will retry in ${backoffTime / 1000} seconds...`);
        
        this.addToFailedQueue({
          ...uploadData,
          retryCount: retryCount + 1,
          nextRetryTime: Date.now() + backoffTime
        });
      } else {
        console.error(`❌ Max retries reached for ${screenshot.filename}. Giving up.`);
      }
      
      return false;
    }
  }

  calculateBackoff(retryCount) {
    // Exponential backoff: 1s, 2s, 4s, 8s, etc.
    const backoff = this.retryDelay * Math.pow(2, retryCount);
    return Math.min(backoff, this.maxRetryDelay);
  }

  addToFailedQueue(uploadData) {
    // Check if already in queue
    const existingIndex = this.failedUploads.findIndex(
      item => item.filepath === uploadData.filepath
    );
    
    if (existingIndex >= 0) {
      // Update existing entry
      this.failedUploads[existingIndex] = uploadData;
    } else {
      // Add new entry
      this.failedUploads.push(uploadData);
    }
    
    console.log(`📋 Added to retry queue. Queue size: ${this.failedUploads.length}`);
  }

  startRetryQueue() {
    // Process failed uploads every 10 seconds
    this.retryQueueInterval = setInterval(() => {
      this.processRetryQueue();
    }, 10000);
  }

  async processRetryQueue() {
    if (this.failedUploads.length === 0) {
      return;
    }

    const now = Date.now();
    const readyToRetry = this.failedUploads.filter(item => item.nextRetryTime <= now);
    
    if (readyToRetry.length > 0) {
      console.log(`🔄 Processing ${readyToRetry.length} failed upload(s) from queue...`);
      
      for (const uploadData of readyToRetry) {
        // Remove from queue
        this.failedUploads = this.failedUploads.filter(
          item => item.filepath !== uploadData.filepath
        );
        
        // Retry upload
        await this.uploadScreenshotWithRetry(uploadData);
      }
    }
  }

  start() {
    if (this.isRunning) {
      console.log('⚠️ Screenshot service is already running');
      return;
    }
    
    console.log('🚀 Starting screenshot service...');
    console.log(`⏱️ Capture interval: ${this.captureIntervalMs / 1000} seconds`);
    console.log(`📁 Screenshots directory: ${this.screenshotsDir}`);
    
    // Capture immediately on start
    this.captureAllScreens();
    
    // Then capture every minute
    this.captureInterval = setInterval(() => {
      this.captureAllScreens();
    }, this.captureIntervalMs);
    
    this.isRunning = true;
    console.log('✅ Screenshot service started');
  }

  stop() {
    if (!this.isRunning) {
      console.log('⚠️ Screenshot service is not running');
      return;
    }
    
    if (this.captureInterval) {
      clearInterval(this.captureInterval);
      this.captureInterval = null;
    }
    
    if (this.retryQueueInterval) {
      clearInterval(this.retryQueueInterval);
      this.retryQueueInterval = null;
    }
    
    this.isRunning = false;
    console.log('🛑 Screenshot service stopped');
  }

  // Configure API settings
  configureAPI(endpoint, token, deleteAfterUpload = true) {
    this.apiEndpoint = endpoint;
    this.apiToken = token;
    this.deleteAfterUpload = deleteAfterUpload;
    
    console.log('⚙️  API configured:');
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Token: ${token ? '***' + token.slice(-4) : 'Not set'}`);
    console.log(`   Delete after upload: ${deleteAfterUpload}`);
  }

  // Test API connection
  async testAPIConnection() {
    if (!this.apiEndpoint) {
      console.log('❌ API endpoint not configured');
      return false;
    }

    try {
      console.log('🧪 Testing API connection...');
      
      const response = await axios.get(this.apiEndpoint.replace('/screenshots', '/health'), {
        headers: {
          'Authorization': this.apiToken
        },
        timeout: 5000,
        validateStatus: (status) => status < 600
      });
      
      if (response.status >= 200 && response.status < 300) {
        console.log('✅ API connection successful');
        return true;
      } else {
        console.log(`⚠️  API returned status ${response.status}`);
        return false;
      }
    } catch (error) {
      console.error('❌ API connection failed:', error.message);
      return false;
    }
  }

  // Method to capture on demand (useful for testing)
  async captureNow() {
    console.log('📸 Manual screenshot capture triggered');
    return await this.captureAllScreens();
  }

  // Clean up old screenshots (optional - to save disk space)
  cleanupOldScreenshots(daysToKeep = 7) {
    try {
      const files = fs.readdirSync(this.screenshotsDir);
      const now = Date.now();
      const maxAge = daysToKeep * 24 * 60 * 60 * 1000; // days to milliseconds
      
      let deletedCount = 0;
      
      files.forEach(file => {
        const filepath = path.join(this.screenshotsDir, file);
        const stats = fs.statSync(filepath);
        const age = now - stats.mtimeMs;
        
        if (age > maxAge) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      });
      
      if (deletedCount > 0) {
        console.log(`🧹 Cleaned up ${deletedCount} old screenshot(s)`);
      }
      
    } catch (error) {
      console.error('❌ Error cleaning up screenshots:', error);
    }
  }

  getStatus() {
    return {
      isRunning: this.isRunning,
      captureIntervalMs: this.captureIntervalMs,
      screenshotsDir: this.screenshotsDir,
      screenshotCount: this.getScreenshotCount(),
      apiConfigured: !!this.apiEndpoint,
      apiEndpoint: this.apiEndpoint,
      deleteAfterUpload: this.deleteAfterUpload,
      failedUploadsInQueue: this.failedUploads.length,
      maxRetries: this.maxRetries,
      hasPermission: this.hasPermission
    };
  }

  getScreenshotCount() {
    try {
      const files = fs.readdirSync(this.screenshotsDir);
      return files.filter(f => f.endsWith('.png')).length;
    } catch (error) {
      return 0;
    }
  }
}

module.exports = new ScreenshotService();

