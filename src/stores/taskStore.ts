/**
 * Task Store
 * Manages tasks and task lists with optimistic updates and error handling
 */

import { create } from 'zustand';
import { Task, TaskList } from '../types/task';
import { GoogleTask, GoogleTaskList } from '../types/api';
import { useUIStore } from './uiStore';
import { useLabelStore } from './labelStore';
import { logger } from '../utils/logger';

interface TaskState {
  taskLists: TaskList[];
  tasks: Map<string, Task[]>; // listId -> tasks
  loading: boolean;
  loadingLists: Set<string>; // Track which lists are loading
  error: string | null;
  lastSync: Map<string, number>; // listId -> timestamp

  // Task List Actions
  fetchTaskLists: () => Promise<void>;
  createTaskList: (title: string) => Promise<TaskList | undefined>;
  updateTaskList: (listId: string, title: string) => Promise<void>;
  deleteTaskList: (listId: string) => Promise<void>;

  // Task Actions
  fetchTasks: (listId: string, forceRefresh?: boolean) => Promise<void>;
  createTask: (
    listId: string,
    task: Partial<Task>
  ) => Promise<Task | undefined>;
  updateTask: (
    listId: string,
    taskId: string,
    updates: Partial<Task>
  ) => Promise<void>;
  deleteTask: (listId: string, taskId: string) => Promise<void>;
  moveTask: (
    listId: string,
    taskId: string,
    data: { parent?: string; previous?: string; destinationList?: string }
  ) => Promise<{ destinationListId: string; destinationTaskId: string }>;
  toggleTaskStatus: (listId: string, taskId: string) => Promise<void>;

  // Utility Actions
  clearError: () => void;
  syncAll: () => Promise<void>;
  getTaskById: (listId: string, taskId: string) => Task | undefined;
  getTasksByList: (listId: string) => Task[];
  findTaskListId: (taskId: string) => string | undefined;
  bulkUpdateTasks: (
    taskIds: string[],
    updates: {
      dueDate?: string | null;
      listId?: string;
      labelIds?: string[];
    }
  ) => Promise<void>;
}

// Helper to convert Google API response to our Task type
const convertGoogleTaskToTask = (googleTask: GoogleTask): Task => ({
  id: googleTask.id,
  title: googleTask.title,
  notes: googleTask.notes,
  status: googleTask.status,
  due: googleTask.due,
  completed: googleTask.completed,
  parent: googleTask.parent,
  position: googleTask.position,
  links: googleTask.links,
  updated: googleTask.updated,
  selfLink: googleTask.selfLink,
  etag: googleTask.etag,
  labels: [], // Local metadata
});

// Helper to convert Google API response to our TaskList type
const convertGoogleTaskListToTaskList = (
  googleList: GoogleTaskList
): TaskList => ({
  id: googleList.id,
  title: googleList.title,
  updated: googleList.updated,
  selfLink: googleList.selfLink,
  etag: googleList.etag,
});

