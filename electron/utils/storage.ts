import { app } from 'electron';
import { logger } from './logger';
import { Credentials } from 'google-auth-library';
import fs from 'fs';
import path from 'path';

// Type definition for our store schema
type StoreSchema = {
  google_oauth_tokens?: Credentials;
  [key: string]: any;
};

// Get the user data path for storing config
const USER_DATA_PATH = app.getPath('userData');
const STORE_FILE_PATH = path.join(USER_DATA_PATH, 'google-tasks-store.json');

const TOKENS_KEY = 'google_oauth_tokens';

// Simple file-based storage (encrypted storage can be added later)
function readStore(): StoreSchema {
  try {
    if (fs.existsSync(STORE_FILE_PATH)) {
      const data = fs.readFileSync(STORE_FILE_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    logger.error('[Storage] Error reading store:', error);
  }
  return {};
}

function writeStore(data: StoreSchema): void {
  try {
    // Ensure the directory exists
    const dir = path.dirname(STORE_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(STORE_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    logger.error('[Storage] Error writing store:', error);
    throw error;
  }
}

/**
 * Save OAuth tokens to secure storage
 */
export async function saveTokenStorage(tokens: Credentials): Promise<void> {
  try {
    logger.log('[Storage] Saving tokens to secure storage');
    const store = readStore();
    store[TOKENS_KEY] = tokens;
    writeStore(store);
    logger.log('[Storage] Tokens saved successfully');
  } catch (error) {
    logger.error('[Storage] Error saving tokens:', error);
    throw error;
  }
}

/**
 * Get OAuth tokens from secure storage
 */
export async function getTokenStorage(): Promise<Credentials | null> {
  try {
    const store = readStore();
    const tokens = store[TOKENS_KEY];

    if (!tokens) {
      logger.log('[Storage] No tokens found in storage');
      return null;
    }

    logger.log('[Storage] Retrieved tokens from storage');
    return tokens;
  } catch (error) {
    logger.error('[Storage] Error retrieving tokens:', error);
    return null;
  }
}

/**
 * Clear OAuth tokens from secure storage
 */
export async function clearTokenStorage(): Promise<void> {
  try {
    logger.log('[Storage] Clearing tokens from storage');
    const store = readStore();
    delete store[TOKENS_KEY];
    writeStore(store);
    logger.log('[Storage] Tokens cleared successfully');
  } catch (error) {
    logger.error('[Storage] Error clearing tokens:', error);
    throw error;
  }
}

/**
 * Check if tokens exist in storage
 */
export async function hasTokenStorage(): Promise<boolean> {
  const store = readStore();
  return TOKENS_KEY in store;
}

/**
 * Get all stored data (for debugging)
 */
export async function getAllStorage(): Promise<StoreSchema> {
  return readStore();
}

/**
 * Clear all stored data
 */
export async function clearAllStorage(): Promise<void> {
  writeStore({});
}
