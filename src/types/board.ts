/**
 * Board and UI state models
 */

export interface Board {
  id: string;
  name: string;
  lists: string[]; // TaskList IDs
  backgroundImage?: string;
  backgroundColor?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BoardLayout {
  boardId: string;
  listOrder: string[]; // Order of list IDs
  collapsedLists: string[]; // List IDs that are collapsed
  viewMode: 'board' | 'list' | 'calendar';
}
