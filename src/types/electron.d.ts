// Type definitions for Electron API exposed to renderer process

import {
  AuthResponse,
  AuthStatusResponse,
  CheckAuthResponse,
  GetTaskListsResponse,
  GetTasksResponse,
  CreateTaskResponse,
  UpdateTaskResponse,
  DeleteTaskResponse,
  MoveTaskResponse,
  CreateTaskListResponse,
  UpdateTaskListResponse,
  DeleteTaskListResponse,
  GetStoreResponse,
  SetStoreResponse,
  DeleteStoreResponse,
  TaskData,
  MoveTaskData,
} from './ipc';

export interface ElectronAPI {
  // Auth methods
  googleAuth: () => Promise<AuthResponse>;
  checkAuth: () => Promise<CheckAuthResponse>;
  logout: () => Promise<AuthResponse>;
  getAuthStatus: () => Promise<AuthStatusResponse>;

  // Task methods
  getTasks: (taskListId: string) => Promise<GetTasksResponse>;
  getTaskLists: () => Promise<GetTaskListsResponse>;
  createTask: (taskListId: string, task: TaskData) => Promise<CreateTaskResponse>;
  updateTask: (taskListId: string, taskId: string, task: TaskData) => Promise<UpdateTaskResponse>;
  deleteTask: (taskListId: string, taskId: string) => Promise<DeleteTaskResponse>;
  moveTask: (taskListId: string, taskId: string, data: MoveTaskData) => Promise<MoveTaskResponse>;

  // Task List methods
  createTaskList: (title: string) => Promise<CreateTaskListResponse>;
  updateTaskList: (taskListId: string, title: string) => Promise<UpdateTaskListResponse>;
  deleteTaskList: (taskListId: string) => Promise<DeleteTaskListResponse>;

  // Storage methods
  getStore: <T = unknown>(key: string) => Promise<GetStoreResponse<T>>;
  setStore: (key: string, value: unknown) => Promise<SetStoreResponse>;
  deleteStore: (key: string) => Promise<DeleteStoreResponse>;

  // Quick Add window methods
  quickAddHide: () => Promise<{ success: boolean; error?: string }>;
  quickAddShow: () => Promise<{ success: boolean; error?: string }>;
  quickAddToggle: () => Promise<{ success: boolean; error?: string }>;
}

declare global {
  interface Window {
    electronAPI: ElectronAPI;
    electron: ElectronAPI; // Alias for convenience
  }
}

export {};
