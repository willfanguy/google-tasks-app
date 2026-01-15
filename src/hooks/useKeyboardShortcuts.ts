/**
 * Keyboard Shortcuts Hook
 * Handles global keyboard shortcuts for the app
 */

import { useEffect } from 'react';
import { useSelectionStore } from '../stores/selectionStore';
import { useTaskStore } from '../stores/taskStore';
import { useBoardStore } from '../stores/boardStore';
import { useUIStore } from '../stores/uiStore';
import { useNavigationStore } from '../stores/navigationStore';
import { useFilterStore } from '../stores/filterStore';

/**
 * Check if user is currently typing in an input field
 */
function isTypingInInput(): boolean {
  const activeElement = document.activeElement;
  if (!activeElement) return false;

  const tagName = activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }

  // Also check for contenteditable elements
  if (activeElement.getAttribute('contenteditable') === 'true') {
    return true;
  }

  return false;
}

export function useKeyboardShortcuts() {
  const { selectAll, clearSelection, isSelectionMode, selectedTaskIds } = useSelectionStore();
  const { tasks, toggleTaskStatus, deleteTask } = useTaskStore();
  const { getCurrentBoard } = useBoardStore();
  const { viewMode, modals, openQuickAdd, openTaskDetail, openKeyboardHelp, closeAllModals } = useUIStore();
  const { focusedTaskId, focusedListId, moveFocusUp, moveFocusDown, moveFocusToFirst, moveFocusToLast, clearFocus } = useNavigationStore();
  const { applyPreset } = useFilterStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any modal is open (except filter panel which doesn't block interaction)
      const isModalOpen =
        modals.taskDetail ||
        modals.createTask ||
        modals.quickAdd ||
        modals.createLabel ||
        modals.labelManager ||
        modals.settings ||
        modals.keyboardHelp;

      // Escape - Close modals or clear selection
      if (e.key === 'Escape') {
        if (isModalOpen) {
          e.preventDefault();
          closeAllModals();
          return;
        }
        if (isSelectionMode) {
          e.preventDefault();
          clearSelection();
          return;
        }
        // Clear navigation focus
        clearFocus();
        return;
      }

      // Skip other shortcuts if modal is open
      if (isModalOpen) return;

      // Skip if typing in input (except for certain keys)
      const isTyping = isTypingInInput();

      // Cmd+A (Mac) or Ctrl+A (Windows/Linux) - Select all visible tasks
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && !isTyping) {
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
        return;
      }

      // All remaining shortcuts require not typing
      if (isTyping) return;

      // n or Cmd+N - Open quick add (new task)
      if (e.key === 'n' || ((e.metaKey || e.ctrlKey) && e.key === 'n')) {
        e.preventDefault();
        openQuickAdd();
        return;
      }

      // ? - Show keyboard shortcuts help
      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        openKeyboardHelp();
        return;
      }

      // / - Focus search input
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.focus();
        }
        return;
      }

      // j or ArrowDown - Move focus down
      if (e.key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        moveFocusDown();
        return;
      }

      // k or ArrowUp - Move focus up
      if (e.key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        moveFocusUp();
        return;
      }

      // g then g - Go to first task (vim-style gg)
      // For simplicity, just use Home key
      if (e.key === 'Home') {
        e.preventDefault();
        moveFocusToFirst();
        return;
      }

      // End - Go to last task
      if (e.key === 'End') {
        e.preventDefault();
        moveFocusToLast();
        return;
      }

      // Enter or e - Edit focused task
      if ((e.key === 'Enter' || e.key === 'e') && focusedTaskId && focusedListId) {
        e.preventDefault();
        openTaskDetail(focusedTaskId, focusedListId);
        return;
      }

      // Space - Toggle task completion
      if (e.key === ' ' && focusedTaskId && focusedListId) {
        e.preventDefault();
        toggleTaskStatus(focusedTaskId, focusedListId);
        return;
      }

      // Delete or Backspace - Delete selected or focused task(s)
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();

        // If in selection mode with selected tasks, delete all selected
        if (isSelectionMode && selectedTaskIds.size > 0) {
          // Find tasks and their list IDs
          for (const [listId, listTasks] of tasks.entries()) {
            for (const task of listTasks) {
              if (selectedTaskIds.has(task.id)) {
                deleteTask(task.id, listId);
              }
            }
          }
          clearSelection();
          return;
        }

        // Otherwise delete focused task
        if (focusedTaskId && focusedListId) {
          deleteTask(focusedTaskId, focusedListId);
          clearFocus();
          return;
        }
      }

      // 1 - All Tasks view
      if (e.key === '1') {
        e.preventDefault();
        applyPreset('all');
        return;
      }

      // 2 - Active view
      if (e.key === '2') {
        e.preventDefault();
        applyPreset('active');
        return;
      }

      // 3 - Completed view
      if (e.key === '3') {
        e.preventDefault();
        applyPreset('completed');
        return;
      }

      // 4 - My Day view
      if (e.key === '4') {
        e.preventDefault();
        applyPreset('myDay');
        return;
      }

      // 5 - Due Today view
      if (e.key === '5') {
        e.preventDefault();
        applyPreset('today');
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectAll,
    clearSelection,
    isSelectionMode,
    selectedTaskIds,
    tasks,
    getCurrentBoard,
    viewMode,
    modals,
    openQuickAdd,
    openTaskDetail,
    openKeyboardHelp,
    closeAllModals,
    focusedTaskId,
    focusedListId,
    moveFocusUp,
    moveFocusDown,
    moveFocusToFirst,
    moveFocusToLast,
    clearFocus,
    toggleTaskStatus,
    deleteTask,
    applyPreset,
  ]);
}
