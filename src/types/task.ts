/**
 * Core task data models based on Google Tasks API
 */

export interface Task {
  id: string;
  title: string;
  notes?: string;
  status: 'needsAction' | 'completed';
  due?: string; // RFC 3339 timestamp
  completed?: string; // RFC 3339 timestamp
  parent?: string; // Parent task ID for subtasks
  position: string; // String indicating position in list
  links?: TaskLink[];
  updated: string; // RFC 3339 timestamp
  selfLink?: string;
  etag?: string;

  // Local metadata (not synced to Google Tasks)
  labels?: string[]; // Label IDs
  localOrder?: number; // Local ordering
  listId?: string; // List ID (enriched in unified view)
  listTitle?: string; // List title (enriched in unified view)
}

export interface TaskLink {
  type: string;
  description: string;
  link: string;
}

export interface TaskList {
  id: string;
  title: string;
  updated: string; // RFC 3339 timestamp
  selfLink?: string;
  etag?: string;

  // Local metadata
  color?: string; // Highlight color
  order?: number; // Display order
}

export interface SubTask extends Task {
  parent: string; // Always has a parent
}

export type TaskStatus = 'needsAction' | 'completed';

export interface TaskFilter {
  searchQuery?: string;
  labels?: string[];
  status?: TaskStatus;
  dueDateRange?: {
    start?: Date;
    end?: Date;
  };
  hasNotes?: boolean;
  hasSubtasks?: boolean;
}

export type SortOption =
  | 'manual'
  | 'dueDate-asc'
  | 'dueDate-desc'
  | 'title-asc'
  | 'title-desc'
  | 'status'
  | 'created-asc'
  | 'created-desc'
  | 'list-asc'
  | 'list-desc';

export interface TaskView {
  id: string;
  name: string;
  filter: TaskFilter;
  sort: SortOption;
}
