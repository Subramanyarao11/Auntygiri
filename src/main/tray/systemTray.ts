/**
 * System Tray Setup
 * Creates and manages the system tray icon and menu
 */

import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron';
import path from 'path';
import log from 'electron-log';

let tray: Tray | null = null;

export function setupSystemTray(mainWindow: BrowserWindow): void {
  log.info('Setting up system tray');

  try {
    // Create tray icon
    const iconPath = path.join(__dirname, '../../../assets/icons/tray-icon.png');
    const icon = nativeImage.createFromPath(iconPath);
    
    tray = new Tray(icon.resize({ width: 16, height: 16 }));
    tray.setToolTip('Student Monitor');

    // Create context menu
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Show App',
        click: () => {
          mainWindow.show();
        },
      },
      {
        label: 'Hide App',
        click: () => {
          mainWindow.hide();
        },
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.quit();
        },
      },
    ]);

    tray.setContextMenu(contextMenu);

    // Handle tray icon click
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    });

    log.info('System tray setup complete');
  } catch (error) {
    log.error('Error setting up system tray:', error);
  }
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy();
    tray = null;
  }
}

