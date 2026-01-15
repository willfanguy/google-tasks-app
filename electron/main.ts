// Load environment variables FIRST before any other imports that need them
import dotenv from 'dotenv';
dotenv.config();

// Now import everything else
import { app, BrowserWindow, globalShortcut } from 'electron';
import path from 'path';
import { createMainWindow } from './utils/window';
import { setupAuthHandlers } from './ipc/auth';
import { setupStorageHandlers } from './ipc/storage';
import { setupTaskHandlers } from './ipc/tasks';
import { setupQuickAddHandlers } from './ipc/quickAdd';
import { createQuickAddWindow, destroyQuickAddWindow } from './quickAddWindow';
import { logger } from './utils/logger';

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (require('electron-squirrel-startup')) {
  app.quit();
}

let mainWindow: BrowserWindow | null = null;

const createWindow = (): void => {
  mainWindow = createMainWindow();

  const isDev = process.env.NODE_ENV === 'development';

  if (isDev) {
    // Load the Vite dev server
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // Load the built renderer (Vite outputs to dist/)
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

// Initialize IPC handlers
const initializeHandlers = (): void => {
  logger.log('[Main] Initializing IPC handlers...');

  // Setup auth handlers
  setupAuthHandlers();

  // Setup task handlers
  setupTaskHandlers();

  // Setup storage handlers
  setupStorageHandlers();

  // Setup quick add handlers
  setupQuickAddHandlers();

  logger.log('[Main] IPC handlers initialized successfully');
};

// Register global shortcuts
const registerGlobalShortcuts = (): void => {
  // Global shortcut to open quick add window (Cmd/Ctrl+Shift+N)
  const registered = globalShortcut.register('CommandOrControl+Shift+N', () => {
    logger.log('[Main] Global shortcut triggered: Quick Add');
    createQuickAddWindow();
  });

  if (registered) {
    logger.log('[Main] Global shortcut registered: CommandOrControl+Shift+N');
  } else {
    logger.error('[Main] Failed to register global shortcut');
  }
};

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  initializeHandlers();
  registerGlobalShortcuts();
  createWindow();

  app.on('activate', () => {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Cleanup on quit
app.on('will-quit', () => {
  // Unregister all global shortcuts
  globalShortcut.unregisterAll();
  logger.log('[Main] Global shortcuts unregistered');

  // Destroy quick add window if it exists
  destroyQuickAddWindow();
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle OAuth callback deep links (optional, for future enhancement)
// This allows the app to handle custom protocol URLs like google-tasks://oauth2callback
app.on('open-url', (event, url) => {
  event.preventDefault();
  logger.log('[Main] Received deep link:', url);
  // You can implement custom protocol handling here if needed
});

// In this file you can include the rest of your app's specific main process code
// You can also put them in separate files and import them here
