import { ipcMain } from 'electron';
import { logger } from '../utils/logger';
import {
  startOAuthFlow,
  checkAuthentication,
  logout,
  getAuthStatus,
  getAuthenticatedClient,
} from '../utils/auth';

export const setupAuthHandlers = () => {
  /**
   * Handler: google-auth
   * Starts the Google OAuth flow
   * Opens browser for user authentication and waits for callback
   */
  ipcMain.handle('google-auth', async () => {
    try {
      logger.log('[IPC] google-auth: Starting OAuth flow');

      // Check if already authenticated
      const isAuthenticated = await checkAuthentication();
      if (isAuthenticated) {
        logger.log('[IPC] google-auth: Already authenticated');
        return {
          success: true,
          authenticated: true,
          message: 'Already authenticated',
        };
      }

      // Start OAuth flow
      await startOAuthFlow();

      logger.log('[IPC] google-auth: OAuth flow completed successfully');

      return {
        success: true,
        authenticated: true,
        message: 'Authentication successful',
      };
    } catch (error) {
      logger.error('[IPC] google-auth: Error during authentication:', error);

      return {
        success: false,
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handler: check-auth
   * Checks if the user is currently authenticated
   * Returns authentication status
   */
  ipcMain.handle('check-auth', async () => {
    try {
      logger.log('[IPC] check-auth: Checking authentication status');

      const isAuthenticated = await checkAuthentication();

      logger.log('[IPC] check-auth: Authenticated:', isAuthenticated);

      return {
        authenticated: isAuthenticated,
      };
    } catch (error) {
      logger.error('[IPC] check-auth: Error checking authentication:', error);

      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handler: logout
   * Logs out the user and clears stored credentials
   */
  ipcMain.handle('logout', async () => {
    try {
      logger.log('[IPC] logout: Logging out user');

      await logout();

      logger.log('[IPC] logout: Logout successful');

      return {
        success: true,
        message: 'Logged out successfully',
      };
    } catch (error) {
      logger.error('[IPC] logout: Error during logout:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handler: get-auth-status
   * Gets detailed authentication status including expiry information
   */
  ipcMain.handle('get-auth-status', async () => {
    try {
      logger.log('[IPC] get-auth-status: Getting authentication status');

      const status = await getAuthStatus();

      logger.log('[IPC] get-auth-status: Status:', status);

      return status;
    } catch (error) {
      logger.error('[IPC] get-auth-status: Error getting auth status:', error);

      return {
        authenticated: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  /**
   * Handler: get-auth-client
   * Gets the authenticated OAuth client for making API calls
   * This is used internally by other IPC handlers
   */
  ipcMain.handle('get-auth-client', async () => {
    try {
      logger.log('[IPC] get-auth-client: Getting authenticated client');

      const client = await getAuthenticatedClient();

      // Return the credentials (not the client itself, as it's not serializable)
      return {
        success: true,
        credentials: client.credentials,
      };
    } catch (error) {
      logger.error('[IPC] get-auth-client: Error getting authenticated client:', error);

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  });

  logger.log('[IPC] Auth handlers registered successfully');
};
