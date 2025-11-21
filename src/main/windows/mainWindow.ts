/**
 * Main Window Configuration
 * Creates and configures the main application window
 */

import { BrowserWindow, screen } from 'electron';
import path from 'path';
import log from 'electron-log';

const WINDOW_WIDTH = 1200;
const WINDOW_HEIGHT = 800;
const MIN_WIDTH = 1000;
const MIN_HEIGHT = 600;

/**
 * Create the main application window
 */
export function createMainWindow(isDevelopment: boolean): BrowserWindow {
  log.info('Creating main window');

  // Get primary display dimensions
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;

  // Calculate centered position
  const x = Math.floor((width - WINDOW_WIDTH) / 2);
  const y = Math.floor((height - WINDOW_HEIGHT) / 2);

  // Create the browser window
  const mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
    x,
    y,
    show: false, // Don't show until ready
    backgroundColor: '#ffffff',
    title: 'Student Monitor',
    icon: path.join(__dirname, '../../../assets/icons/icon.png'),
    webPreferences: {
      preload: path.join(__dirname, '../../preload/preload/index.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
    },
    autoHideMenuBar: true,
    frame: true,
  });

  // Load the app
  if (isDevelopment) {
    // Development: Load from Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, '../../../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    log.info('Main window ready to show');
    mainWindow.show();
    mainWindow.focus();
  });

  // Handle window close
  mainWindow.on('close', (event) => {
    // On macOS, hide window instead of closing
    if (process.platform === 'darwin') {
      event.preventDefault();
      mainWindow.hide();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    log.info('Main window closed');
  });

  // Prevent navigation
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const appUrl = isDevelopment ? 'http://localhost:5173' : 'file://';
    if (!url.startsWith(appUrl)) {
      event.preventDefault();
      log.warn('Navigation prevented:', url);
    }
  });

  // Prevent new window creation
  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  return mainWindow;
}

/**
 * Focus the main window
 */
export function focusMainWindow(window: BrowserWindow): void {
  if (window.isMinimized()) {
    window.restore();
  }
  window.focus();
}

/**
 * Toggle window visibility
 */
export function toggleWindowVisibility(window: BrowserWindow): void {
  if (window.isVisible()) {
    window.hide();
  } else {
    window.show();
    focusMainWindow(window);
  }
}

