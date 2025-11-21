# Screenshot Service Enhancement Documentation

## 🎯 Overview

The screenshot service has been enhanced with production-ready features including:
- ✅ Multi-monitor support
- ✅ Automatic retry logic with exponential backoff
- ✅ Rate limiting support (429 handling)
- ✅ Auto-delete after successful upload
- ✅ Failed upload queue with persistence
- ✅ Axios-based API client

## 📦 What Changed

### Files Modified:

1. **`src/main/services/monitoring/screenshotManager.ts`**
   - Added multi-monitor capture
   - Implemented retry logic with exponential backoff
   - Added axios for HTTP requests
   - Implemented rate limiting handling
   - Added failed upload queue
   - Added auto-delete after successful upload

2. **`src/main/handlers/screenshotHandlers.ts`**
   - Added new IPC handlers for API configuration
   - Added queue status handler
   - Added API status handler
   - Added cleanup function

3. **`src/shared/constants/IPC_CHANNELS.ts`**
   - Added `CONFIGURE_API` channel
   - Added `GET_QUEUE_STATUS` channel
   - Added `GET_API_STATUS` channel

## 🚀 New Features

### 1. Multi-Monitor Support

**Before:**
- Captured only primary display

**After:**
- Captures ALL connected displays
- Returns array of screenshots (one per monitor)
- Each screenshot tagged with screen number

```typescript
// Now returns Screenshot[] instead of Screenshot
const screenshots = await screenshotManager.captureScreenshot();
// screenshots.length === number of monitors
```

### 2. Retry Logic

**Configuration:**
- Max retries: 3 attempts
- Initial delay: 1 second
- Exponential backoff: 1s → 2s → 4s → 8s
- Max delay: 60 seconds

**Behavior:**
- Automatic retry on network errors
- Automatic retry on server errors (5xx)
- Respects rate limiting (429)
- Persists failed uploads across app restarts

### 3. Rate Limiting Support

**Handles 429 responses:**
- Reads `Retry-After` header if provided
- Falls back to exponential backoff
- Automatically retries after wait time
- Logs wait time for debugging

### 4. Auto-Delete After Upload

**Configuration:**
```typescript
screenshotManager.configureAPI(
  'https://api.example.com/screenshots',
  'Bearer token',
  true  // deleteAfterUpload
);
```

**Behavior:**
- Deletes local file after successful upload (200-299)
- Keeps file if upload fails (for retry)
- Only deletes after backend confirms receipt

### 5. Failed Upload Queue

**Features:**
- Persists across app restarts
- Processes every 10 seconds
- Automatic retry when ready
- View queue status via IPC

## 💻 Usage

### From Main Process

```typescript
import { ScreenshotManager } from './services/monitoring/screenshotManager';

// Initialize
const screenshotManager = new ScreenshotManager(mainWindow, store);

// Configure API
screenshotManager.configureAPI(
  'https://api.example.com/screenshots',
  'Bearer your-token-here',
  true  // delete after upload
);

// Capture screenshots (all monitors)
const screenshots = await screenshotManager.captureScreenshot();
// Returns: Screenshot[]

// Get pending uploads
const pending = screenshotManager.getPendingScreenshots();

// Check queue status
const status = screenshotManager.getRetryQueueStatus();
console.log(`Queue size: ${status.queueSize}`);

// Check API status
const apiStatus = screenshotManager.getAPIStatus();
console.log(`API configured: ${apiStatus.configured}`);

// Cleanup on app quit
screenshotManager.cleanup();
```

### From Renderer Process (via IPC)

```typescript
// Configure API
await window.electron.ipcRenderer.invoke('screenshot:configure-api', {
  endpoint: 'https://api.example.com/screenshots',
  token: 'Bearer your-token',
  deleteAfterUpload: true
});

// Capture screenshots
const screenshots = await window.electron.ipcRenderer.invoke('screenshot:capture');
// Returns: Screenshot[]

// Get pending uploads
const pending = await window.electron.ipcRenderer.invoke('screenshot:get-pending');

// Get queue status
const queueStatus = await window.electron.ipcRenderer.invoke('screenshot:get-queue-status');
console.log(`Failed uploads in queue: ${queueStatus.queueSize}`);

// Get API status
const apiStatus = await window.electron.ipcRenderer.invoke('screenshot:get-api-status');
console.log(`API configured: ${apiStatus.configured}`);
```

## 🔌 API Integration

### Required Endpoint

```
POST https://your-api.com/api/screenshots
```

### Request Headers

```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

### Request Payload

```typescript
{
  screenshotId: string;
  timestamp: number;
  size: number;
  image: string;  // base64-encoded JPEG
  windowTitle?: string;
  applicationName?: string;
  metadata: {
    capturedAt: string;  // ISO 8601
  };
}
```

### Expected Response (Success)

**Status:** 200-299

```json
{
  "success": true,
  "id": "screenshot-server-id"
}
```

### Expected Response (Rate Limit)

**Status:** 429

**Headers:**
```
Retry-After: 60  (seconds to wait)
```

### Expected Response (Error)

**Status:** 400, 500, etc.

```json
{
  "error": "Error message"
}
```

## 🧪 Testing

### 1. Test Multi-Monitor

```typescript
const screenshots = await screenshotManager.captureScreenshot();
console.log(`Captured ${screenshots.length} screenshots`);
// Should equal number of connected monitors
```

### 2. Test API Upload

```typescript
// Configure API
screenshotManager.configureAPI(
  'https://httpbin.org/post',  // Test endpoint
  'Bearer test-token',
  false  // Don't delete for testing
);

