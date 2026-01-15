/**
 * Quick Add IPC Handlers
 * Handles communication between quick add window and main process
 */

import { ipcMain } from 'electron';
import { hideQuickAddWindow, showQuickAddWindow, toggleQuickAddWindow } from '../quickAddWindow';
import { logger } from '../utils/logger';

export const setupQuickAddHandlers = () => {
  /**
   * Hide the quick add window
   */
  ipcMain.handle('quick-add:hide', async () => {
    try {
      logger.log('[QuickAdd IPC] Hiding quick add window');
      hideQuickAddWindow();
      return { success: true };
    } catch (error) {
      logger.error('[QuickAdd IPC] Error hiding window:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Show the quick add window
   */
  ipcMain.handle('quick-add:show', async () => {
    try {
      logger.log('[QuickAdd IPC] Showing quick add window');
      showQuickAddWindow();
      return { success: true };
    } catch (error) {
      logger.error('[QuickAdd IPC] Error showing window:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Toggle the quick add window visibility
   */
  ipcMain.handle('quick-add:toggle', async () => {
    try {
      logger.log('[QuickAdd IPC] Toggling quick add window');
      toggleQuickAddWindow();
      return { success: true };
    } catch (error) {
      logger.error('[QuickAdd IPC] Error toggling window:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  logger.log('[IPC] Quick add handlers registered successfully');
};