export const useTaskStore = create<TaskState>()((set, get) => ({
    taskLists: [],
    tasks: new Map(),
    loading: false,
    loadingLists: new Set(),
    error: null,
    lastSync: new Map(),

    /**
     * Fetches all task lists from Google Tasks API
     */
    fetchTaskLists: async () => {
      logger.log('[TaskStore] Fetching task lists...');
      set({ loading: true, error: null });

      try {
        const response = await window.electronAPI.getTaskLists();

        if (response.success && Array.isArray(response.data)) {
          const taskLists = response.data.map(convertGoogleTaskListToTaskList);
          set({ taskLists, loading: false });
        } else {
          const errorMsg = response.error || 'Failed to fetch task lists';
          logger.error('[TaskStore] Failed to fetch task lists:', errorMsg);
          useUIStore.getState().addNotification('error', errorMsg);
          set({
            taskLists: [],
            loading: false,
            error: errorMsg
          });
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to fetch task lists';
        logger.error('[TaskStore] Fetch task lists error:', error);
        useUIStore.getState().addNotification('error', errorMsg);
        set({
          loading: false,
          error: errorMsg,
        });
      }
    },

    /**
     * Creates a new task list with optimistic update
     */
    createTaskList: async (title: string) => {
      logger.log('[TaskStore] Creating task list:', title);

      // Create temporary task list for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticList: TaskList = {
        id: tempId,
        title,
        updated: new Date().toISOString(),
      };

      // Optimistic update
      set((state) => ({
        taskLists: [...state.taskLists, optimisticList],
      }));

      try {
        const response = await window.electronAPI.createTaskList(title);
        logger.log('[TaskStore] Task list created:', response);

        if (response.success && response.data) {
          const createdList = convertGoogleTaskListToTaskList(response.data);

          // Replace optimistic task list with real one
          set((state) => {
            const index = state.taskLists.findIndex((l) => l.id === tempId);
            const updatedLists = [...state.taskLists];
            if (index !== -1) {
              updatedLists[index] = createdList;
            } else {
              updatedLists.push(createdList);
            }
            return { taskLists: updatedLists };
          });

          return createdList;
        } else {
          throw new Error(response.error || 'Failed to create task list');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to create task list';
        logger.error('[TaskStore] Create task list error:', error);
        useUIStore.getState().addNotification('error', errorMsg);

        // Rollback optimistic update
        set((state) => ({
          taskLists: state.taskLists.filter((l) => l.id !== tempId),
          error: errorMsg,
        }));
        return undefined;
      }
    },

    /**
     * Updates a task list (rename) with optimistic update
     */
    updateTaskList: async (listId: string, title: string) => {
      logger.log(`[TaskStore] Updating task list ${listId}:`, title);

      // Store original for rollback
      const originalLists = get().taskLists;
      const originalList = originalLists.find((l) => l.id === listId);

      if (!originalList) {
        logger.error(`[TaskStore] Task list ${listId} not found`);
        return;
      }

      // Optimistic update
      set((state) => {
        const index = state.taskLists.findIndex((l) => l.id === listId);
        if (index === -1) {
          return state;
        }
        const updatedLists = [...state.taskLists];
        updatedLists[index] = { ...updatedLists[index], title };
        return { taskLists: updatedLists };
      });

      try {
        const response = await window.electronAPI.updateTaskList(listId, title);
        logger.log('[TaskStore] Task list updated:', response);

        if (response.success && response.data) {
          const updatedList = convertGoogleTaskListToTaskList(response.data);

          // Update with server response
          set((state) => {
            const index = state.taskLists.findIndex((l) => l.id === listId);
            if (index === -1) {
              return state;
            }
            const updatedLists = [...state.taskLists];
            updatedLists[index] = updatedList;
            return { taskLists: updatedLists };
          });
        } else {
          throw new Error(response.error || 'Failed to update task list');
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Failed to update task list';
        logger.error('[TaskStore] Update task list error:', error);
        useUIStore.getState().addNotification('error', errorMsg);

        // Rollback to original
        set({
          taskLists: originalLists,
          error: errorMsg,
        });
      }
    },

    /**
     * Deletes a task list with optimistic update
     */
    deleteTaskList: async (listId: string) => {
      logger.log(`[TaskStore] Deleting task list ${listId}`);

      // Store original for rollback
      const originalLists = get().taskLists;
      const deletedList = originalLists.find((l) => l.id === listId);

      if (!deletedList) {
        logger.error(`[TaskStore] Task list ${listId} not found`);
        return;
      }

      // Optimistic update - remove list
      set((state) => ({
        taskLists: state.taskLists.filter((l) => l.id !== listId),
      }));

      // Also remove tasks for this list
      set((state) => {
        const newTasks = new Map(state.tasks);
        newTasks.delete(listId);
        return { tasks: newTasks };
      });

      try {
        const response = await window.electronAPI.deleteTaskList(listId);
        logger.log('[TaskStore] Task list deleted:', response);

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete task list');
        }
      } catch (error) {
        logger.error('[TaskStore] Delete task list error:', error);

        // Rollback - restore deleted list
        set({
          taskLists: originalLists,
          error:
            error instanceof Error ? error.message : 'Failed to delete task list',
        });

        // Re-fetch tasks for the restored list
        await get().fetchTasks(listId, true);
      }
    },

    /**
     * Fetches tasks for a specific list
     * @param forceRefresh - Skip cache and force refresh from API
     */
    fetchTasks: async (listId: string, forceRefresh = false) => {
      logger.log(`[TaskStore] Fetching tasks for list: ${listId}`);

      // Check if we recently synced this list (within last 30 seconds)
      const lastSync = get().lastSync.get(listId);
      if (!forceRefresh && lastSync && Date.now() - lastSync < 30000) {
        logger.log('[TaskStore] Using cached tasks (recent sync)');
        return;
      }

      set((state) => {
        const newLoadingLists = new Set(state.loadingLists);
        newLoadingLists.add(listId);
        return { loadingLists: newLoadingLists, error: null };
      });

      try {
        const response = await window.electronAPI.getTasks(listId);
        logger.log(`[TaskStore] Tasks response for ${listId}:`, response);

        if (response.success && Array.isArray(response.data)) {
          const tasks = response.data.map(convertGoogleTaskToTask);
          logger.log(`[TaskStore] Converted ${tasks.length} tasks for list ${listId}`);
          set((state) => {
            const newTasks = new Map(state.tasks);
            newTasks.set(listId, tasks);
            const newLoadingLists = new Set(state.loadingLists);
            newLoadingLists.delete(listId);
            const newLastSync = new Map(state.lastSync);
            newLastSync.set(listId, Date.now());
            return {
              tasks: newTasks,
              loadingLists: newLoadingLists,
              lastSync: newLastSync,
            };
          });
        } else {
          throw new Error(response.error || 'Failed to fetch tasks');
        }
      } catch (error) {
        logger.error(`[TaskStore] Fetch tasks error for ${listId}:`, error);
        set((state) => {
          const newLoadingLists = new Set(state.loadingLists);
          newLoadingLists.delete(listId);
          return {
            loadingLists: newLoadingLists,
            error:
              error instanceof Error ? error.message : 'Failed to fetch tasks',
          };
        });
      }
    },

    /**
     * Creates a new task with optimistic update
     */
    createTask: async (listId: string, task: Partial<Task>) => {
      logger.log(`[TaskStore] Creating task in list ${listId}:`, task);

      // Create temporary task for optimistic update
      const tempId = `temp-${Date.now()}`;
      const optimisticTask: Task = {
        id: tempId,
        title: task.title || 'New Task',
        status: task.status || 'needsAction',
        position: task.position || '0',
        updated: new Date().toISOString(),
        notes: task.notes,
        due: task.due,
        parent: task.parent,
        labels: task.labels || [],
      };

      // Optimistic update
      set((state) => {
        const currentTasks = state.tasks.get(listId) || [];
        const newTasks = new Map(state.tasks);
        newTasks.set(listId, [...currentTasks, optimisticTask]);
        return { tasks: newTasks };
      });

      try {
        const response = await window.electronAPI.createTask(listId, {
          title: task.title,
          notes: task.notes,
          status: task.status,
          due: task.due,
          parent: task.parent,
        });

        logger.log('[TaskStore] Task created:', response);

        if (response.success && response.data) {
          const createdTask = convertGoogleTaskToTask(response.data);
          createdTask.labels = task.labels; // Preserve local metadata

          // Replace optimistic task with real task
          set((state) => {
            const currentTasks = state.tasks.get(listId) || [];
            const index = currentTasks.findIndex((t) => t.id === tempId);
            const updatedTasks = [...currentTasks];
            if (index !== -1) {
              updatedTasks[index] = createdTask;
            } else {
              updatedTasks.push(createdTask);
            }
            const newTasks = new Map(state.tasks);
            newTasks.set(listId, updatedTasks);
            return { tasks: newTasks };
          });

          return createdTask;
        } else {
          throw new Error(response.error || 'Failed to create task');
        }
      } catch (error) {
        logger.error('[TaskStore] Create task error:', error);

        // Rollback optimistic update
        set((state) => {
          const currentTasks = state.tasks.get(listId) || [];
          const newTasks = new Map(state.tasks);
          newTasks.set(
            listId,
            currentTasks.filter((t) => t.id !== tempId)
          );
          return {
            tasks: newTasks,
            error:
              error instanceof Error ? error.message : 'Failed to create task',
          };
        });
        return undefined;
      }
    },

    /**
     * Updates a task with optimistic update
     */
    updateTask: async (
      listId: string,
      taskId: string,
      updates: Partial<Task>
    ) => {
      logger.log(`[TaskStore] Updating task ${taskId}:`, updates);

      // Store original task for rollback
      const originalTasks = get().tasks.get(listId) || [];
      const originalTask = originalTasks.find((t) => t.id === taskId);

      if (!originalTask) {
        logger.error(`[TaskStore] Task ${taskId} not found`);
        return;
      }

      // Separate local metadata from API fields
      const { labels, ...apiUpdates } = updates;
      const hasApiUpdates = Object.keys(apiUpdates).length > 0;

      // Optimistic update (includes both API fields and local metadata)
      set((state) => {
        const currentTasks = state.tasks.get(listId) || [];
        const index = currentTasks.findIndex((t) => t.id === taskId);
        if (index === -1) {
          return state;
        }
        const updatedTasks = [...currentTasks];
        updatedTasks[index] = { ...updatedTasks[index], ...updates };
        const newTasks = new Map(state.tasks);
        newTasks.set(listId, updatedTasks);
        return { tasks: newTasks };
      });

      // If there are no API updates, we're done (local metadata only)
      if (!hasApiUpdates) {
        logger.log('[TaskStore] Local metadata update only, skipping API call');
        return;
      }

      try {
        // Google Tasks API needs the complete task object, not just the changed fields
        // Merge the API updates with the original task
        const completeTaskUpdate = {
          title: originalTask.title,
          notes: originalTask.notes,
          status: originalTask.status,
          due: originalTask.due,
          completed: originalTask.completed,
          parent: originalTask.parent,
          position: originalTask.position,
          links: originalTask.links,
          // Apply the updates on top
          ...apiUpdates
        };

        // Send complete task to Google Tasks API
        const response = await window.electronAPI.updateTask(
          listId,
          taskId,
          completeTaskUpdate
        );
        logger.log('[TaskStore] Task updated:', response);

        if (response.success && response.data) {
          const updatedTask = convertGoogleTaskToTask(response.data);
          // Preserve local metadata from the updates or original task
          updatedTask.labels = labels || originalTask.labels;

          // Update with server response
          set((state) => {
            const currentTasks = state.tasks.get(listId) || [];
            const index = currentTasks.findIndex((t) => t.id === taskId);
            if (index === -1) {
              return state;
            }
            const updatedTasks = [...currentTasks];
            updatedTasks[index] = updatedTask;
            const newTasks = new Map(state.tasks);
            newTasks.set(listId, updatedTasks);
            return { tasks: newTasks };
          });
        } else {
          throw new Error(response.error || 'Failed to update task');
        }
      } catch (error) {
        logger.error('[TaskStore] Update task error:', error);

        // Rollback to original task
        set((state) => {
          const currentTasks = state.tasks.get(listId) || [];
          const index = currentTasks.findIndex((t) => t.id === taskId);
          if (index === -1) {
            return {
              error:
                error instanceof Error ? error.message : 'Failed to update task',
            };
          }
          const updatedTasks = [...currentTasks];
          updatedTasks[index] = originalTask;
          const newTasks = new Map(state.tasks);
          newTasks.set(listId, updatedTasks);
          return {
            tasks: newTasks,
            error:
              error instanceof Error ? error.message : 'Failed to update task',
          };
        });
      }
    },

    /**
     * Deletes a task with optimistic update
     */
    deleteTask: async (listId: string, taskId: string) => {
      logger.log(`[TaskStore] Deleting task ${taskId} from list ${listId}`);

      // Store original tasks for rollback
      const originalTasks = get().tasks.get(listId) || [];
      const deletedTask = originalTasks.find((t) => t.id === taskId);

      if (!deletedTask) {
        logger.error(`[TaskStore] Task ${taskId} not found`);
        return;
      }

      // Optimistic update - remove task
      set((state) => {
        const currentTasks = state.tasks.get(listId) || [];
        const newTasks = new Map(state.tasks);
        newTasks.set(
          listId,
          currentTasks.filter((t) => t.id !== taskId)
        );
        return { tasks: newTasks };
      });

      try {
        const response = await window.electronAPI.deleteTask(listId, taskId);
        logger.log('[TaskStore] Task deleted:', response);

        if (!response.success) {
          throw new Error(response.error || 'Failed to delete task');
        }
      } catch (error) {
        logger.error('[TaskStore] Delete task error:', error);

        // Rollback - restore deleted task
        set((state) => {
          const currentTasks = state.tasks.get(listId) || [];
          const newTasks = new Map(state.tasks);
          newTasks.set(listId, [...currentTasks, deletedTask]);
          return {
            tasks: newTasks,
            error:
              error instanceof Error ? error.message : 'Failed to delete task',
          };
        });
      }
    },

    /**
     * Moves a task (reorder or change parent)
     */
    moveTask: async (
      listId: string,
      taskId: string,
      data: { parent?: string; previous?: string; destinationList?: string }
    ) => {
      logger.log(`[TaskStore] Moving task ${taskId}:`, data);

      try {
        // Moving to a different list requires delete + create
        if (data.destinationList && data.destinationList !== listId) {
          logger.log('[TaskStore] Moving task to different list');

          // Get the task to copy its data
          const task = get().getTaskById(listId, taskId);
          if (!task) {
            throw new Error('Task not found');
          }

          // Preserve local metadata (labels/priority) across the new task ID
          const existingLabels = useLabelStore.getState().getTaskLabels(taskId);
          const existingPriority = useLabelStore.getState().getTaskPriority(taskId);

          // Create in destination list
          const newTask = await get().createTask(data.destinationList, {
            title: task.title,
            notes: task.notes,
            status: task.status,
            due: task.due,
            labels: existingLabels,
          });

          // Delete from source list
          if (newTask) {
            // Migrate local metadata to the new task ID, then clear old
            if (existingLabels.length > 0) {
              useLabelStore.getState().setTaskLabels(newTask.id, existingLabels);
            }
            if (existingPriority) {
              useLabelStore.getState().setTaskPriority(newTask.id, existingPriority);
            }
            useLabelStore.getState().clearTaskLabels(taskId);
            useLabelStore.getState().clearTaskPriority(taskId);

            await get().deleteTask(listId, taskId);
          }

          if (!newTask) {
            throw new Error('Failed to move task');
          }

          // Refresh both lists
          await get().fetchTasks(listId, true);
          await get().fetchTasks(data.destinationList, true);

          return { destinationListId: data.destinationList, destinationTaskId: newTask.id };
        } else {
          // Moving within same list - use API moveTask
          const response = await window.electronAPI.moveTask(listId, taskId, data);
          logger.log('[TaskStore] Task moved within list:', response);

          if (!response.success) {
            throw new Error(response.error || 'Failed to move task');
          }

          // Refresh the list
          await get().fetchTasks(listId, true);
          return { destinationListId: listId, destinationTaskId: taskId };
        }
      } catch (error) {
        logger.error('[TaskStore] Move task error:', error);
        set({
          error:
            error instanceof Error ? error.message : 'Failed to move task',
        });
        throw error;
      }
    },

    /**
     * Toggles task status between completed and needsAction
     */
    toggleTaskStatus: async (listId: string, taskId: string) => {
      logger.log(`[TaskStore] Toggling status for task ${taskId}`);

      const task = get().getTaskById(listId, taskId);
      if (!task) {
        logger.error(`[TaskStore] Task ${taskId} not found`);
        return;
      }

      const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';

      // Send the entire task object with status changed to prevent data loss
      const updates: Partial<Task> = {
        title: task.title,
        notes: task.notes,
        status: newStatus,
        due: task.due,
        completed: newStatus === 'completed' ? new Date().toISOString() : undefined,
        parent: task.parent,
        position: task.position,
      };

      await get().updateTask(listId, taskId, updates);
    },

    /**
     * Clears error state
     */
    clearError: () => {
      set({ error: null });
    },

    /**
     * Syncs all data from Google Tasks API
     * Forces a complete refresh of task lists and all tasks
     */
    syncAll: async () => {
      logger.log('[TaskStore] Starting full sync...');
      set({ loading: true, error: null });

      try {
        // Fetch task lists
        await get().fetchTaskLists();

        // Get all list IDs and force refresh each one
        const listIds = get().taskLists.map(list => list.id);
        logger.log(`[TaskStore] Syncing ${listIds.length} task lists`);

        // Fetch all tasks in parallel
        await Promise.all(
          listIds.map(listId => get().fetchTasks(listId, true))
        );

        logger.log('[TaskStore] Full sync completed');
        set({ loading: false });
      } catch (error) {
        logger.error('[TaskStore] Sync error:', error);
        set({
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to sync',
        });
      }
    },

    /**
     * Gets a task by ID from a specific list
     */
    getTaskById: (listId: string, taskId: string) => {
      const tasks = get().tasks.get(listId) || [];
      return tasks.find((t) => t.id === taskId);
    },

    /**
     * Gets all tasks for a specific list
     */
    getTasksByList: (listId: string) => {
      return get().tasks.get(listId) || [];
    },

    /**
     * Finds which list a task belongs to
     */
    findTaskListId: (taskId: string) => {
      const allTasks = get().tasks;
      for (const [listId, tasks] of allTasks.entries()) {
        if (tasks.some((t) => t.id === taskId)) {
          return listId;
        }
      }
      return undefined;
    },

    /**
     * Bulk updates multiple tasks
     * Handles due dates, labels, and moving between lists
     */
    bulkUpdateTasks: async (
      taskIds: string[],
      updates: {
        dueDate?: string | null;
        listId?: string;
        labelIds?: string[];
      }
    ) => {
      logger.log(`[TaskStore] Bulk updating ${taskIds.length} tasks:`, updates);

      const promises: Promise<void>[] = [];

      for (const taskId of taskIds) {
        // Find which list this task is currently in
        const currentListId = get().findTaskListId(taskId);
        if (!currentListId) {
          logger.error(`[TaskStore] Task ${taskId} not found in any list`);
          continue;
        }

        const task = get().getTaskById(currentListId, taskId);
        if (!task) {
          continue;
        }

        const willMove = !!updates.listId && updates.listId !== currentListId;

        // Build the update object
        const taskUpdates: Partial<Task> = {};

        // Update due date if specified
        if (updates.dueDate !== undefined) {
          taskUpdates.due = updates.dueDate || undefined;
        }

        // Update labels if specified - MERGE with existing labels
        let mergedLabels: string[] | undefined;
        if (updates.labelIds && updates.labelIds.length > 0) {
          const currentLabels = useLabelStore.getState().getTaskLabels(taskId);
          // Merge new labels with existing ones (deduplicate)
          mergedLabels = [...new Set([...currentLabels, ...updates.labelIds])];
          taskUpdates.labels = mergedLabels;

          // If not moving lists, update labelStore immediately (it's persisted to localStorage).
          // If moving lists, the task ID changes; we'll apply labels to the NEW ID after move.
          if (!willMove) {
            useLabelStore.getState().setTaskLabels(taskId, mergedLabels);
          }
        }

        // If moving to a different list
        if (willMove) {
          promises.push(
            (async () => {
              // Move task to new list
              const moved = await get().moveTask(currentListId, taskId, {
                destinationList: updates.listId,
              });

              // Then update the task with other changes if any
              if (Object.keys(taskUpdates).length > 0) {
                // Wait a bit for the move to complete
                await new Promise(resolve => setTimeout(resolve, 100));
                await get().updateTask(moved.destinationListId, moved.destinationTaskId, taskUpdates);
              }

              // Re-apply merged labels to the new task ID (if applicable)
              if (mergedLabels) {
                useLabelStore.getState().setTaskLabels(moved.destinationTaskId, mergedLabels);
              }
            })()
          );
        } else if (Object.keys(taskUpdates).length > 0) {
          // Update in current list - updateTask handles API vs local metadata separation
          promises.push(get().updateTask(currentListId, taskId, taskUpdates));
        }
      }

      try {
        await Promise.all(promises);
        logger.log('[TaskStore] Bulk update completed');
        useUIStore.getState().addNotification('success', `Updated ${taskIds.length} tasks`);
      } catch (error) {
        logger.error('[TaskStore] Bulk update error:', error);
        useUIStore.getState().addNotification('error', 'Failed to update some tasks');
      }
    },
  })
);
