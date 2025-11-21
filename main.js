const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('./config');

let tray = null;
let mainWindow = null;

// Hide dock icon on macOS
if (process.platform === 'darwin') {
  app.dock.hide();
}

// Enable auto-launch on system startup
app.setLoginItemSettings({
  openAtLogin: true,
  openAsHidden: true
});

function createHiddenWindow() {
  console.log('🪟 Creating window');
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    show: false, // Don't show window by default
    skipTaskbar: true, // Hide from taskbar/dock
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile('index.html');
  console.log('✅ Window created and HTML loaded');
  
  // Open DevTools only in development
  // mainWindow.webContents.openDevTools();
  
  // Don't prevent window from showing during onboarding
  
  mainWindow.on('close', (e) => {
    console.log('🔒 Window close event triggered');
  });
}

// Listen for onboarding completion
ipcMain.on('onboarding-complete', (event, data) => {
  console.log('📥 Received onboarding-complete event in main process');
  console.log('💾 Data:', data);
  
  config.setOnboarded(data);
  console.log('✅ Config saved');
  
  // Hide the window after onboarding
  console.log('⏰ Setting timeout to hide window and create tray in 3 seconds');
  setTimeout(() => {
    console.log('🔒 Timeout triggered - checking window status');
    if (mainWindow && !mainWindow.isDestroyed()) {
      console.log('🪟 Window exists and is not destroyed, hiding it');
      mainWindow.hide();
      console.log('✅ Window hidden');
    } else {
      console.log('⚠️ Window is null or already destroyed (likely closed by user)');
    }
    // Create tray icon for parent access
    console.log('📌 Creating tray icon');
    createTray();
    console.log('✅ Tray icon created');
  }, 3000);
});

function createTray() {
  console.log('🎨 Creating tray icon...');
  
  try {
    // Use text-based tray icon - most reliable method for macOS
    // Create empty icon and use setTitle to show a visible dot
    const icon = nativeImage.createEmpty();
    
    tray = new Tray(icon);
    console.log('✅ Tray object created');
    
    // Set a visible text icon (● bullet point)
    tray.setTitle('●');
    console.log('✅ Tray title set to: ●');
    
    // Add context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Open Dashboard',
        click: () => {
          console.log('🖱️ Dashboard clicked');
          showDashboard();
        }
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit Application',
        click: () => {
          console.log('🖱️ Quit clicked');
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);
    
    tray.setToolTip('Monitoring App - Click for options');
    tray.setContextMenu(contextMenu);
    console.log('✅ Tray menu configured');
    
    // Make tray respond to clicks
    tray.on('click', () => {
      console.log('🖱️ Tray icon clicked');
      tray.popUpContextMenu();
    });
    
    console.log('✅ Tray icon fully configured and should be visible in menu bar');
    console.log('👉 Look for a black dot (●) in your menu bar at the top-right');
    
    // Verify tray is visible
    if (tray && !tray.isDestroyed()) {
      console.log('✅ Tray is active and not destroyed');
    } else {
      console.log('❌ ERROR: Tray was destroyed or null');
    }
    
  } catch (error) {
    console.error('❌ Error creating tray:', error);
  }
}

function showDashboard() {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.show();
  } else {
    createHiddenWindow();
    mainWindow.show();
  }
}

app.whenReady().then(() => {
  console.log('🚀 App is ready');
  
  // Check if onboarding is complete
  const isOnboarded = config.isOnboarded();
  console.log('🔍 Is onboarded?', isOnboarded);
  
  if (!isOnboarded) {
    // First run: show onboarding
    console.log('👋 First run - showing onboarding');
    createHiddenWindow();
    mainWindow.show();
    console.log('✅ Onboarding window shown');
  } else {
    // Already onboarded: run silently in background
    console.log('✅ Already onboarded - running in background');
    createHiddenWindow();
    createTray();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createHiddenWindow();
    }
  });
});

// Keep app running even when all windows are closed
app.on('window-all-closed', (e) => {
  // Don't quit the app, keep running in background
  e.preventDefault();
});

// Prevent app from quitting
app.on('before-quit', (e) => {
  // Only allow quit from tray menu
  if (!app.isQuitting) {
    e.preventDefault();
  }
});

