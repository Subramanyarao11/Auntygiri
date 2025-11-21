# 🧪 Testing Scripts

This folder contains utility scripts for testing different aspects of the monitoring app.

## 📱 Tray Mode Testing

### `test-tray-modes.js`

Tests the system tray behavior in different environments to ensure proper stealth operation.

**What it tests:**
- **Production Mode**: Verifies NO tray icon appears (student stealth mode)
- **Development Mode**: Verifies full tray menu appears (developer debugging)

**Usage:**

```bash
# Quick test (recommended)
npm run test:tray

# Or run directly
node scripts/test-tray-modes.js

# Test full production build
npm run test:production
```

**What you'll see:**

1. **Production Test**: 
   - Should see NO ● icon in menu bar
   - Complete stealth for students

2. **Development Test**:
   - Should see ● icon in menu bar  
   - Right-click to see full dev menu
   - Includes screenshot controls, DevTools, quit option

**Expected Output:**
```
🎯 Testing System Tray Behavior in Different Modes
============================================================

🎓 PRODUCTION MODE TEST (Student Experience)
--------------------------------------------------
NODE_ENV: production
✅ Production mode executed
👀 Look at your menu bar - should see NO tray icon
🔒 This is complete stealth mode for students

🔧 DEVELOPMENT MODE TEST (Developer Experience)
--------------------------------------------------
NODE_ENV: development
✅ Development mode executed
👀 Look at your menu bar - should see ● icon
🖱️  Right-click the ● icon to see full dev menu
```

## 🔧 Prerequisites

Before running tests, make sure the app is built:

```bash
npm run build:electron
```

## 🎯 Why This Matters

The tray behavior is critical for the app's stealth operation:

- **Students** must never know the app exists or be able to quit it
- **Developers** need full access for testing and debugging
- **Production builds** must be completely invisible to end users

## 🚨 Security Note

Never ship a build with `NODE_ENV=development` to students, as this would expose the tray menu and allow them to quit or interfere with the monitoring.
