#!/usr/bin/env node

/**
 * Tray Mode Testing Script
 * 
 * Tests the difference between production and development tray behavior:
 * - Production: NO tray icon (students can't see or interact)
 * - Development: Full tray menu (developers can debug and control)
 * 
 * Usage:
 *   npm run test:tray
 *   OR
 *   node scripts/test-tray-modes.js
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');

console.log('🎯 Testing System Tray Behavior in Different Modes');
console.log('=' .repeat(60));

app.whenReady().then(() => {
  const window = new BrowserWindow({ 
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });
  
  // Test Production Mode (what students see)
  console.log('\n🎓 PRODUCTION MODE TEST (Student Experience)');
  console.log('-'.repeat(50));
  process.env.NODE_ENV = 'production';
  console.log('NODE_ENV:', process.env.NODE_ENV);
  
  try {
    const { setupSystemTray } = require('../dist-electron/main/tray/systemTray');
    setupSystemTray(window);
    
    console.log('✅ Production mode executed');
    console.log('👀 Look at your menu bar - should see NO tray icon');
    console.log('🔒 This is complete stealth mode for students');
    console.log('📱 Students have no way to access or quit the app');
  } catch (error) {
    console.log('❌ Error in production mode:', error.message);
    console.log('💡 Make sure to run "npm run build:electron" first');
  }
  
  setTimeout(() => {
    console.log('\n🔧 DEVELOPMENT MODE TEST (Developer Experience)');
    console.log('-'.repeat(50));
    process.env.NODE_ENV = 'development';
    console.log('NODE_ENV:', process.env.NODE_ENV);
    
    try {
      // Reload the module to pick up new NODE_ENV
      delete require.cache[require.resolve('../dist-electron/main/tray/systemTray')];
      const { setupSystemTray: setupDevTray } = require('../dist-electron/main/tray/systemTray');
      setupDevTray(window);
      
      console.log('✅ Development mode executed');
      console.log('👀 Look at your menu bar - should see ● icon');
      console.log('🖱️  Right-click the ● icon to see full dev menu');
      console.log('🔧 Menu includes: Screenshot controls, DevTools, App info, Quit');
    } catch (error) {
      console.log('❌ Error in development mode:', error.message);
      console.log('💡 Make sure to run "npm run build:electron" first');
    }
    
    console.log('\n📋 SUMMARY');
    console.log('-'.repeat(50));
    console.log('🎓 Production (Students): NO tray icon - Complete stealth');
    console.log('🔧 Development (Devs):    ● tray icon - Full control menu');
    
    setTimeout(() => {
      console.log('\n🛑 Test complete - App will close in 3 seconds');
      console.log('💡 To test in real app: npm run dev (development) vs npm run build && npm start (production)');
      setTimeout(() => app.quit(), 3000);
    }, 5000);
  }, 3000);
});

app.on('window-all-closed', () => {
  // Keep app running to test tray behavior
});

// Handle any uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught error:', error.message);
  console.log('💡 Make sure to build the app first: npm run build:electron');
  process.exit(1);
});