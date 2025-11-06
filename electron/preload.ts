import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
  // Auth
  googleAuth: () => ipcRenderer.invoke('google-auth'),
  checkAuth: () => ipcRenderer.invoke('check-auth'),
  logout: () => ipcRenderer.invoke('logout'),
  getAuthStatus: () => ipcRenderer.invoke('get-auth-status'),

  // Tasks
  getTasks: (taskListId: string) => ipcRenderer.invoke('get-tasks', taskListId),
  getTaskLists: () => ipcRenderer.invoke('get-task-lists'),
  createTask: (taskListId: string, task: unknown) => ipcRenderer.invoke('create-task', taskListId, task),
  updateTask: (taskListId: string, taskId: string, task: unknown) =>
    ipcRenderer.invoke('update-task', taskListId, taskId, task),
  deleteTask: (taskListId: string, taskId: string) =>
    ipcRenderer.invoke('delete-task', taskListId, taskId),
  moveTask: (taskListId: string, taskId: string, data: unknown) =>
    ipcRenderer.invoke('move-task', taskListId, taskId, data),

  // Task Lists
  createTaskList: (title: string) => ipcRenderer.invoke('create-task-list', title),
  updateTaskList: (taskListId: string, title: string) =>
    ipcRenderer.invoke('update-task-list', taskListId, title),
  deleteTaskList: (taskListId: string) => ipcRenderer.invoke('delete-task-list', taskListId),

  // Storage
  getStore: (key: string) => ipcRenderer.invoke('get-store', key),
  setStore: (key: string, value: unknown) => ipcRenderer.invoke('set-store', key, value),
  deleteStore: (key: string) => ipcRenderer.invoke('delete-store', key),
};

// Expose the API in both electronAPI and electron namespaces
contextBridge.exposeInMainWorld('electronAPI', api);
contextBridge.exposeInMainWorld('electron', api);

// TypeScript type definitions for the exposed API
// Note: These match the types defined in src/types/electron.d.ts
export interface ElectronAPI {
  // Auth methods
  googleAuth: () => Promise<{
    success: boolean;
    authenticated: boolean;
    message?: string;
    error?: string;
  }>;
  checkAuth: () => Promise<{
    authenticated: boolean;
    error?: string;
  }>;
  logout: () => Promise<{
    success: boolean;
    message?: string;
    error?: string;
  }>;
  getAuthStatus: () => Promise<{
    authenticated: boolean;
    email?: string;
    expiresAt?: number;
    error?: string;
  }>;

  // Task methods
  getTasks: (taskListId: string) => Promise<unknown>;
  getTaskLists: () => Promise<unknown>;
  createTask: (taskListId: string, task: unknown) => Promise<unknown>;
  updateTask: (taskListId: string, taskId: string, task: unknown) => Promise<unknown>;
  deleteTask: (taskListId: string, taskId: string) => Promise<unknown>;
  moveTask: (taskListId: string, taskId: string, data: unknown) => Promise<unknown>;

  // Task List methods
  createTaskList: (title: string) => Promise<unknown>;
  updateTaskList: (taskListId: string, title: string) => Promise<unknown>;
  deleteTaskList: (taskListId: string) => Promise<unknown>;

  // Storage methods
  getStore: (key: string) => Promise<unknown>;
  setStore: (key: string, value: unknown) => Promise<void>;
  deleteStore: (key: string) => Promise<void>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: ElectronAPI; // Add alias for convenience
  }
}
