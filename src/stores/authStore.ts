/**
 * Authentication Store
 * Manages user authentication state and Google OAuth flow
 */

import { create } from 'zustand';
import { logger } from '../utils/logger';

interface UserInfo {
  email?: string;
  name?: string;
  picture?: string;
}

interface AuthState {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  user: UserInfo;
  expiresAt?: number;

  // Actions
  login: () => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  getAuthStatus: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
    authenticated: false,
    loading: true,
    error: null,
    user: {},

    /**
     * Initiates Google OAuth login flow
     */
    login: async () => {
      logger.log('[AuthStore] Initiating login...');
      set({ loading: true, error: null });

      try {
        const response = await window.electronAPI.googleAuth();
        logger.log('[AuthStore] Login response:', response);

        if (response.success && response.authenticated) {
          set({ authenticated: true, loading: false });

          // Fetch user details after successful auth
          await get().getAuthStatus();
          return true;
        } else {
          set({
            authenticated: false,
            loading: false,
            error: response.error || response.message || 'Login failed',
          });
          return false;
        }
      } catch (error) {
        logger.error('[AuthStore] Login error:', error);
        set({
          authenticated: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Login failed',
        });
        return false;
      }
    },

    /**
     * Logs out the user and clears authentication state
     */
    logout: async () => {
      logger.log('[AuthStore] Logging out...');
      set({ loading: true, error: null });

      try {
        const response = await window.electronAPI.logout();
        logger.log('[AuthStore] Logout response:', response);

        set({
          authenticated: false,
          loading: false,
          user: {},
          expiresAt: undefined,
        });
      } catch (error) {
        logger.error('[AuthStore] Logout error:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Logout failed',
        });
      }
    },

    /**
     * Quick authentication check (boolean result)
     */
    checkAuth: async () => {
      logger.log('[AuthStore] Checking authentication...');
      set({ loading: true, error: null });

      try {
        const response = await window.electronAPI.checkAuth();
        logger.log('[AuthStore] Check auth response:', response);

        set({
          authenticated: response.authenticated,
          loading: false,
          error: response.error || null,
        });

        // If authenticated, fetch detailed status
        if (response.authenticated) {
          await get().getAuthStatus();
        }
      } catch (error) {
        logger.error('[AuthStore] Check auth error:', error);
        set({
          authenticated: false,
          loading: false,
          error: error instanceof Error ? error.message : 'Auth check failed',
        });
      }
    },

    /**
     * Gets detailed authentication status including user info
     */
    getAuthStatus: async () => {
      logger.log('[AuthStore] Getting auth status...');

      try {
        const response = await window.electronAPI.getAuthStatus();
        logger.log('[AuthStore] Auth status response:', response);

        set({
          authenticated: response.authenticated,
          user: response.authenticated && response.email ? { email: response.email } : {},
          expiresAt: response.authenticated && response.email ? response.expiresAt : undefined,
          error: response.error || null,
        });
      } catch (error) {
        logger.error('[AuthStore] Get auth status error:', error);
        set({
          error:
            error instanceof Error ? error.message : 'Failed to get auth status',
        });
      }
    },

    /**
     * Clears any error messages
     */
    clearError: () => {
      set({ error: null });
    },
  })
);

// Initialize auth check on store creation
useAuthStore.getState().checkAuth();
