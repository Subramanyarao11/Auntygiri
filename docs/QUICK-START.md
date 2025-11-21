# 🚀 Quick Start Guide

## What's Implemented

### ✅ Core Features
- **Stealth Mode** - Hidden from Dock, runs in background
- **Auto-start** - Launches on system boot
- **Multi-monitor** - Captures all screens
- **Every minute** - Automatic screenshot capture
- **Auto-delete** - Removes local files after successful upload
- **Smart Retries** - Exponential backoff with 3 retries
- **Rate Limiting** - Respects 429 status and Retry-After headers
- **Failed Queue** - Automatic retry of failed uploads

---

## 🎯 Quick Setup (3 Steps)

### 1. Run the App
```bash
npm start
```

### 2. Configure API (when ready)
In the terminal where app is running:
```javascript
screenshotService.configureAPI(
  'https://your-api.com/api/screenshots',  // Your API URL
  'Bearer your-auth-token',                 // Your token
  true                                       // Delete after upload
);
```

### 3. Test It
```javascript
await screenshotService.testAPIConnection();
await screenshotService.captureNow();
```

**That's it!** Screenshots will now:
- Capture every minute
- Upload to your API
- Retry if failed
- Delete after success

---

## 📱 Menu Bar Controls

Click the **●** icon (top-right of screen):

```
● Monitoring App
  ├─ Open Dashboard
  ├─ Screenshot Service
  │  ├─ Capture Now (Test)          ← Manual screenshot
  │  ├─ View Status                 ← See current state
  │  ├─ API Configuration
  │  │  ├─ ✅ API Configured        ← Shows if API is set
  │  │  ├─ Configure API            ← Instructions
  │  │  └─ Test API Connection      ← Test your API
  │  └─ Stop/Start Capture          ← Toggle service
  └─ Quit Application
```

---

## 🔍 Check What's Happening

### View Screenshots
```bash
open ~/.monitoring-screenshots/
```

### Check Status
```javascript
const status = screenshotService.getStatus();
console.log(status);
```

### Run Test Script
```bash
./test-screenshots.sh
```

---

## 📊 What You'll See (Logs)

### Successful Capture & Upload:
```
📸 Starting screenshot capture...
🔐 Screen Recording Permission: granted
✅ Screen recording permission GRANTED
🖥️ Found 1 display(s)
📷 Captured 1 screen source(s)
✅ Screenshot saved: screen_1_xxx.png
📤 Uploading screen_1_xxx.png (attempt 1/4)...
✅ Screenshot screen_1_xxx.png uploaded successfully
🗑️  Deleted local file: screen_1_xxx.png
```

### API Not Configured (Normal):
```
⚠️  API endpoint not configured. Skipping upload.
💡 Set apiEndpoint and apiToken to enable uploads
✅ Screenshot saved: screen_1_xxx.png
```

### Upload Failed (Will Retry):
```
❌ Upload failed with status 500: Internal Server Error
🔄 Will retry in 2 seconds...
📋 Added to retry queue. Queue size: 1
```

### Rate Limited:
```
⏳ Rate limited. Waiting 60 seconds before retry...
📋 Added to retry queue. Queue size: 1
```

---

## 🎮 Common Commands

### Configure API
```javascript
screenshotService.configureAPI(
  'https://api.example.com/screenshots',
  'Bearer abc123',
  true
);
```

### Test Connection
```javascript
await screenshotService.testAPIConnection();
```

### Manual Capture
```javascript
await screenshotService.captureNow();
```

### Check Status
```javascript
screenshotService.getStatus();
```

### View Queue
```javascript
console.log(`Queue size: ${screenshotService.failedUploads.length}`);
```

### Stop/Start Service
```javascript
screenshotService.stop();
screenshotService.start();
```

### Change Settings
```javascript
// Don't delete after upload
screenshotService.deleteAfterUpload = false;

// More retries
screenshotService.maxRetries = 5;

// Capture every 2 minutes instead
screenshotService.captureIntervalMs = 120000;
```

---

## 🔧 For Backend Developer

### API Endpoint Needed:
```
POST https://your-api.com/api/screenshots
```

### Expected Headers:
```
Content-Type: application/json
Authorization: Bearer YOUR_TOKEN
```

### Payload Format:
```json
{
  "parentEmail": "parent@example.com",
  "childName": "Child Name",
  "screenNumber": 1,
  "displayId": "12345",
  "screenName": "Built-in Display",
  "timestamp": 1763742586775,
  "image": "base64-encoded-png-image",
  "metadata": {
    "width": 1920,
    "height": 1080,
    "capturedAt": "2024-11-21T21:59:46.775Z"
  }
}
```

### Expected Response (Success):
```
Status: 200-299
Body: { "success": true, "id": "screenshot-id" }
```

### Expected Response (Rate Limit):
```
Status: 429
Headers: Retry-After: 60  (seconds)
```

---

## 📁 Files Overview

| File | Purpose |
|------|---------|
| `main.js` | Main app process, tray icon |
| `index.html` | Onboarding UI |
| `screenshot-service.js` | Screenshot capture & upload logic |
| `config.js` | Configuration storage |
| `package.json` | Dependencies & scripts |
| `API-INTEGRATION-ADVANCED.md` | Full API documentation |
| `PERMISSIONS-GUIDE.md` | macOS permission help |
| `QUICK-START.md` | This file! |
| `test-screenshots.sh` | Test utility script |

---

## 🐛 Troubleshooting

### No screenshots captured?
1. Check permission: System Settings → Privacy → Screen Recording
2. Enable for "Electron" or "Cursor"
3. Restart app

### API uploads failing?
1. Check API endpoint is correct
2. Check token is valid
3. Test connection: `await screenshotService.testAPIConnection()`
4. Check backend server is running

### Local files not deleting?
1. Check: `screenshotService.deleteAfterUpload` is `true`
2. Verify uploads are successful (status 200-299)
3. Check logs for deletion message

### Queue keeps growing?
- API is having issues
- Check backend server
- Check network connectivity
- View queue: `screenshotService.failedUploads`

---

## 📚 Full Documentation

- **Advanced API Guide**: `API-INTEGRATION-ADVANCED.md`
- **Permissions Setup**: `PERMISSIONS-GUIDE.md`
- **Original API Docs**: `API-INTEGRATION.md`

---

## ✅ Quick Checklist

Development:
- [ ] App running (`npm start`)
- [ ] Onboarding completed
- [ ] Screenshots capturing (check logs)
- [ ] Files appearing in `~/.monitoring-screenshots/`
- [ ] Menu bar icon (●) visible

API Integration:
- [ ] Backend API endpoint ready
- [ ] API token obtained
- [ ] API configured in app
- [ ] Connection tested
- [ ] Test upload successful
- [ ] Files auto-deleting after upload

---

## 🎉 Summary

**You now have a production-ready monitoring app with:**
- ✅ Stealth operation (hidden from user)
- ✅ Multi-monitor screenshot capture
- ✅ Automatic uploads with retry logic
- ✅ Rate limiting support
- ✅ Auto-cleanup after upload
- ✅ Failed upload queue
- ✅ Easy configuration

**Next Steps:**
1. Get API endpoint from backend team
2. Configure API (one command)
3. Test upload
4. Deploy!

Need help? Check the full docs or ask! 🚀

