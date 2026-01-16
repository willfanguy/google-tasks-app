/**
 * External Sync Watcher
 * Watches ~/.google-tasks-sync/metadata.json for changes from external tools
 * (like Claude's todo-sync-processor) and pushes updates to the renderer
 */

import { watch, FSWatcher } from 'fs';
import { readFile, access, mkdir, writeFile } from 'fs/promises';
import { constants } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { BrowserWindow } from 'electron';
import { logger } from './logger';

const SYNC_DIR = join(homedir(), '.google-tasks-sync');
const SYNC_FILE = join(SYNC_DIR, 'metadata.json');

export interface SyncTaskMetadata {
  jiraKey?: string;
  jiraStatus?: string;
  jiraType?: string;
  jiraPriority?: string;
  sprint?: string;
  labels?: string[];
  priority?: 'high' | 'medium' | 'low';
  dueDate?: string;
  lastSynced?: string;
}

export interface SyncData {
  lastSync: string | null;
  tasks: Record<string, SyncTaskMetadata>;
}

let watcher: FSWatcher | null = null;
let mainWindow: BrowserWindow | null = null;

/**
 * Ensure the sync directory and file exist
 */
async function ensureSyncFile(): Promise<void> {
  try {
    await access(SYNC_DIR, constants.F_OK);
  } catch {
    logger.log('[SyncWatcher] Creating sync directory:', SYNC_DIR);
    await mkdir(SYNC_DIR, { recursive: true });
  }

  try {
    await access(SYNC_FILE, constants.F_OK);
  } catch {
    logger.log('[SyncWatcher] Creating initial sync file:', SYNC_FILE);
    const initialData: SyncData = { lastSync: null, tasks: {} };
    await writeFile(SYNC_FILE, JSON.stringify(initialData, null, 2));
  }
}

/**
 * Read and parse the sync file
 */
async function readSyncFile(): Promise<SyncData | null> {
  try {
    const content = await readFile(SYNC_FILE, 'utf-8');
    return JSON.parse(content) as SyncData;
  } catch (error) {
    logger.error('[SyncWatcher] Error reading sync file:', error);
    return null;
  }
}

/**
 * Send sync data to the renderer process
 */
function notifyRenderer(data: SyncData): void {
  if (mainWindow && !mainWindow.isDestroyed()) {
    logger.log('[SyncWatcher] Sending sync data to renderer, tasks:', Object.keys(data.tasks).length);
    mainWindow.webContents.send('external-sync-update', data);
  }
}

/**
 * Start watching the sync file for changes
 */
export async function startSyncWatcher(window: BrowserWindow): Promise<void> {
  mainWindow = window;

  await ensureSyncFile();

  // Read initial data
  const initialData = await readSyncFile();
  if (initialData && Object.keys(initialData.tasks).length > 0) {
    logger.log('[SyncWatcher] Found existing sync data, notifying renderer');
    // Small delay to ensure renderer is ready
    setTimeout(() => notifyRenderer(initialData), 1000);
  }

  // Watch for changes
  try {
    watcher = watch(SYNC_FILE, async (eventType) => {
      if (eventType === 'change') {
        logger.log('[SyncWatcher] Sync file changed, reading updates...');
        const data = await readSyncFile();
        if (data) {
          notifyRenderer(data);
        }
      }
    });

    logger.log('[SyncWatcher] Watching for sync file changes:', SYNC_FILE);
  } catch (error) {
    logger.error('[SyncWatcher] Error starting file watcher:', error);
  }
}

/**
 * Stop the file watcher
 */
export function stopSyncWatcher(): void {
  if (watcher) {
    watcher.close();
    watcher = null;
    logger.log('[SyncWatcher] Stopped watching sync file');
  }
}

/**
 * Get the current sync data (for manual refresh)
 */
export async function getSyncData(): Promise<SyncData | null> {
  return readSyncFile();
}

/**
 * Get the sync file path (for external tools to know where to write)
 */
export function getSyncFilePath(): string {
  return SYNC_FILE;
}
