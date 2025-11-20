/**
 * Keyboard Shortcuts Hook
 * Handles global keyboard shortcuts for the app
 */

import { useEffect } from 'react';
import { useSelectionStore } from '../stores/selectionStore';
import { useTaskStore } from '../stores/taskStore';
import { useBoardStore } from '../stores/boardStore';
import { useUIStore } from '../stores/uiStore';

export function useKeyboardShortcuts() {
  const { selectAll, clearSelection, isSelectionMode } = useSelectionStore();
  const { tasks } = useTaskStore();
  const { getCurrentBoard } = useBoardStore();
  const { viewMode } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+A (Mac) or Ctrl+A (Windows/Linux) - Select all visible tasks
      if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
        e.preventDefault();

        // Get all visible task IDs
        const visibleTaskIds: string[] = [];

        if (viewMode === 'board') {
          // In board view, get tasks from lists in active board
          const currentBoard = getCurrentBoard();
          if (currentBoard && currentBoard.lists) {
            for (const listId of currentBoard.lists) {
              const listTasks = tasks.get(listId) || [];
              visibleTaskIds.push(...listTasks.map(t => t.id));
            }
          }
        } else if (viewMode === 'list') {
          // In list view, get all tasks from all lists
          for (const listTasks of tasks.values()) {
            visibleTaskIds.push(...listTasks.map(t => t.id));
          }
        }

        if (visibleTaskIds.length > 0) {
          selectAll(visibleTaskIds);
        }
      }

      // Escape - Clear selection and exit selection mode
      if (e.key === 'Escape' && isSelectionMode) {
        e.preventDefault();
        clearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectAll, clearSelection, isSelectionMode, tasks, getCurrentBoard, viewMode]);
}
