/**
 * IPC Type Definitions
 * Structured response types for all IPC communications
 */

import { GoogleTask, GoogleTaskList } from './api';

// Base IPC response structure
export interface IPCResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

// Auth responses
export interface AuthResponse {
  success: boolean;
  authenticated: boolean;
  message?: string;
  error?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
  email?: string;
  expiresAt?: number;
  error?: string;
}

export interface CheckAuthResponse {
  authenticated: boolean;
  error?: string;
}

// Task responses
export type GetTaskListsResponse = IPCResponse<GoogleTaskList[]>;
export type GetTasksResponse = IPCResponse<GoogleTask[]>;
export type CreateTaskResponse = IPCResponse<GoogleTask>;
export type UpdateTaskResponse = IPCResponse<GoogleTask>;
export type DeleteTaskResponse = IPCResponse<void>;
export type MoveTaskResponse = IPCResponse<GoogleTask>;

// Task List responses
export type CreateTaskListResponse = IPCResponse<GoogleTaskList>;
export type UpdateTaskListResponse = IPCResponse<GoogleTaskList>;
export type DeleteTaskListResponse = IPCResponse<void>;

// Storage responses
export type GetStoreResponse<T = unknown> = IPCResponse<T>;
export type SetStoreResponse = IPCResponse<void>;
export type DeleteStoreResponse = IPCResponse<void>;

// Task creation/update data
export interface TaskData {
  title?: string;
  notes?: string;
  status?: 'needsAction' | 'completed';
  due?: string;
  parent?: string;
  position?: string;
}

// Task move data
export interface MoveTaskData {
  parent?: string;
  previous?: string;
}

// External sync types (from ~/.google-tasks-sync/metadata.json)
export interface SyncTaskMetadata {
  jiraKey?: string;
  jiraStatus?: string;
  jiraType?: string;
  sprint?: string;
  labels?: string[];
  dueDate?: string;
  lastSynced?: string;
}

export interface SyncData {
  lastSync: string | null;
  tasks: Record<string, SyncTaskMetadata>;
}

export type SyncDataResponse = IPCResponse<SyncData>;
export type SyncFilePathResponse = IPCResponse<string>;
