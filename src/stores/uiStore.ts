/**
 * UI Store
 * Manages UI state like modals, sidebars, and loading indicators
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { logger } from '../utils/logger';

interface ModalState {
  taskDetail: boolean;
  createTask: boolean;
  quickAdd: boolean;
  createLabel: boolean;
  labelManager: boolean;
  settings: boolean;
  filterPanel: boolean;
  keyboardHelp: boolean;
}

interface LoadingState {
  [key: string]: boolean;
}

interface UIState {
  // Modal state
  modals: ModalState;
  selectedTaskId: string | null;
  selectedListId: string | null;
  parentTaskId: string | null; // For creating subtasks

  // UI preferences
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  viewMode: 'board' | 'list';
  collapsedTasks: Set<string>; // Set of task IDs that are collapsed
  listSortMode: 'manual' | 'name' | 'dueDate' | 'taskCount';
  collapsedCompletedSections: Set<string>; // Set of list IDs with collapsed completed sections

  // Loading indicators
  loading: LoadingState;

  // Toast/notification queue
  notifications: Array<{
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
    duration?: number;
  }>;

  // Actions - Modals
  openTaskDetail: (taskId: string, listId: string) => void;
  closeTaskDetail: () => void;
  openCreateTask: (listId: string) => void;
  closeCreateTask: () => void;
  openQuickAdd: (listId?: string, parentTaskId?: string) => void;
  closeQuickAdd: () => void;
  openCreateLabel: () => void;
  closeCreateLabel: () => void;
  openLabelManager: () => void;
  closeLabelManager: () => void;
  openSettings: () => void;
  closeSettings: () => void;
  toggleFilterPanel: () => void;
  openKeyboardHelp: () => void;
  closeKeyboardHelp: () => void;
  closeAllModals: () => void;

  // Actions - UI preferences
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setTheme: (theme: 'light' | 'dark' | 'system') => void;
  setCompactMode: (compact: boolean) => void;
  setViewMode: (mode: 'board' | 'list') => void;
  setListSortMode: (mode: 'manual' | 'name' | 'dueDate' | 'taskCount') => void;
  toggleTaskCollapse: (taskId: string) => void;
  isTaskCollapsed: (taskId: string) => boolean;
  toggleCompletedSection: (listId: string) => void;
  isCompletedSectionCollapsed: (listId: string) => boolean;

  // Actions - Loading
  setLoading: (key: string, value: boolean) => void;
  isLoading: (key: string) => boolean;

  // Actions - Notifications
  addNotification: (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    duration?: number
  ) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const DEFAULT_MODALS: ModalState = {
  taskDetail: false,
  createTask: false,
  quickAdd: false,
  createLabel: false,
  labelManager: false,
  settings: false,
  filterPanel: false,
  keyboardHelp: false,
};

// Track notification timeouts to prevent memory leaks
const notificationTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      // Initial state
      modals: DEFAULT_MODALS,
      selectedTaskId: null,
      selectedListId: null,
      parentTaskId: null,
      sidebarCollapsed: false,
      theme: 'system',
      compactMode: false,
      viewMode: 'board',
      listSortMode: 'manual',
      collapsedTasks: new Set<string>(),
      collapsedCompletedSections: new Set<string>(),
      loading: {},
      notifications: [],

      /**
       * Opens task detail modal
       */
      openTaskDetail: (taskId: string, listId: string) => {
        logger.log(`[UIStore] Opening task detail: ${taskId}`);
        set((state) => ({
          modals: { ...state.modals, taskDetail: true },
          selectedTaskId: taskId,
          selectedListId: listId,
        }));
      },

      /**
       * Closes task detail modal
       */
      closeTaskDetail: () => {
        logger.log('[UIStore] Closing task detail');
        set((state) => ({
          modals: { ...state.modals, taskDetail: false },
          selectedTaskId: null,
          selectedListId: null,
        }));
      },

      /**
       * Opens create task modal
       */
      openCreateTask: (listId: string) => {
        logger.log(`[UIStore] Opening create task for list: ${listId}`);
        set((state) => ({
          modals: { ...state.modals, createTask: true },
          selectedListId: listId,
        }));
      },

      /**
       * Closes create task modal
       */
      closeCreateTask: () => {
        logger.log('[UIStore] Closing create task');
        set((state) => ({
          modals: { ...state.modals, createTask: false },
          selectedListId: null,
        }));
      },

      /**
       * Opens quick add modal (floating action button)
       * @param listId - Optional list ID to pre-select
       * @param parentTaskId - Optional parent task ID for creating subtasks
       */
      openQuickAdd: (listId?: string, parentTaskId?: string) => {
        logger.log('[UIStore] Opening quick add', { listId, parentTaskId });
        set((state) => ({
          modals: { ...state.modals, quickAdd: true },
          selectedListId: listId || state.selectedListId,
          parentTaskId: parentTaskId || null,
        }));
      },

      /**
       * Closes quick add modal
       */
      closeQuickAdd: () => {
        logger.log('[UIStore] Closing quick add');
        set((state) => ({
          modals: { ...state.modals, quickAdd: false },
          parentTaskId: null,
        }));
      },

      /**
       * Opens create label modal
       */
      openCreateLabel: () => {
        logger.log('[UIStore] Opening create label');
        set((state) => ({
          modals: { ...state.modals, createLabel: true },
        }));
      },

      /**
       * Closes create label modal
       */
      closeCreateLabel: () => {
        logger.log('[UIStore] Closing create label');
        set((state) => ({
          modals: { ...state.modals, createLabel: false },
        }));
      },

      /**
       * Opens label manager modal
       */
      openLabelManager: () => {
        logger.log('[UIStore] Opening label manager');
        set((state) => ({
          modals: { ...state.modals, labelManager: true },
        }));
      },

      /**
       * Closes label manager modal
       */
      closeLabelManager: () => {
        logger.log('[UIStore] Closing label manager');
        set((state) => ({
          modals: { ...state.modals, labelManager: false },
        }));
      },

      /**
       * Opens settings modal
       */
      openSettings: () => {
        logger.log('[UIStore] Opening settings');
        set((state) => ({
          modals: { ...state.modals, settings: true },
        }));
      },

      /**
       * Closes settings modal
       */
      closeSettings: () => {
        logger.log('[UIStore] Closing settings');
        set((state) => ({
          modals: { ...state.modals, settings: false },
        }));
      },

      /**
       * Toggles filter panel visibility
       */
      toggleFilterPanel: () => {
        logger.log('[UIStore] Toggling filter panel');
        set((state) => ({
          modals: { ...state.modals, filterPanel: !state.modals.filterPanel },
        }));
      },

      /**
       * Opens keyboard shortcuts help modal
       */
      openKeyboardHelp: () => {
        logger.log('[UIStore] Opening keyboard help');
        set((state) => ({
          modals: { ...state.modals, keyboardHelp: true },
        }));
      },

      /**
       * Closes keyboard shortcuts help modal
       */
      closeKeyboardHelp: () => {
        logger.log('[UIStore] Closing keyboard help');
        set((state) => ({
          modals: { ...state.modals, keyboardHelp: false },
        }));
      },

      /**
       * Closes all open modals
       */
      closeAllModals: () => {
        logger.log('[UIStore] Closing all modals');
        set({
          modals: { ...DEFAULT_MODALS },
          selectedTaskId: null,
          selectedListId: null,
          parentTaskId: null,
        });
      },

      /**
       * Toggles sidebar collapsed state
       */
      toggleSidebar: () => {
        logger.log('[UIStore] Toggling sidebar');
        set((state) => ({
          sidebarCollapsed: !state.sidebarCollapsed,
        }));
      },

      /**
       * Sets sidebar collapsed state
       */
      setSidebarCollapsed: (collapsed: boolean) => {
        logger.log(`[UIStore] Setting sidebar collapsed: ${collapsed}`);
        set({ sidebarCollapsed: collapsed });
      },

      /**
       * Sets theme preference
       */
      setTheme: (theme: 'light' | 'dark' | 'system') => {
        logger.log(`[UIStore] Setting theme: ${theme}`);
        set({ theme });
      },

      /**
       * Sets compact mode
       */
      setCompactMode: (compact: boolean) => {
        logger.log(`[UIStore] Setting compact mode: ${compact}`);
        set({ compactMode: compact });
      },

      /**
       * Sets view mode (board or list)
       */
      setViewMode: (mode: 'board' | 'list') => {
        logger.log(`[UIStore] Setting view mode: ${mode}`);
        set({ viewMode: mode });
      },

      /**
       * Sets list sort mode
       */
      setListSortMode: (mode: 'manual' | 'name' | 'dueDate' | 'taskCount') => {
        logger.log(`[UIStore] Setting list sort mode: ${mode}`);
        set({ listSortMode: mode });
      },

      /**
       * Toggles the collapsed state of a task (for hiding/showing subtasks)
       */
      toggleTaskCollapse: (taskId: string) => {
        logger.log(`[UIStore] Toggling collapse for task: ${taskId}`);
        set((state) => {
          const newCollapsed = new Set(state.collapsedTasks);
          if (newCollapsed.has(taskId)) {
            newCollapsed.delete(taskId);
          } else {
            newCollapsed.add(taskId);
          }
          return { collapsedTasks: newCollapsed };
        });
      },

      /**
       * Checks if a task is collapsed
       */
      isTaskCollapsed: (taskId: string) => {
        return get().collapsedTasks.has(taskId);
      },

      /**
       * Toggles the collapsed state of a completed section for a list
       */
      toggleCompletedSection: (listId: string) => {
        logger.log(`[UIStore] Toggling completed section for list: ${listId}`);
        set((state) => {
          const newCollapsed = new Set(state.collapsedCompletedSections);
          if (newCollapsed.has(listId)) {
            newCollapsed.delete(listId);
          } else {
            newCollapsed.add(listId);
          }
          return { collapsedCompletedSections: newCollapsed };
        });
      },

      /**
       * Checks if completed section is collapsed for a list
       */
      isCompletedSectionCollapsed: (listId: string) => {
        return get().collapsedCompletedSections.has(listId);
      },

      /**
       * Sets a loading indicator
       */
      setLoading: (key: string, value: boolean) => {
        set((state) => {
          const newLoading = { ...state.loading };
          if (value) {
            newLoading[key] = true;
          } else {
            delete newLoading[key];
          }
          return { loading: newLoading };
        });
      },

      /**
       * Checks if a specific loading indicator is active
       */
      isLoading: (key: string) => {
        return get().loading[key] === true;
      },

      /**
       * Adds a notification to the queue
       */
      addNotification: (
        type: 'success' | 'error' | 'info' | 'warning',
        message: string,
        duration = 5000
      ) => {
        const id = `notification-${Date.now()}-${Math.random()}`;
        logger.log(`[UIStore] Adding notification: ${type} - ${message}`);

        set((state) => ({
          notifications: [...state.notifications, { id, type, message, duration }],
        }));

        // Auto-remove after duration
        if (duration > 0) {
          const timeoutId = setTimeout(() => {
            notificationTimeouts.delete(id);
            get().removeNotification(id);
          }, duration);
          notificationTimeouts.set(id, timeoutId);
        }

        return id;
      },

      /**
       * Removes a notification from the queue
       */
      removeNotification: (id: string) => {
        logger.log(`[UIStore] Removing notification: ${id}`);

        // Clear the timeout if it exists
        const timeoutId = notificationTimeouts.get(id);
        if (timeoutId) {
          clearTimeout(timeoutId);
          notificationTimeouts.delete(id);
        }

        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      /**
       * Clears all notifications
       */
      clearNotifications: () => {
        logger.log('[UIStore] Clearing all notifications');

        // Clear all pending timeouts
        notificationTimeouts.forEach((timeoutId) => {
          clearTimeout(timeoutId);
        });
        notificationTimeouts.clear();

        set({ notifications: [] });
      },
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        compactMode: state.compactMode,
        viewMode: state.viewMode,
        listSortMode: state.listSortMode,
        collapsedTasks: Array.from(state.collapsedTasks), // Convert Set to Array for storage
        collapsedCompletedSections: Array.from(state.collapsedCompletedSections),
      }),
      // Custom storage to handle Set serialization
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          const data = JSON.parse(str);
          // Convert collapsedTasks array back to Set
          if (data.state?.collapsedTasks) {
            data.state.collapsedTasks = new Set(data.state.collapsedTasks);
          }
          // Convert collapsedCompletedSections array back to Set
          if (data.state?.collapsedCompletedSections) {
            data.state.collapsedCompletedSections = new Set(data.state.collapsedCompletedSections);
          }
          return data;
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value));
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
        },
      },
    }
  )
);
