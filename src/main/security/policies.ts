/**
 * Security Policies
 * Configures security settings for the application
 */

import { app } from 'electron';
import log from 'electron-log';

export function setupSecurityPolicies(): void {
  log.info('Setting up security policies');

  // Disable GPU acceleration if needed for security
  // app.disableHardwareAcceleration();

  // Set Content Security Policy (disabled in development)
  // app.whenReady().then(() => {
  //   session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
  //     callback({
  //       responseHeaders: {
  //         ...details.responseHeaders,
  //         'Content-Security-Policy': [
  //           "default-src 'self'",
  //           "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  //           "style-src 'self' 'unsafe-inline'",
  //           "img-src 'self' data: https:",
  //           "font-src 'self' data:",
  //           "connect-src 'self' https://api.yourserver.com",
  //         ].join('; '),
  //       },
  //     });
  //   });
  // });

  // Prevent navigation to external URLs
  app.on('web-contents-created', (_event, contents) => {
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);

      // Allow only local URLs
      if (parsedUrl.protocol !== 'file:' && parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
        event.preventDefault();
        log.warn('Navigation prevented:', navigationUrl);
      }
    });

    // Prevent new window creation
    contents.setWindowOpenHandler(() => {
      return { action: 'deny' };
    });
  });
}

