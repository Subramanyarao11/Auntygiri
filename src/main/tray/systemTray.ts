/**
 * System Tray Setup
 * Creates and manages the system tray icon and menu
 */

import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron';
import Store from 'electron-store';
import path from 'path';
import log from 'electron-log';

let tray: Tray | null = null;

export function setupSystemTray(mainWindow: BrowserWindow, store?: Store): void {
  log.info('Setting up system tray');

  // Check if running in development mode
  const isDevelopment = process.env.NODE_ENV === 'development';

  try {
    // Use text-based tray icon - most reliable method for macOS
    // Create empty icon and use setTitle to show a visible dot
    const icon = nativeImage.createEmpty();
    
    tray = new Tray(icon);
    log.info('Tray object created');
    
    // Set a visible text icon (● bullet point)
    tray.setTitle('●');
    tray.setToolTip('Student Monitoring App');
    log.info('Tray title set to: ●');

    // Create base menu items
    const menuItems: any[] = [
      {
        label: 'Open Dashboard',
        click: () => {
          log.info('Dashboard clicked from tray');
          if (mainWindow.isVisible()) {
            mainWindow.focus();
          } else {
            mainWindow.show();
          }
        },
      }
    ];

    // Add development-only features
    if (isDevelopment) {
      menuItems.push(
        {
          type: 'separator'
        },
        {
          label: '🔧 Dev Tools',
          submenu: [
            {
              label: 'Screenshot Service',
              submenu: [
                {
                  label: 'Capture Now (Test)',
                  click: async () => {
                    log.info('Manual capture triggered from tray');
                    try {
                      // Import and use screenshot manager directly
                      const { ScreenshotManager } = await import('../services/monitoring/screenshotManager');
                      const screenshotManager = new ScreenshotManager(mainWindow, store || new Store());
                      const screenshots = await screenshotManager.captureScreenshot();
                      log.info(`Manual capture: ${screenshots.length} screenshot(s) saved`);
                    } catch (error) {
                      log.error('Error in manual screenshot capture:', error);
                    }
                  }
                },
                {
                  label: 'View Status',
                  click: () => {
                    const apiConfigured = store?.get('api.endpoint') ? '✅ API Configured' : '⚠️ API Not Configured';
                    const onboarded = store?.get('onboarding.completed') ? '✅ Onboarded' : '⚠️ Not Onboarded';
                    log.info(`Screenshot Service Status:
                      - ${apiConfigured}
                      - ${onboarded}
                      - Screenshots Directory: ~/Library/Application Support/student-monitoring-app/screenshots/`);
                  }
                },
                {
                  type: 'separator'
                },
                {
                  label: 'Open Screenshots Folder',
                  click: () => {
                    const { shell } = require('electron');
                    const os = require('os');
                    const screenshotsPath = path.join(os.homedir(), 'Library', 'Application Support', 'student-monitoring-app', 'screenshots');
                    shell.openPath(screenshotsPath).catch((error: any) => {
                      log.error('Error opening screenshots folder:', error);
                    });
                  }
                }
              ]
            },
            {
              type: 'separator'
            },
            {
              label: 'App Info',
              submenu: [
                {
                  label: store?.get('onboarding.completed') ? '✅ Setup Complete' : '⚠️ Setup Required',
                  enabled: false
                },
                {
                  label: `Child: ${store?.get('onboarding.childName') || 'Not Set'}`,
                  enabled: false
                },
                {
                  type: 'separator'
                },
                {
                  label: 'View Logs',
                  click: () => {
                    log.info('=== CURRENT APP STATUS ===');
                    log.info('Onboarding:', store?.get('onboarding') || 'Not completed');
                    log.info('API Config:', store?.get('api') || 'Not configured');
                    log.info('=========================');
                  }
                }
              ]
            },
            {
              type: 'separator'
            },
            {
              label: 'Open DevTools',
              click: () => {
                mainWindow.webContents.openDevTools();
                log.info('DevTools opened from tray menu');
              }
            }
          ]
        }
      );
    }

    // Add standard menu items for all modes
    menuItems.push(
      {
        type: 'separator'
      },
      {
        label: 'Hide App',
        click: () => {
          mainWindow.hide();
          log.info('App hidden via tray menu');
        },
      }
    );

    // Only show quit in development mode
    if (isDevelopment) {
      menuItems.push({
        label: 'Quit App',
        click: () => {
          log.info('Quit requested from tray menu');
          app.quit();
        },
      });
    }

    const contextMenu = Menu.buildFromTemplate(menuItems);

    tray.setContextMenu(contextMenu);

    // Handle tray icon click
    tray.on('click', () => {
      log.info('Tray icon clicked');
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });

    log.info('System tray setup complete');
  } catch (error) {
    log.error('Error setting up system tray:', error);
    
    // Fallback: try with a simple icon
    try {
      log.info('Attempting fallback tray setup...');
      const fallbackIcon = nativeImage.createEmpty();
      tray = new Tray(fallbackIcon);
      tray.setTitle('📱');
      tray.setToolTip('Student Monitor');
      
      const simpleMenu = Menu.buildFromTemplate([
        { label: 'Show App', click: () => mainWindow.show() },
        { label: 'Quit', click: () => app.quit() }
      ]);
      
      tray.setContextMenu(simpleMenu);
      log.info('Fallback tray setup complete');
    } catch (fallbackError) {
      log.error('Fallback tray setup also failed:', fallbackError);
    }
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

