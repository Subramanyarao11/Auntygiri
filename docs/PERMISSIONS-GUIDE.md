# macOS Permissions Guide

## Current Issue: Development vs Production

### Why "Cursor" is Asking for Permission

When running in **development mode** (`npm start`), the app runs through Electron's development process, which macOS sees as part of Cursor (your IDE). This is **normal and expected**.

### The Permission You Need

**Screen Recording Permission** is required to capture screenshots.

## How to Grant Permission for Testing

### Option 1: Manual (Recommended for Testing)

1. **Open System Settings**
   - Click Apple menu → System Settings
   - Go to **Privacy & Security**
   - Click **Screen Recording**

2. **Find and Enable**
   Look for one of these entries:
   - **Electron** (most common)
   - **Cursor** (if using Cursor IDE)
   - **node** (sometimes)
   - **Terminal** (if running from terminal)

3. **Enable the checkbox** next to the entry

4. **Restart the app**
   ```bash
   pkill -f electron
   npm start
   ```

### Option 2: Direct Link

Run this command to open the Screen Recording settings:
```bash
open "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture"
```

## Testing After Permission Granted

### 1. Check Permission Status

Look at the terminal logs when the app starts:
```
🔐 Screen Recording Permission: granted
✅ Screen recording permission GRANTED
```

### 2. Trigger Manual Screenshot

Click the **●** menu bar icon:
- Screenshot Service → **Capture Now (Test)**

Check terminal for:
```
📸 Starting screenshot capture...
🖥️ Found 1 display(s)
📷 Captured 1 screen source(s)
✅ Screenshot saved: screen_1_1234567890.png
```

### 3. View Screenshots

```bash
# Run the test script
./test-screenshots.sh

# Or manually check
ls -la ~/.monitoring-screenshots/

# Open the folder in Finder
open ~/.monitoring-screenshots/
```

## Production Solution: Build Proper App

For production (when deploying to real users), you need to build a proper `.app` bundle with its own identity.

### Install electron-builder

```bash
npm install --save-dev electron-builder
```

### Update package.json

Add this to `package.json`:

```json
{
  "scripts": {
    "start": "electron .",
    "build": "electron-builder --mac",
    "dist": "electron-builder"
  },
  "build": {
    "appId": "com.monitoring.app",
    "productName": "Monitoring App",
    "mac": {
      "category": "public.app-category.utilities",
      "target": "dmg",
      "icon": "build/icon.icns"
    }
  }
}
```

### Build the App

```bash
npm run build
```

This creates: `dist/Monitoring App.app`

### After Building

1. The built `.app` will have its own identity
2. When users install it, macOS will ask **"Monitoring App" wants to record your screen**
3. Permission is tied to the actual app, not development tools

## Permission States

| State | Meaning | Action |
|-------|---------|--------|
| `not-determined` | Never asked | Will prompt on first capture |
| `denied` | User denied | Must enable in System Settings |
| `granted` | Allowed ✅ | Screenshots will work |
| `restricted` | Managed by admin | Contact system admin |

## Troubleshooting

### Screenshots Not Capturing

1. **Check permission:**
   ```bash
   # Look for this in logs
   🔐 Screen Recording Permission: granted
   ```

2. **If permission denied:**
   - Open System Settings → Privacy & Security → Screen Recording
   - Enable for Electron/Cursor
   - Restart the app

3. **If still not working:**
   ```bash
   # Check if directory exists
   ls -la ~/.monitoring-screenshots/
   
   # Check app logs
   npm start
   # Look for error messages
   ```

### Multiple Electron Entries

If you see multiple "Electron" entries in Screen Recording settings:
- Enable all of them, OR
- Remove old ones by clicking the `-` button

### Permission Prompt Not Appearing

macOS caches permission decisions. To reset:
```bash
# Reset screen recording permissions (requires restart)
tccutil reset ScreenCapture
```

Then restart the app - permission prompt should appear.

## Security Notes

### For Production Deployment

1. **Sign the app** with Apple Developer certificate
2. **Notarize** for Gatekeeper approval
3. **Add Info.plist entries:**
   ```xml
   <key>NSScreenCaptureUsageDescription</key>
   <string>This app needs screen recording permission to monitor activity for parental control purposes.</string>
   ```

4. **User consent:** Clearly explain why permission is needed

## Testing Checklist

- [ ] System Settings opened
- [ ] Screen Recording permission found
- [ ] Electron/Cursor enabled
- [ ] App restarted
- [ ] Permission status shows "granted"
- [ ] Manual capture works
- [ ] Screenshots appear in `~/.monitoring-screenshots/`
- [ ] Automatic capture every minute working
- [ ] All monitors being captured

## Next Steps

1. ✅ Grant permission to Electron/Cursor for testing
2. ✅ Test manual screenshot capture
3. ✅ Verify automatic capture works
4. ⏳ Wait for backend API endpoint
5. ⏳ Integrate API calls
6. ⏳ Build production .app bundle
7. ⏳ Test with real users

## Important

🔴 **For production:** Always build a proper `.app` bundle. Don't deploy the development version!

🔴 **Legal:** Ensure proper consent and comply with local laws regarding monitoring and privacy.

