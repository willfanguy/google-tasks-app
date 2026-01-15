/**
 * Store Exports
 * Central export file for all Zustand stores
 */

export { useAuthStore } from './authStore';
export { useTaskStore } from './taskStore';
export { useBoardStore } from './boardStore';
export { useFilterStore } from './filterStore';
export { useLabelStore } from './labelStore';
export { useUIStore } from './uiStore';
export { useSelectionStore } from './selectionStore';
export { useNavigationStore } from './navigationStore';

// Re-export types for convenience
export type { Task, TaskList, SortOption } from '../types/task';
export type { Board, BoardLayout } from '../types/board';
export type { Label, LabelColor } from '../types/label';
export type { ActiveFilters, FilterPreset } from '../types/filter';
