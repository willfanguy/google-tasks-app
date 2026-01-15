/**
 * Quick Add Window Manager
 * Creates and manages a floating quick-add window for global task capture
 */

import { BrowserWindow, screen } from 'electron';
import path from 'path';
import { logger } from './utils/logger';

let quickAddWindow: BrowserWindow | null = null;

/**
 * Creates or shows the quick add window
 * The window is a small, frameless, always-on-top window centered on the primary display
 */
export function createQuickAddWindow(): BrowserWindow {
  // If window exists and isn't destroyed, just show it
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    showQuickAddWindow();
    return quickAddWindow;
  }

  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  const windowWidth = 550;
  const windowHeight = 200;

  quickAddWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: Math.floor((width - windowWidth) / 2),
    y: Math.floor(height / 4), // Position in upper quarter of screen
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false, // Don't show until ready
    transparent: false,
    backgroundColor: '#1a1a1a', // Match dark theme
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
    },
  });

  const isDev = process.env.NODE_ENV === 'development';

  // Load the quick-add route
  if (isDev) {
    quickAddWindow.loadURL('http://localhost:5173/#/quick-add');
  } else {
    quickAddWindow.loadFile(path.join(__dirname, '../dist/index.html'), {
      hash: '/quick-add',
    });
  }

  // Show window once ready
  quickAddWindow.once('ready-to-show', () => {
    quickAddWindow?.show();
    quickAddWindow?.focus();
    logger.log('[QuickAddWindow] Window ready and shown');
  });

  // Hide on blur (click outside)
  quickAddWindow.on('blur', () => {
    // Small delay to prevent hiding during internal focus changes
    setTimeout(() => {
      if (quickAddWindow && !quickAddWindow.isDestroyed() && !quickAddWindow.isFocused()) {
        hideQuickAddWindow();
      }
    }, 100);
  });

  // Clean up reference when closed
  quickAddWindow.on('closed', () => {
    quickAddWindow = null;
    logger.log('[QuickAddWindow] Window closed');
  });

  logger.log('[QuickAddWindow] Window created');
  return quickAddWindow;
}

/**
 * Shows the quick add window and focuses it
 */
export function showQuickAddWindow(): void {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.show();
    quickAddWindow.focus();
    // Re-center in case display changed
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    const [windowWidth] = quickAddWindow.getSize();
    quickAddWindow.setPosition(
      Math.floor((width - windowWidth) / 2),
      Math.floor(height / 4)
    );
    logger.log('[QuickAddWindow] Window shown');
  } else {
    createQuickAddWindow();
  }
}

/**
 * Hides the quick add window (doesn't destroy it for faster re-show)
 */
export function hideQuickAddWindow(): void {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.hide();
    logger.log('[QuickAddWindow] Window hidden');
  }
}

/**
 * Destroys the quick add window completely
 */
export function destroyQuickAddWindow(): void {
  if (quickAddWindow && !quickAddWindow.isDestroyed()) {
    quickAddWindow.destroy();
    quickAddWindow = null;
    logger.log('[QuickAddWindow] Window destroyed');
  }
}

/**
 * Returns whether the quick add window is currently visible
 */
export function isQuickAddWindowVisible(): boolean {
  return quickAddWindow !== null &&
    !quickAddWindow.isDestroyed() &&
    quickAddWindow.isVisible();
}

/**
 * Toggles the quick add window visibility
 */
export function toggleQuickAddWindow(): void {
  if (isQuickAddWindowVisible()) {
    hideQuickAddWindow();
  } else {
    showQuickAddWindow();
  }
}
