const { app, BrowserWindow, Menu, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const screenshotService = require('./screenshot-service');

let tray = null;
let mainWindow = null;

// Make screenshot service globally accessible for configuration
global.screenshotService = screenshotService;

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
    
    // Start screenshot service
    console.log('📸 Starting screenshot service');
    screenshotService.start();
    console.log('✅ Screenshot service started');
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
        label: 'Screenshot Service',
        submenu: [
          {
            label: 'Capture Now (Test)',
            click: () => {
              console.log('🖱️ Manual capture triggered');
              screenshotService.captureNow();
            }
          },
          {
            label: 'View Status',
            click: () => {
              const status = screenshotService.getStatus();
              console.log('📊 Screenshot Service Status:', JSON.stringify(status, null, 2));
            }
          },
          {
            type: 'separator'
          },
          {
            label: 'API Configuration',
            submenu: [
              {
                label: screenshotService.apiEndpoint ? '✅ API Configured' : '⚠️  API Not Configured',
                enabled: false
              },
              {
                type: 'separator'
              },
              {
                label: 'Configure API (see console)',
                click: () => {
                  console.log('');
                  console.log('⚙️  TO CONFIGURE API, run in console:');
                  console.log('');
                  console.log('screenshotService.configureAPI(');
                  console.log('  "https://your-api.com/api/screenshots",  // API endpoint');
                  console.log('  "Bearer your-token-here",                 // Auth token');
                  console.log('  true                                       // Delete after upload');
                  console.log(');');
                  console.log('');
                  console.log('💡 Example:');
                  console.log('screenshotService.configureAPI(');
                  console.log('  "https://api.example.com/screenshots",');
                  console.log('  "Bearer abc123...",');
                  console.log('  true');
                  console.log(');');
                  console.log('');
                }
              },
              {
                label: 'Test API Connection',
                enabled: !!screenshotService.apiEndpoint,
                click: async () => {
                  console.log('🧪 Testing API connection...');
                  await screenshotService.testAPIConnection();
                }
              }
            ]
          },
          {
            type: 'separator'
          },
          {
            label: screenshotService.isRunning ? 'Stop Capture' : 'Start Capture',
            click: () => {
              if (screenshotService.isRunning) {
                screenshotService.stop();
              } else {
                screenshotService.start();
              }
              // Rebuild menu to update the label
              createTray();
            }
          }
        ]
      },
      {
        type: 'separator'
      },
      {
        label: 'Quit Application',
        click: () => {
          console.log('🖱️ Quit clicked');
          screenshotService.stop();
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
    
    // Start screenshot service automatically
    console.log('📸 Auto-starting screenshot service');
    screenshotService.start();
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

