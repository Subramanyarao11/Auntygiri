/**
 * Main Process Entry Point
 * Handles application lifecycle, window management, and initialization
 */

import { app, BrowserWindow, protocol, session } from 'electron';
import path from 'path';
import log from 'electron-log';
import Store from 'electron-store';
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

// Check if running in development
const isDevelopment = process.env.NODE_ENV === 'development';
const isProduction = !isDevelopment;

/**
 * Create the main application window
 */
async function createWindow() {
  try {
    log.info('Creating main window...');
    
    // Create the main window
    mainWindow = createMainWindow(isDevelopment);

    // Setup IPC handlers
    setupIpcHandlers(mainWindow, store);

    // Initialize services
    await initializeServices(mainWindow, store);

    // Setup system tray
    setupSystemTray(mainWindow);

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
 * Initialize the application
 */
async function initializeApp() {
  try {
    log.info('Initializing application...');

    // Setup security policies
    setupSecurityPolicies();

    // Register custom protocols
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
    await createWindow();

    // macOS: Re-create window when dock icon is clicked
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
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

