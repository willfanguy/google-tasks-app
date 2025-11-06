/**
 * Application configuration constants
 */

export const APP_NAME = 'Google Tasks';
export const APP_VERSION = '0.1.0';

// Google OAuth Configuration
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
export const GOOGLE_CLIENT_SECRET = import.meta.env.VITE_GOOGLE_CLIENT_SECRET || '';
export const GOOGLE_REDIRECT_URI = import.meta.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
export const GOOGLE_SCOPES = [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
];

// API Configuration
export const GOOGLE_TASKS_API_BASE = 'https://tasks.googleapis.com/tasks/v1';

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKENS: 'auth_tokens',
  USER_INFO: 'user_info',
  BOARDS: 'boards',
  LABELS: 'labels',
  SETTINGS: 'settings',
  LAST_SYNC: 'last_sync',
} as const;

// Sync Configuration
export const SYNC_INTERVAL = 30000; // 30 seconds
export const OFFLINE_RETRY_DELAY = 5000; // 5 seconds

// UI Configuration
export const MAX_BOARD_LISTS = 20;
export const MAX_LABELS = 50;
export const TASK_CARD_WIDTH = 280;
export const LIST_MIN_WIDTH = 300;
