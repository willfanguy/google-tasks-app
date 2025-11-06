import { ipcMain } from 'electron';
import { logger } from '../utils/logger';

// Simple in-memory storage
const storage = new Map<string, unknown>();

export const setupStorageHandlers = () => {
  ipcMain.handle('get-store', async (_event, key: string) => {
    logger.log(`[Storage IPC] Getting key: ${key}`);
    return storage.get(key);
  });

  ipcMain.handle('set-store', async (_event, key: string, value: unknown) => {
    logger.log(`[Storage IPC] Setting key: ${key}`);
    storage.set(key, value);
  });

  ipcMain.handle('delete-store', async (_event, key: string) => {
    logger.log(`[Storage IPC] Deleting key: ${key}`);
    storage.delete(key);
  });

  logger.log('[IPC] Storage handlers registered successfully');
};
