/**
 * Sync IPC Handlers
 * Handles communication between main process sync watcher and renderer
 */

import { ipcMain } from 'electron';
import { getSyncData, getSyncFilePath, SyncData } from '../utils/syncWatcher';
import { logger } from '../utils/logger';

export function setupSyncHandlers(): void {
  logger.log('[SyncIPC] Setting up sync handlers...');

  // Get current sync data on demand
  ipcMain.handle('get-sync-data', async (): Promise<{ success: boolean; data?: SyncData; error?: string }> => {
    try {
      const data = await getSyncData();
      return { success: true, data: data ?? undefined };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('[SyncIPC] Error getting sync data:', errorMessage);
      return { success: false, error: errorMessage };
    }
  });

  // Get sync file path (so renderer can display it to user if needed)
  ipcMain.handle('get-sync-file-path', (): { success: boolean; data: string } => {
    return { success: true, data: getSyncFilePath() };
  });

  logger.log('[SyncIPC] Sync handlers initialized');
}
