import { ipcMain } from 'electron';
import { logger } from '../utils/logger';

// Simple in-memory storage
const storage = new Map<string, unknown>();

export const setupStorageHandlers = () => {
  ipcMain.handle('get-store', async (_event, key: string) => {
    try {
      logger.log(`[Storage IPC] Getting key: ${key}`);
      const value = storage.get(key);
      return {
        success: true,
        data: value,
      };
    } catch (error) {
      logger.error(`[Storage IPC] Error getting key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('set-store', async (_event, key: string, value: unknown) => {
    try {
      logger.log(`[Storage IPC] Setting key: ${key}`);
      storage.set(key, value);
      return {
        success: true,
      };
    } catch (error) {
      logger.error(`[Storage IPC] Error setting key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  ipcMain.handle('delete-store', async (_event, key: string) => {
    try {
      logger.log(`[Storage IPC] Deleting key: ${key}`);
      storage.delete(key);
      return {
        success: true,
      };
    } catch (error) {
      logger.error(`[Storage IPC] Error deleting key ${key}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  logger.log('[IPC] Storage handlers registered successfully');
};
