import { BrowserWindow, session } from 'electron';
import path from 'path';

export const createMainWindow = (): BrowserWindow => {
  const mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
    title: 'Google Tasks',
    show: false,
    backgroundColor: '#ffffff',
  });

  // Set Content Security Policy
  const isDev = process.env.NODE_ENV === 'development';

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const csp = isDev
      ? // Development: Allow Vite HMR and inline styles/scripts
        [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' http://localhost:5173 ws://localhost:5173 https://www.googleapis.com https://oauth2.googleapis.com",
        ].join('; ')
      : // Production: Stricter policy
        [
          "default-src 'self'",
          "script-src 'self'",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https:",
          "font-src 'self' data:",
          "connect-src 'self' https://www.googleapis.com https://oauth2.googleapis.com",
        ].join('; ');

    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [csp],
      },
    });
  });

  return mainWindow;
};