// Capture and upload
const screenshots = await screenshotManager.captureScreenshot();

// Check logs for upload success
```

### 3. Test Retry Logic

```typescript
// Configure with invalid endpoint
screenshotManager.configureAPI(
  'https://invalid-endpoint.example.com/screenshots',
  'Bearer test-token',
  false
);

// Trigger capture
await screenshotManager.captureScreenshot();

// Check logs for retry attempts
// Check queue status
const status = screenshotManager.getRetryQueueStatus();
console.log(`Items in retry queue: ${status.queueSize}`);
```

### 4. Test Rate Limiting

```typescript
// Use an endpoint that returns 429
screenshotManager.configureAPI(
  'https://httpbin.org/status/429',
  'Bearer test-token',
  false
);

await screenshotManager.captureScreenshot();

// Check logs for rate limit handling
```

## 📊 Monitoring

### Log Messages to Watch

**Successful Capture:**
```
[info] Found 2 display(s)
[info] Captured 2 screen source(s)
[info] Screenshot captured: abc123 (Screen 1)
[info] Screenshot captured: def456 (Screen 2)
```

**Successful Upload:**
```
[info] Uploading screenshot abc123 (attempt 1/4)
[info] Screenshot abc123 uploaded successfully
[info] Local file deleted: abc123
```

**Retry Logic:**
```
[error] Upload failed for screenshot abc123: 500 Internal Server Error
[info] Will retry in 2s...
[info] Added to retry queue. Queue size: 1
[info] Processing 1 failed upload(s) from queue...
```

**Rate Limiting:**
```
[warn] Rate limited for screenshot abc123. Waiting 60s before retry
[info] Added to retry queue. Queue size: 1
```

## 🔧 Configuration

### Environment Variables (Recommended)

```bash
# In .env file
SCREENSHOT_API_ENDPOINT=https://api.example.com/screenshots
SCREENSHOT_API_TOKEN=Bearer your-token-here
SCREENSHOT_DELETE_AFTER_UPLOAD=true
```

```typescript
// In main.ts
screenshotManager.configureAPI(
  process.env.SCREENSHOT_API_ENDPOINT!,
  process.env.SCREENSHOT_API_TOKEN!,
  process.env.SCREENSHOT_DELETE_AFTER_UPLOAD === 'true'
);
```

### Runtime Configuration

```typescript
// Via IPC from settings page
ipcMain.handle('settings:update-screenshot-api', async (_event, config) => {
  screenshotManager.configureAPI(
    config.endpoint,
    config.token,
    config.deleteAfterUpload
  );
});
```

## 🐛 Troubleshooting

### Issue: Screenshots not captured

**Check:**
1. Screen recording permission granted?
2. Check logs for errors
3. Try manual capture via IPC

### Issue: Uploads failing

**Check:**
1. API endpoint correct?
2. Token valid?
3. Network connectivity?
4. Backend server running?
5. Check logs for specific errors

### Issue: Local files not deleting

**Check:**
1. `deleteAfterUpload` set to `true`?
2. Uploads actually succeeding (200-299)?
3. Check logs for deletion messages

### Issue: Queue keeps growing

**Cause:** Backend API issues

**Solution:**
1. Check backend server
2. Verify endpoint URL
3. Check network connectivity
4. View queue: `screenshotManager.getRetryQueueStatus()`

## 📈 Performance Considerations

### Network Usage
- Each screenshot: ~500KB - 2MB
- Multi-monitor: 2-6MB per capture
- Hourly (1/min): 120-360MB
- Daily: 2.88GB - 8.64GB (2 monitors)

### Optimization Options

**1. Reduce Capture Frequency**
```typescript
// In APP_CONSTANTS.ts
SCREENSHOT_INTERVAL: 120000  // 2 minutes instead of 1
```

**2. Reduce Image Quality**
```typescript
// In APP_CONSTANTS.ts
SCREENSHOT_QUALITY: 60  // Lower quality (default: 85)
```

**3. Resize Images**
```typescript
// In screenshotManager.ts
const sources = await desktopCapturer.getSources({
  types: ['screen'],
  thumbnailSize: {
    width: 1280,  // Lower resolution
    height: 720
  }
});
```

## 🔐 Security Considerations

1. **Store tokens securely**
   - Use environment variables
   - Don't commit tokens to git
   - Consider encryption

2. **HTTPS only**
   - Always use HTTPS endpoints
   - Validate SSL certificates

3. **Sanitize logs**
   - Don't log full tokens
   - Redact sensitive data

## ✅ Migration Checklist

- [ ] Update screenshot service files
- [ ] Update IPC channels
- [ ] Update handlers
- [ ] Get API endpoint from backend team
- [ ] Get authentication token
- [ ] Configure API in app
- [ ] Test multi-monitor capture
- [ ] Test API upload
- [ ] Test retry logic
- [ ] Test rate limiting
- [ ] Verify auto-delete works
- [ ] Monitor logs for issues
- [ ] Deploy to production

## 🎉 Summary

The screenshot service now has enterprise-grade reliability with:
- Multi-monitor support for comprehensive capture
- Automatic retry with smart backoff
- Rate limiting respect
- Auto-cleanup after upload
- Persistent failed upload queue

Just configure the API endpoint and token, and everything else is automatic!

