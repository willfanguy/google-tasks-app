/**
 * Label Store
 * Manages labels (tags) and priorities for tasks with localStorage persistence
 * Labels and priorities are local metadata and not synced to Google Tasks API
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Label, DEFAULT_LABEL_COLORS, LabelColor } from '../types/label';
import { Priority } from '../types/priority';
import { logger } from '../utils/logger';

// Counter to ensure unique IDs even when Date.now() returns the same value
let labelIdCounter = 0;

/**
 * Generates a unique label ID using timestamp + counter + random suffix
 */
function generateLabelId(): string {
  const timestamp = Date.now();
  const counter = labelIdCounter++;
  const random = Math.random().toString(36).substring(2, 8);
  return `label-${timestamp}-${counter}-${random}`;
}

interface LabelState {
  labels: Label[];
  taskLabels: Map<string, string[]>; // taskId -> labelIds[]
  taskPriorities: Map<string, Priority>; // taskId -> priority

  // Label Actions
  createLabel: (name: string, color?: LabelColor) => Label;
  updateLabel: (id: string, updates: Partial<Label>) => void;
  deleteLabel: (id: string) => void;
  reorderLabels: (labelIds: string[]) => void;
  addLabelToTask: (taskId: string, labelId: string) => void;
  removeLabelFromTask: (taskId: string, labelId: string) => void;
  setTaskLabels: (taskId: string, labelIds: string[]) => void;
  clearTaskLabels: (taskId: string) => void;

  // Priority Actions
  setTaskPriority: (taskId: string, priority: Priority | undefined) => void;
  getTaskPriority: (taskId: string) => Priority | undefined;
  clearTaskPriority: (taskId: string) => void;

