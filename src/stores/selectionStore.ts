import { create } from 'zustand';

interface SelectionState {
  selectedTaskIds: Set<string>;
  isSelectionMode: boolean;

  // Actions
  toggleTaskSelection: (taskId: string) => void;
  selectTask: (taskId: string) => void;
  deselectTask: (taskId: string) => void;
  selectMultipleTasks: (taskIds: string[]) => void;
  clearSelection: () => void;
  selectAll: (taskIds: string[]) => void;
  isTaskSelected: (taskId: string) => boolean;
  enterSelectionMode: () => void;
  exitSelectionMode: () => void;
}

export const useSelectionStore = create<SelectionState>((set, get) => ({
  selectedTaskIds: new Set<string>(),
  isSelectionMode: false,

  toggleTaskSelection: (taskId: string) => {
    const { selectedTaskIds } = get();
    const newSelectedTaskIds = new Set(selectedTaskIds);

    if (newSelectedTaskIds.has(taskId)) {
      newSelectedTaskIds.delete(taskId);
    } else {
      newSelectedTaskIds.add(taskId);
    }

    set({
      selectedTaskIds: newSelectedTaskIds,
      isSelectionMode: newSelectedTaskIds.size > 0
    });
  },

  selectTask: (taskId: string) => {
    const { selectedTaskIds } = get();
    const newSelectedTaskIds = new Set(selectedTaskIds);
    newSelectedTaskIds.add(taskId);

    set({
      selectedTaskIds: newSelectedTaskIds,
      isSelectionMode: true
    });
  },

  deselectTask: (taskId: string) => {
    const { selectedTaskIds } = get();
    const newSelectedTaskIds = new Set(selectedTaskIds);
    newSelectedTaskIds.delete(taskId);

    set({
      selectedTaskIds: newSelectedTaskIds,
      isSelectionMode: newSelectedTaskIds.size > 0
    });
  },

  selectMultipleTasks: (taskIds: string[]) => {
    const { selectedTaskIds } = get();
    const newSelectedTaskIds = new Set(selectedTaskIds);
    taskIds.forEach(id => newSelectedTaskIds.add(id));

    set({
      selectedTaskIds: newSelectedTaskIds,
      isSelectionMode: newSelectedTaskIds.size > 0
    });
  },

  clearSelection: () => {
    set({
      selectedTaskIds: new Set<string>(),
      isSelectionMode: false
    });
  },

  selectAll: (taskIds: string[]) => {
    set({
      selectedTaskIds: new Set(taskIds),
      isSelectionMode: taskIds.length > 0
    });
  },

  isTaskSelected: (taskId: string) => {
    return get().selectedTaskIds.has(taskId);
  },

  enterSelectionMode: () => {
    set({ isSelectionMode: true });
  },

  exitSelectionMode: () => {
    set({
      isSelectionMode: false,
      selectedTaskIds: new Set<string>()
    });
  },
}));
