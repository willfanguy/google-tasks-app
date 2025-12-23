import { contextBridge, ipcRenderer } from 'electron';
import type {
  AuthResponse,
  AuthStatusResponse,
  CheckAuthResponse,
  CreateTaskListResponse,
  CreateTaskResponse,
  DeleteStoreResponse,
  DeleteTaskListResponse,
  DeleteTaskResponse,
  GetStoreResponse,
  GetTaskListsResponse,
  GetTasksResponse,
  MoveTaskData,
  MoveTaskResponse,
  SetStoreResponse,
  TaskData,
  UpdateTaskListResponse,
  UpdateTaskResponse,
} from '../src/types/ipc';

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
const api = {
  // Auth
  googleAuth: (): Promise<AuthResponse> => ipcRenderer.invoke('google-auth'),
  checkAuth: (): Promise<CheckAuthResponse> => ipcRenderer.invoke('check-auth'),
  logout: (): Promise<AuthResponse> => ipcRenderer.invoke('logout'),
  getAuthStatus: (): Promise<AuthStatusResponse> => ipcRenderer.invoke('get-auth-status'),

  // Tasks
  getTasks: (taskListId: string): Promise<GetTasksResponse> =>
    ipcRenderer.invoke('get-tasks', taskListId),
  getTaskLists: (): Promise<GetTaskListsResponse> => ipcRenderer.invoke('get-task-lists'),
  createTask: (taskListId: string, task: TaskData): Promise<CreateTaskResponse> =>
    ipcRenderer.invoke('create-task', taskListId, task),
  updateTask: (taskListId: string, taskId: string, task: TaskData): Promise<UpdateTaskResponse> =>
    ipcRenderer.invoke('update-task', taskListId, taskId, task),
  deleteTask: (taskListId: string, taskId: string): Promise<DeleteTaskResponse> =>
    ipcRenderer.invoke('delete-task', taskListId, taskId),
  moveTask: (taskListId: string, taskId: string, data: MoveTaskData): Promise<MoveTaskResponse> =>
    ipcRenderer.invoke('move-task', taskListId, taskId, data),

  // Task Lists
  createTaskList: (title: string): Promise<CreateTaskListResponse> =>
    ipcRenderer.invoke('create-task-list', title),
  updateTaskList: (taskListId: string, title: string): Promise<UpdateTaskListResponse> =>
    ipcRenderer.invoke('update-task-list', taskListId, title),
  deleteTaskList: (taskListId: string): Promise<DeleteTaskListResponse> =>
    ipcRenderer.invoke('delete-task-list', taskListId),

  // Storage
  getStore: <T = unknown>(key: string): Promise<GetStoreResponse<T>> =>
    ipcRenderer.invoke('get-store', key),
  setStore: (key: string, value: unknown): Promise<SetStoreResponse> =>
    ipcRenderer.invoke('set-store', key, value),
  deleteStore: (key: string): Promise<DeleteStoreResponse> => ipcRenderer.invoke('delete-store', key),
};

// Expose the API in both electronAPI and electron namespaces
contextBridge.exposeInMainWorld('electronAPI', api);
contextBridge.exposeInMainWorld('electron', api);