  // Getters
  getTaskLabels: (taskId: string) => string[];
  getLabelById: (id: string) => Label | undefined;
  getLabelByName: (name: string) => Label | undefined;
  getTasksWithLabel: (labelId: string) => string[];
  getSortedLabels: () => Label[];
}

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      labels: [],
      taskLabels: new Map(),
      taskPriorities: new Map(),

      /**
       * Creates a new label
       */
      createLabel: (name: string, color?: LabelColor) => {
        logger.log('[LabelStore] Creating label:', name);

        // Use a random color from defaults if not provided
        const selectedColor =
          color ||
          DEFAULT_LABEL_COLORS[
            Math.floor(Math.random() * DEFAULT_LABEL_COLORS.length)
          ];

        const newLabel: Label = {
          id: generateLabelId(),
          name,
          color: selectedColor,
          order: get().labels.length,
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          labels: [...state.labels, newLabel],
        }));

        logger.log('[LabelStore] Label created:', newLabel);
        return newLabel;
      },

      /**
       * Updates a label's properties
       */
      updateLabel: (id: string, updates: Partial<Label>) => {
        logger.log(`[LabelStore] Updating label ${id}:`, updates);

        set((state) => ({
          labels: state.labels.map((l) => (l.id === id ? { ...l, ...updates } : l)),
        }));
      },

      /**
       * Deletes a label and removes it from all tasks
       */
      deleteLabel: (id: string) => {
        logger.log('[LabelStore] Deleting label:', id);

        set((state) => {
          // Remove label from all tasks
          const newTaskLabels = new Map(state.taskLabels);
          newTaskLabels.forEach((labelIds, taskId) => {
            const filtered = labelIds.filter((labelId) => labelId !== id);
            if (filtered.length > 0) {
              newTaskLabels.set(taskId, filtered);
            } else {
              newTaskLabels.delete(taskId);
            }
          });

          return {
            labels: state.labels.filter((l) => l.id !== id),
            taskLabels: newTaskLabels,
          };
        });
      },

      /**
       * Reorders labels by setting new order values
       */
      reorderLabels: (labelIds: string[]) => {
        logger.log('[LabelStore] Reordering labels:', labelIds);

        set((state) => ({
          labels: state.labels.map((l) => {
            const newIndex = labelIds.indexOf(l.id);
            return newIndex !== -1 ? { ...l, order: newIndex } : l;
          }),
        }));
      },

      /**
       * Adds a label to a task
       */
      addLabelToTask: (taskId: string, labelId: string) => {
        logger.log(`[LabelStore] Adding label ${labelId} to task ${taskId}`);

        // Verify label exists
        const label = get().labels.find((l) => l.id === labelId);
        if (!label) {
          logger.error(`[LabelStore] Label ${labelId} not found`);
          return;
        }

        set((state) => {
          const currentLabels = state.taskLabels.get(taskId) || [];
          if (currentLabels.includes(labelId)) {
            return state;
          }

          const newTaskLabels = new Map(state.taskLabels);
          newTaskLabels.set(taskId, [...currentLabels, labelId]);
          return { taskLabels: newTaskLabels };
        });
      },

      /**
       * Removes a label from a task
       */
      removeLabelFromTask: (taskId: string, labelId: string) => {
        logger.log(`[LabelStore] Removing label ${labelId} from task ${taskId}`);

        set((state) => {
          const currentLabels = state.taskLabels.get(taskId) || [];
          const filtered = currentLabels.filter((id) => id !== labelId);
          const newTaskLabels = new Map(state.taskLabels);

          if (filtered.length > 0) {
            newTaskLabels.set(taskId, filtered);
          } else {
            newTaskLabels.delete(taskId);
          }

          return { taskLabels: newTaskLabels };
        });
      },

      /**
       * Sets all labels for a task at once (replaces existing)
       */
      setTaskLabels: (taskId: string, labelIds: string[]) => {
        logger.log(`[LabelStore] Setting labels for task ${taskId}:`, labelIds);

        // Verify all labels exist
        const validLabelIds = labelIds.filter((id) =>
          get().labels.some((l) => l.id === id)
        );

        if (validLabelIds.length !== labelIds.length) {
          logger.warn('[LabelStore] Some label IDs were invalid and filtered out');
        }

        set((state) => {
          const newTaskLabels = new Map(state.taskLabels);
          if (validLabelIds.length > 0) {
            newTaskLabels.set(taskId, validLabelIds);
          } else {
            newTaskLabels.delete(taskId);
          }
          return { taskLabels: newTaskLabels };
        });
      },

      /**
       * Removes all labels from a task
       */
      clearTaskLabels: (taskId: string) => {
        logger.log(`[LabelStore] Clearing all labels from task ${taskId}`);

        set((state) => {
          const newTaskLabels = new Map(state.taskLabels);
          newTaskLabels.delete(taskId);
          return { taskLabels: newTaskLabels };
        });
      },

      /**
       * Gets all label IDs for a task
       */
      getTaskLabels: (taskId: string) => {
        return get().taskLabels.get(taskId) || [];
      },

      /**
       * Gets a label by ID
       */
      getLabelById: (id: string) => {
        return get().labels.find((l) => l.id === id);
      },

      /**
       * Gets a label by name (case-insensitive)
       */
      getLabelByName: (name: string) => {
        const lowerName = name.toLowerCase();
        return get().labels.find((l) => l.name.toLowerCase() === lowerName);
      },

      /**
       * Gets all task IDs that have a specific label
       */
      getTasksWithLabel: (labelId: string) => {
        const taskIds: string[] = [];
        get().taskLabels.forEach((labelIds, taskId) => {
          if (labelIds.includes(labelId)) {
            taskIds.push(taskId);
          }
        });
        return taskIds;
      },

      /**
       * Gets labels sorted by their order property
       */
      getSortedLabels: () => {
        return [...get().labels].sort((a, b) => a.order - b.order);
      },

      /**
       * Sets priority for a task
       */
      setTaskPriority: (taskId: string, priority: Priority | undefined) => {
        logger.log(`[LabelStore] Setting priority for task ${taskId}:`, priority);

        set((state) => {
          const newTaskPriorities = new Map(state.taskPriorities);
          if (priority) {
            newTaskPriorities.set(taskId, priority);
          } else {
            newTaskPriorities.delete(taskId);
          }
          return { taskPriorities: newTaskPriorities };
        });
      },

      /**
       * Gets priority for a task
       */
      getTaskPriority: (taskId: string) => {
        return get().taskPriorities.get(taskId);
      },

      /**
       * Clears priority from a task
       */
      clearTaskPriority: (taskId: string) => {
        logger.log(`[LabelStore] Clearing priority from task ${taskId}`);

        set((state) => {
          const newTaskPriorities = new Map(state.taskPriorities);
          newTaskPriorities.delete(taskId);
          return { taskPriorities: newTaskPriorities };
        });
      },
    }),
    {
      name: 'label-storage',
      // Fix duplicate label IDs on rehydration (one-time migration)
      onRehydrateStorage: () => {
        return (state) => {
          if (!state) return;

          // Check for duplicate label IDs
          const idToLabels = new Map<string, Label[]>();
          for (const label of state.labels) {
            const existing = idToLabels.get(label.id) || [];
            existing.push(label);
            idToLabels.set(label.id, existing);
          }

          // Find duplicate IDs (IDs shared by multiple labels)
          const duplicateIds = new Set<string>();
          for (const [id, labels] of idToLabels.entries()) {
            if (labels.length > 1) {
              duplicateIds.add(id);
            }
          }

          if (duplicateIds.size === 0) {
            return; // No duplicates, nothing to fix
          }

          logger.warn(
            '[LabelStore] Found duplicate label IDs, running migration:',
            Array.from(duplicateIds).map((id) => ({
              id,
              names: idToLabels.get(id)?.map((l) => l.name),
            }))
          );

          // Assign new unique IDs to all labels with duplicate IDs
          const fixedLabels = state.labels.map((label) => {
            if (!duplicateIds.has(label.id)) {
              return label; // Not a duplicate, keep as-is
            }

            // This label has a duplicate ID - assign a new unique ID
            const newId = generateLabelId();
            logger.log(
              `[LabelStore] Remapping label "${label.name}" from ${label.id} to ${newId}`
            );
            return { ...label, id: newId };
          });

          // Clear taskLabels that reference any duplicate ID
          // (external sync will re-apply correct labels on next run)
          const fixedTaskLabels = new Map<string, string[]>();
          let clearedCount = 0;
          state.taskLabels.forEach((labelIds, taskId) => {
            const validIds = labelIds.filter((id) => !duplicateIds.has(id));
            if (validIds.length !== labelIds.length) {
              clearedCount++;
            }
            if (validIds.length > 0) {
              fixedTaskLabels.set(taskId, validIds);
            }
          });

          // Apply the fixes
          useLabelStore.setState({
            labels: fixedLabels,
            taskLabels: fixedTaskLabels,
          });

          logger.log(
            `[LabelStore] Migration complete. Fixed ${duplicateIds.size} duplicate IDs, cleared labels from ${clearedCount} tasks. External sync will re-apply labels.`
          );
        };
      },
      // Custom storage to handle Map serialization and contextIsolation
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Convert taskLabels and taskPriorities arrays back to Maps
          if (data.state?.taskLabels) {
            data.state.taskLabels = new Map(data.state.taskLabels);
          }
          if (data.state?.taskPriorities) {
            data.state.taskPriorities = new Map(data.state.taskPriorities);
          }
          return data;
        },
        setItem: (name, value) => {
          // Convert Maps to arrays for JSON serialization
          const serialized = {
            ...value,
            state: {
              ...value.state,
              taskLabels: Array.from(value.state.taskLabels.entries()),
              taskPriorities: Array.from(value.state.taskPriorities.entries()),
            },
          };
          localStorage.setItem(name, JSON.stringify(serialized));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
