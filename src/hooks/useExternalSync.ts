/**
 * External Sync Hook
 * Listens for sync updates from external tools (like Claude's todo-sync-processor)
 * and applies JIRA metadata as labels to tasks
 */

import { useEffect, useCallback, useRef } from 'react';
import { useLabelStore } from '../stores/labelStore';
import { logger } from '../utils/logger';
import type { SyncData } from '../types/ipc';
import type { LabelColor } from '../types/label';

// JIRA types to skip creating labels for (we don't need these as labels)
const SKIP_JIRA_TYPES = new Set(['Task', 'Design Story', 'Story']);

// Color mapping for JIRA statuses
const STATUS_COLORS: Record<string, LabelColor> = {
  // Active work states - warm colors
  'In Progress': '#f97316', // orange
  'In Development': '#f97316', // orange
  'In Review': '#f59e0b', // amber
  'In QA': '#f97316', // orange
  'Code Review': '#f59e0b', // amber

  // Done states - cool colors
  Done: '#22c55e', // green
  Closed: '#22c55e', // green
  Released: '#10b981', // emerald
  Resolved: '#22c55e', // green

  // Waiting/blocked states
  Blocked: '#ef4444', // red
  'On Hold': '#64748b', // slate
  Waiting: '#64748b', // slate

  // Todo/backlog states
  'To Do': '#3b82f6', // blue
  Backlog: '#64748b', // gray (slate)
  Open: '#22c55e', // green (used for active work)
  New: '#0ea5e9', // sky

  // JIRA types
  Bug: '#ef4444', // red
};

// Default color for unknown statuses
const DEFAULT_STATUS_COLOR: LabelColor = '#8b5cf6'; // violet

export function useExternalSync() {
  const {
    createLabel,
    getLabelByName,
    setTaskLabels,
  } = useLabelStore();

  // Track last processed sync to prevent redundant processing
  const lastProcessedSyncRef = useRef<string | null>(null);
  // Track if listener is already set up (prevents double setup in StrictMode)
  const listenerSetupRef = useRef(false);

  /**
   * Get or create a label for a JIRA status
   */
  const getOrCreateStatusLabel = useCallback(
    (status: string): string => {
      // Check if label already exists
      const existing = getLabelByName(status);
      if (existing) {
        return existing.id;
      }

      // Create new label with appropriate color
      const color = STATUS_COLORS[status] || DEFAULT_STATUS_COLOR;
      const newLabel = createLabel(status, color);
      logger.log('[ExternalSync] Created label for status:', status, 'with color:', color);
      return newLabel.id;
    },
    [getLabelByName, createLabel]
  );

  /**
   * Process sync data and apply labels/priorities to tasks
   */
  const processSyncData = useCallback(
    (data: SyncData) => {
      // Create a fingerprint of the sync data to detect duplicates
      const syncFingerprint = data.lastSync || JSON.stringify(Object.keys(data.tasks).sort());

      // Skip if we've already processed this exact sync data
      if (lastProcessedSyncRef.current === syncFingerprint) {
        logger.log('[ExternalSync] Skipping duplicate sync data');
        return;
      }
      lastProcessedSyncRef.current = syncFingerprint;

      logger.log('[ExternalSync] Processing sync data, tasks:', Object.keys(data.tasks).length);

      for (const [taskId, metadata] of Object.entries(data.tasks)) {
        const labelIds: string[] = [];

        // Add JIRA status as a label
        if (metadata.jiraStatus) {
          const statusLabelId = getOrCreateStatusLabel(metadata.jiraStatus);
          labelIds.push(statusLabelId);
        }

        // Add JIRA type as a label (Bug, etc.) - skip generic types like Task/Story
        if (metadata.jiraType && !SKIP_JIRA_TYPES.has(metadata.jiraType)) {
          const typeLabelId = getOrCreateStatusLabel(metadata.jiraType);
          labelIds.push(typeLabelId);
        }

        // Add any explicit labels from sync data
        if (metadata.labels && metadata.labels.length > 0) {
          for (const labelName of metadata.labels) {
            const labelId = getOrCreateStatusLabel(labelName);
            labelIds.push(labelId);
          }
        }

        // Apply labels to task
        if (labelIds.length > 0) {
          setTaskLabels(taskId, labelIds);
          logger.log('[ExternalSync] Applied labels to task:', taskId, labelIds);
        }
      }
    },
    [getOrCreateStatusLabel, setTaskLabels]
  );

  useEffect(() => {
    // Check if we're running in Electron
    if (!window.electronAPI?.onExternalSyncUpdate) {
      logger.log('[ExternalSync] Not running in Electron, skipping sync listener');
      return;
    }

    // Prevent double setup in React StrictMode
    if (listenerSetupRef.current) {
      logger.log('[ExternalSync] Listener already set up, skipping');
      return;
    }
    listenerSetupRef.current = true;

    logger.log('[ExternalSync] Setting up external sync listener');

    // Listen for sync updates from main process
    const cleanup = window.electronAPI.onExternalSyncUpdate((data: unknown) => {
      logger.log('[ExternalSync] Received sync update');
      processSyncData(data as SyncData);
    });

    // Also fetch initial sync data
    window.electronAPI.getSyncData?.().then((response) => {
      if (response.success && response.data && Object.keys(response.data.tasks).length > 0) {
        logger.log('[ExternalSync] Processing initial sync data');
        processSyncData(response.data);
      }
    });

    return () => {
      listenerSetupRef.current = false;
      cleanup();
    };
  }, [processSyncData]);
}
