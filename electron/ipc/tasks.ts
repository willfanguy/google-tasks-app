import { ipcMain } from 'electron';
import { getAuthenticatedClient } from '../utils/auth';
import { google } from 'googleapis';
import { logger } from '../utils/logger';

// Helper to get the Tasks API client
async function getTasksClient() {
  const auth = await getAuthenticatedClient();
  return google.tasks({ version: 'v1', auth });
}

export const setupTaskHandlers = () => {
  /**
   * Get all task lists
   */
  ipcMain.handle('get-task-lists', async () => {
    try {
      logger.log('[IPC] get-task-lists: Fetching task lists');

      const tasks = await getTasksClient();
      const response = await tasks.tasklists.list();

      logger.log('[IPC] get-task-lists: Found', response.data.items?.length || 0, 'task lists');

      return { success: true, data: response.data.items || [] };
    } catch (error) {
      logger.error('[IPC] get-task-lists: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch task lists' };
    }
  });

  /**
   * Get tasks from a specific task list
   */
  ipcMain.handle('get-tasks', async (_event, taskListId: string) => {
    try {
      logger.log('[IPC] get-tasks: Fetching tasks for list:', taskListId);

      const tasks = await getTasksClient();
      const response = await tasks.tasks.list({
        tasklist: taskListId,
        showCompleted: true,
        showHidden: true,
      });

      logger.log('[IPC] get-tasks: Found', response.data.items?.length || 0, 'tasks');

      return { success: true, data: response.data.items || [] };
    } catch (error) {
      logger.error('[IPC] get-tasks: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to fetch tasks' };
    }
  });

  /**
   * Create a new task
   */
  ipcMain.handle('create-task', async (_event, taskListId: string, task: {
    title?: string;
    notes?: string;
    status?: string;
    due?: string;
    parent?: string;
  }) => {
    try {
      logger.log('[IPC] create-task: Creating task in list:', taskListId, task.parent ? `with parent: ${task.parent}` : '');

      const tasks = await getTasksClient();

      // Extract parent from task object - it needs to be a parameter, not in requestBody
      const { parent, ...taskData } = task;

      const response = await tasks.tasks.insert({
        tasklist: taskListId,
        parent: parent, // Pass parent as a parameter
        requestBody: taskData, // Don't include parent in requestBody
      });

      logger.log('[IPC] create-task: Task created with ID:', response.data.id);

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('[IPC] create-task: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create task' };
    }
  });

  /**
   * Update an existing task
   */
  ipcMain.handle('update-task', async (_event, taskListId: string, taskId: string, task: {
    title?: string;
    notes?: string;
    status?: string;
    due?: string;
    completed?: string;
    parent?: string;
    position?: string;
  }) => {
    try {
      logger.log('[IPC] update-task: Updating task:', taskId);

      const tasks = await getTasksClient();
      const response = await tasks.tasks.update({
        tasklist: taskListId,
        task: taskId,
        requestBody: {
          ...task,
          id: taskId, // API requires id in the body
        },
      });

      logger.log('[IPC] update-task: Task updated successfully');

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('[IPC] update-task: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update task' };
    }
  });

  /**
   * Delete a task
   */
  ipcMain.handle('delete-task', async (_event, taskListId: string, taskId: string) => {
    try {
      logger.log('[IPC] delete-task: Deleting task:', taskId);

      const tasks = await getTasksClient();
      await tasks.tasks.delete({
        tasklist: taskListId,
        task: taskId,
      });

      logger.log('[IPC] delete-task: Task deleted successfully');

      return { success: true };
    } catch (error) {
      logger.error('[IPC] delete-task: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task' };
    }
  });

  /**
   * Move a task (change position or parent)
   */
  ipcMain.handle('move-task', async (_event, taskListId: string, taskId: string, data: {
    parent?: string;
    previous?: string;
  }) => {
    try {
      logger.log('[IPC] move-task: Moving task:', taskId);

      const tasks = await getTasksClient();
      const response = await tasks.tasks.move({
        tasklist: taskListId,
        task: taskId,
        parent: data.parent,
        previous: data.previous,
      });

      logger.log('[IPC] move-task: Task moved successfully');

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('[IPC] move-task: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to move task' };
    }
  });

  /**
   * Create a new task list
   */
  ipcMain.handle('create-task-list', async (_event, title: string) => {
    try {
      logger.log('[IPC] create-task-list: Creating task list:', title);

      const tasks = await getTasksClient();
      const response = await tasks.tasklists.insert({
        requestBody: {
          title,
        },
      });

      logger.log('[IPC] create-task-list: Task list created with ID:', response.data.id);

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('[IPC] create-task-list: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to create task list' };
    }
  });

  /**
   * Update a task list (rename)
   */
  ipcMain.handle('update-task-list', async (_event, taskListId: string, title: string) => {
    try {
      logger.log('[IPC] update-task-list: Updating task list:', taskListId);

      const tasks = await getTasksClient();
      const response = await tasks.tasklists.update({
        tasklist: taskListId,
        requestBody: {
          id: taskListId,
          title,
        },
      });

      logger.log('[IPC] update-task-list: Task list updated successfully');

      return { success: true, data: response.data };
    } catch (error) {
      logger.error('[IPC] update-task-list: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to update task list' };
    }
  });

  /**
   * Delete a task list
   */
  ipcMain.handle('delete-task-list', async (_event, taskListId: string) => {
    try {
      logger.log('[IPC] delete-task-list: Deleting task list:', taskListId);

      const tasks = await getTasksClient();
      await tasks.tasklists.delete({
        tasklist: taskListId,
      });

      logger.log('[IPC] delete-task-list: Task list deleted successfully');

      return { success: true };
    } catch (error) {
      logger.error('[IPC] delete-task-list: Error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Failed to delete task list' };
    }
  });

  logger.log('[IPC] Task handlers registered successfully');
};
