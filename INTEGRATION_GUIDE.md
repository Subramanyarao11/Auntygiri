# Quick Integration Guide

## 🎯 What We Did

Enhanced the screenshot service in the `dev` branch with production-ready features.

## 📁 Changed Files

1. ✅ `src/main/services/monitoring/screenshotManager.ts` - Enhanced with multi-monitor, retry logic, API upload
2. ✅ `src/main/handlers/screenshotHandlers.ts` - Added new IPC handlers
3. ✅ `src/shared/constants/IPC_CHANNELS.ts` - Added new channels
4. ✅ `docs/SCREENSHOT_ENHANCEMENT.md` - Complete documentation

## 🚀 Quick Start (3 Steps)

### 1. Switch to Feature Branch

```bash
git checkout feature/enhanced-screenshots
```

### 2. Install Dependencies (if needed)

```bash
npm install  # axios already installed ✅
```

### 3. Configure API (when backend ready)

In your `main.ts` or via IPC:

```typescript
screenshotManager.configureAPI(
  'https://your-api.com/api/screenshots',
  'Bearer your-auth-token',
  true  // delete after upload
);
```

## 📊 What Changed

### Before:
- ❌ Single monitor only
- ❌ No API upload (TODO)
- ❌ No retry logic
- ❌ No rate limiting
- ❌ Files kept forever

### After:
- ✅ Multi-monitor support
- ✅ Axios-based API upload
- ✅ Retry with exponential backoff (3 attempts)
- ✅ Rate limiting (429 handling)
- ✅ Auto-delete after successful upload
- ✅ Failed upload queue
- ✅ Persists across restarts

## 🔌 API Requirements

Tell your backend developer:

**Endpoint:** `POST /api/screenshots`

**Payload:**
```json
{
  "screenshotId": "abc123",
  "timestamp": 1763742586775,
  "size": 524288,
  "image": "base64-jpeg-string",
  "windowTitle": "Screen 1",
  "applicationName": "Built-in Display",
  "metadata": {
    "capturedAt": "2024-11-21T21:59:46.775Z"
  }
}
```

**Success Response:** Status 200-299
**Rate Limit:** Status 429 with `Retry-After` header

## 📝 Usage Examples

### From Main Process:

```typescript
// Configure (do once on app start)
screenshotManager.configureAPI(
  process.env.API_ENDPOINT!,
  process.env.API_TOKEN!,
  true
);

// Capture (happens automatically)
const screenshots = await screenshotManager.captureScreenshot();
console.log(`Captured ${screenshots.length} screenshots`);

// Check status
const status = screenshotManager.getRetryQueueStatus();
console.log(`Queue: ${status.queueSize} items`);
```

### From Renderer (via IPC):

```typescript
// Configure API from settings page
await window.electron.ipcRenderer.invoke('screenshot:configure-api', {
  endpoint: 'https://api.example.com/screenshots',
  token: 'Bearer token',
  deleteAfterUpload: true
});

// Manual capture
const screenshots = await window.electron.ipcRenderer.invoke('screenshot:capture');

// Check queue
const queue = await window.electron.ipcRenderer.invoke('screenshot:get-queue-status');
alert(`${queue.queueSize} uploads pending`);
```

## 🧪 Testing

### Test Multi-Monitor:

```bash
npm run dev
# Open DevTools Console
# Run: await window.electron.ipcRenderer.invoke('screenshot:capture')
# Check: Should return array with length = number of monitors
```

### Test API Upload:

```typescript
// Use httpbin for testing
await window.electron.ipcRenderer.invoke('screenshot:configure-api', {
  endpoint: 'https://httpbin.org/post',
  token: 'Bearer test',
  deleteAfterUpload: false
});

await window.electron.ipcRenderer.invoke('screenshot:capture');
// Check logs for successful upload
```

## 🔧 Configuration

### Recommended: Environment Variables

Create `.env`:
```
SCREENSHOT_API_ENDPOINT=https://api.yourapp.com/screenshots
SCREENSHOT_API_TOKEN=Bearer your-token-here
SCREENSHOT_DELETE_AFTER_UPLOAD=true
```

In `main.ts`:
```typescript
import dotenv from 'dotenv';
dotenv.config();

// After screenshot manager initialization
if (process.env.SCREENSHOT_API_ENDPOINT) {
  screenshotManager.configureAPI(
    process.env.SCREENSHOT_API_ENDPOINT,
    process.env.SCREENSHOT_API_TOKEN!,
    process.env.SCREENSHOT_DELETE_AFTER_UPLOAD === 'true'
  );
}
```

## 📚 Documentation

- **Complete Guide:** [`docs/SCREENSHOT_ENHANCEMENT.md`](./docs/SCREENSHOT_ENHANCEMENT.md)
- **API Integration:** See "API Integration" section in the guide
- **Troubleshooting:** See "Troubleshooting" section in the guide

## ✅ Integration Checklist

- [ ] Review changes in feature branch
- [ ] Test locally
- [ ] Get API endpoint from backend
- [ ] Get authentication token
- [ ] Configure API
- [ ] Test with real API
- [ ] Verify multi-monitor works
- [ ] Verify auto-delete works
- [ ] Monitor logs
- [ ] Merge to dev when ready
- [ ] Deploy to production

## 🤝 Merging to Dev

When ready:

```bash
# Make sure you're on feature branch
git checkout feature/enhanced-screenshots

# Run tests
npm run type-check
npm run lint

# Commit if needed
git add .
git commit -m "feat: enhance screenshot service with multi-monitor, retry logic, and API upload"

# Switch to dev and merge
git checkout dev
git merge feature/enhanced-screenshots

# Push to origin
git push origin dev
```

## 💡 Quick Tips

1. **Start Simple:** Configure API with `deleteAfterUpload: false` initially to keep local copies
2. **Monitor Logs:** Watch electron-log output for upload status
3. **Check Queue:** Regularly check retry queue size
4. **Test Gradually:** Test one feature at a time

## 🆘 Need Help?

- Check logs: `electron-log` output shows detailed info
- Check docs: `docs/SCREENSHOT_ENHANCEMENT.md`
- Test endpoints: Use `https://httpbin.org/post` for testing
- Queue issues: Check `screenshotManager.getRetryQueueStatus()`

## 🎉 You're Ready!

The screenshot service is now production-ready with enterprise-grade reliability. Just configure the API and you're good to go! 🚀

