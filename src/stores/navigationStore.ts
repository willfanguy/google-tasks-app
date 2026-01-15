/**
 * Navigation Store
 * Manages keyboard navigation focus state (separate from selection)
 */

import { create } from 'zustand';
import { useTaskStore } from './taskStore';
import { useFilterStore } from './filterStore';
import { useBoardStore } from './boardStore';
import { useUIStore } from './uiStore';

interface NavigationState {
  focusedTaskId: string | null;
  focusedListId: string | null;

  // Actions
  setFocusedTask: (taskId: string | null, listId: string | null) => void;
  clearFocus: () => void;
  moveFocusUp: () => void;
  moveFocusDown: () => void;
  moveFocusToFirst: () => void;
  moveFocusToLast: () => void;

  // Helpers
  getFocusableTaskIds: () => { taskId: string; listId: string }[];
}

export const useNavigationStore = create<NavigationState>()((set, get) => ({
  focusedTaskId: null,
  focusedListId: null,

  /**
   * Set the currently focused task
   */
  setFocusedTask: (taskId: string | null, listId: string | null) => {
    set({ focusedTaskId: taskId, focusedListId: listId });
  },

  /**
   * Clear the current focus
   */
  clearFocus: () => {
    set({ focusedTaskId: null, focusedListId: null });
  },

  /**
   * Get all focusable tasks in order (respects current view and filters)
   */
  getFocusableTaskIds: () => {
    const { tasks } = useTaskStore.getState();
    const { viewMode } = useUIStore.getState();
    const { getCurrentBoard } = useBoardStore.getState();
    const { getFilteredAndSortedTasks } = useFilterStore.getState();

    const focusableTasks: { taskId: string; listId: string }[] = [];

    if (viewMode === 'board') {
      // In board view, get tasks from lists in active board
      const currentBoard = getCurrentBoard();
      if (currentBoard && currentBoard.lists) {
        for (const listId of currentBoard.lists) {
          const listTasks = tasks.get(listId) || [];
          const filtered = getFilteredAndSortedTasks(listTasks);
          for (const task of filtered) {
            focusableTasks.push({ taskId: task.id, listId });
          }
        }
      }
    } else {
      // In list view, get all tasks from all lists
      for (const [listId, listTasks] of tasks.entries()) {
        const filtered = getFilteredAndSortedTasks(listTasks);
        for (const task of filtered) {
          focusableTasks.push({ taskId: task.id, listId });
        }
      }
    }

    return focusableTasks;
  },

  /**
   * Move focus to the previous task
   */
  moveFocusUp: () => {
    const { focusedTaskId } = get();
    const focusableTasks = get().getFocusableTaskIds();

    if (focusableTasks.length === 0) return;

    if (!focusedTaskId) {
      // If nothing focused, focus the last task
      const last = focusableTasks[focusableTasks.length - 1];
      set({ focusedTaskId: last.taskId, focusedListId: last.listId });
      return;
    }

    const currentIndex = focusableTasks.findIndex(t => t.taskId === focusedTaskId);
    if (currentIndex === -1) {
      // Current focus not in list, focus first
      const first = focusableTasks[0];
      set({ focusedTaskId: first.taskId, focusedListId: first.listId });
      return;
    }

    // Move to previous, or wrap to last
    const newIndex = currentIndex > 0 ? currentIndex - 1 : focusableTasks.length - 1;
    const newFocus = focusableTasks[newIndex];
    set({ focusedTaskId: newFocus.taskId, focusedListId: newFocus.listId });
  },

  /**
   * Move focus to the next task
   */
  moveFocusDown: () => {
    const { focusedTaskId } = get();
    const focusableTasks = get().getFocusableTaskIds();

    if (focusableTasks.length === 0) return;

    if (!focusedTaskId) {
      // If nothing focused, focus the first task
      const first = focusableTasks[0];
      set({ focusedTaskId: first.taskId, focusedListId: first.listId });
      return;
    }

    const currentIndex = focusableTasks.findIndex(t => t.taskId === focusedTaskId);
    if (currentIndex === -1) {
      // Current focus not in list, focus first
      const first = focusableTasks[0];
      set({ focusedTaskId: first.taskId, focusedListId: first.listId });
      return;
    }

    // Move to next, or wrap to first
    const newIndex = currentIndex < focusableTasks.length - 1 ? currentIndex + 1 : 0;
    const newFocus = focusableTasks[newIndex];
    set({ focusedTaskId: newFocus.taskId, focusedListId: newFocus.listId });
  },

  /**
   * Move focus to the first task
   */
  moveFocusToFirst: () => {
    const focusableTasks = get().getFocusableTaskIds();
    if (focusableTasks.length === 0) return;

    const first = focusableTasks[0];
    set({ focusedTaskId: first.taskId, focusedListId: first.listId });
  },

  /**
   * Move focus to the last task
   */
  moveFocusToLast: () => {
    const focusableTasks = get().getFocusableTaskIds();
    if (focusableTasks.length === 0) return;

    const last = focusableTasks[focusableTasks.length - 1];
    set({ focusedTaskId: last.taskId, focusedListId: last.listId });
  },
}));
