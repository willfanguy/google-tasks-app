/**
 * Filter Store
 * Manages task filtering and sorting with preset support
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, SortOption } from '../types/task';
import { ActiveFilters, FilterPreset, DEFAULT_FILTER_PRESETS } from '../types/filter';
import { logger } from '../utils/logger';
import { useLabelStore } from './labelStore';

interface FilterState {
  activeFilters: ActiveFilters;
  sortOption: SortOption;
  filterPresets: FilterPreset[];
  activePresetId: string | null;

  // Actions
  setSearchQuery: (query: string) => void;
  toggleLabelFilter: (labelId: string) => void;
  setLabelFilters: (labelIds: string[]) => void;
  toggleExcludeLabelFilter: (labelId: string) => void;
  setExcludeLabelFilters: (labelIds: string[]) => void;
  setStatusFilter: (status: 'needsAction' | 'completed' | undefined) => void;
  setDateRangeFilter: (range?: { start?: Date; end?: Date }) => void;
  setHasNotesFilter: (hasNotes: boolean) => void;
  setHasSubtasksFilter: (hasSubtasks: boolean) => void;
  setSortOption: (option: SortOption) => void;
  clearFilters: () => void;
  applyPreset: (presetId: string) => void;
  createPreset: (name: string, icon?: string) => void;
  deletePreset: (presetId: string) => void;

  // Computed
  getFilteredTasks: (tasks: Task[]) => Task[];
  getSortedTasks: (tasks: Task[]) => Task[];
  getFilteredAndSortedTasks: (tasks: Task[]) => Task[];
  hasActiveFilters: () => boolean;
}

const DEFAULT_FILTERS: ActiveFilters = {
  search: '',
  labels: [],
  excludeLabels: [],
  status: undefined,
  dateRange: undefined,
  hasNotes: false,
  hasSubtasks: false,
};

export const useFilterStore = create<FilterState>()(
  persist(
    (set, get) => ({
      activeFilters: DEFAULT_FILTERS,
      sortOption: 'manual',
      filterPresets: DEFAULT_FILTER_PRESETS,
      activePresetId: null,

      /**
       * Sets the search query filter
       */
      setSearchQuery: (query: string) => {
        logger.log('[FilterStore] Setting search query:', query);
        set((state) => ({
          activeFilters: { ...state.activeFilters, search: query },
          activePresetId: null,
        }));
      },

      /**
       * Toggles a label filter on/off
       */
      toggleLabelFilter: (labelId: string) => {
        logger.log('[FilterStore] Toggling label filter:', labelId);
        set((state) => {
          const index = state.activeFilters.labels.indexOf(labelId);
          const newLabels = [...state.activeFilters.labels];
          if (index !== -1) {
            newLabels.splice(index, 1);
          } else {
            newLabels.push(labelId);
          }
          return {
            activeFilters: { ...state.activeFilters, labels: newLabels },
            activePresetId: null,
          };
        });
      },

      /**
       * Sets multiple label filters at once
       */
      setLabelFilters: (labelIds: string[]) => {
        logger.log('[FilterStore] Setting label filters:', labelIds);
        set((state) => ({
          activeFilters: { ...state.activeFilters, labels: labelIds },
          activePresetId: null,
        }));
      },

      /**
       * Toggles an exclude label filter on/off
       */
      toggleExcludeLabelFilter: (labelId: string) => {
        logger.log('[FilterStore] Toggling exclude label filter:', labelId);
        set((state) => {
          const index = state.activeFilters.excludeLabels.indexOf(labelId);
          const newExcludeLabels = [...state.activeFilters.excludeLabels];
          if (index !== -1) {
            newExcludeLabels.splice(index, 1);
          } else {
            newExcludeLabels.push(labelId);
          }
          return {
            activeFilters: { ...state.activeFilters, excludeLabels: newExcludeLabels },
            activePresetId: null,
          };
        });
      },

      /**
       * Sets multiple exclude label filters at once
       */
      setExcludeLabelFilters: (labelIds: string[]) => {
        logger.log('[FilterStore] Setting exclude label filters:', labelIds);
        set((state) => ({
          activeFilters: { ...state.activeFilters, excludeLabels: labelIds },
          activePresetId: null,
        }));
      },

      /**
       * Sets the status filter
       */
      setStatusFilter: (status: 'needsAction' | 'completed' | undefined) => {
        logger.log('[FilterStore] Setting status filter:', status);
        set((state) => ({
          activeFilters: { ...state.activeFilters, status },
          activePresetId: null,
        }));
      },

      /**
       * Sets the date range filter
       */
      setDateRangeFilter: (range?: { start?: Date; end?: Date }) => {
        logger.log('[FilterStore] Setting date range filter:', range);
        set((state) => ({
          activeFilters: { ...state.activeFilters, dateRange: range },
          activePresetId: null,
        }));
      },

      /**
       * Sets the "has notes" filter
       */
      setHasNotesFilter: (hasNotes: boolean) => {
        logger.log('[FilterStore] Setting has notes filter:', hasNotes);
        set((state) => ({
          activeFilters: { ...state.activeFilters, hasNotes },
          activePresetId: null,
        }));
      },

      /**
       * Sets the "has subtasks" filter
       */
      setHasSubtasksFilter: (hasSubtasks: boolean) => {
        logger.log('[FilterStore] Setting has subtasks filter:', hasSubtasks);
        set((state) => ({
          activeFilters: { ...state.activeFilters, hasSubtasks },
          activePresetId: null,
        }));
      },

      /**
       * Sets the sort option
       */
      setSortOption: (option: SortOption) => {
        logger.log('[FilterStore] Setting sort option:', option);
        set({ sortOption: option });
      },

      /**
       * Clears all active filters
       */
      clearFilters: () => {
        logger.log('[FilterStore] Clearing all filters');
        set({
          activeFilters: { ...DEFAULT_FILTERS },
          activePresetId: null,
        });
      },

      /**
       * Applies a filter preset
       */
      applyPreset: (presetId: string) => {
        logger.log('[FilterStore] Applying preset:', presetId);
        const preset = get().filterPresets.find((p) => p.id === presetId);
        if (!preset) {
          logger.error(`[FilterStore] Preset ${presetId} not found`);
          return;
        }

        // Special handling for "today" preset - compute current date dynamically
        let filters = { ...preset.filters };
        if (presetId === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayEnd = new Date();
          todayEnd.setHours(23, 59, 59, 999);
          filters = {
            ...filters,
            dateRange: {
              start: today,
              end: todayEnd,
            },
          };
        }

        set({
          activeFilters: { ...DEFAULT_FILTERS, ...filters },
          activePresetId: presetId,
        });
      },

      /**
       * Creates a new filter preset from current filters
       */
      createPreset: (name: string, icon?: string) => {
        logger.log('[FilterStore] Creating preset:', name);
        const newPreset: FilterPreset = {
          id: `preset-${Date.now()}`,
          name,
          filters: { ...get().activeFilters },
          icon,
        };

        set((state) => ({
          filterPresets: [...state.filterPresets, newPreset],
        }));
      },

      /**
       * Deletes a filter preset (cannot delete default presets)
       */
      deletePreset: (presetId: string) => {
        logger.log('[FilterStore] Deleting preset:', presetId);

        // Prevent deletion of default presets
        const defaultIds = DEFAULT_FILTER_PRESETS.map((p) => p.id);
        if (defaultIds.includes(presetId)) {
          logger.warn('[FilterStore] Cannot delete default preset');
          return;
        }

        set((state) => ({
          filterPresets: state.filterPresets.filter((p) => p.id !== presetId),
          activePresetId: state.activePresetId === presetId ? null : state.activePresetId,
        }));
      },

      /**
       * Filters tasks based on active filters
       */
      getFilteredTasks: (tasks: Task[]) => {
        const { activeFilters } = get();
        let filtered = [...tasks];

        // Search filter
        if (activeFilters.search) {
          const searchLower = activeFilters.search.toLowerCase();
          filtered = filtered.filter(
            (task) =>
              task.title.toLowerCase().includes(searchLower) ||
              task.notes?.toLowerCase().includes(searchLower)
          );
        }

        // Label filter (include)
        if (activeFilters.labels.length > 0) {
          filtered = filtered.filter((task) =>
            task.labels?.some((labelId) => activeFilters.labels.includes(labelId))
          );
        }

        // Exclude label filter
        if (activeFilters.excludeLabels.length > 0) {
          filtered = filtered.filter((task) =>
            !task.labels?.some((labelId) => activeFilters.excludeLabels.includes(labelId))
          );
        }

        // Status filter
        if (activeFilters.status) {
          filtered = filtered.filter((task) => task.status === activeFilters.status);
        }

        // Date range filter
        if (activeFilters.dateRange) {
          const { start, end } = activeFilters.dateRange;
          filtered = filtered.filter((task) => {
            if (!task.due) return false;
            const dueDate = new Date(task.due);

            // Convert task due date to UTC timestamp (date only)
            const dueDateUTC = Date.UTC(
              dueDate.getUTCFullYear(),
              dueDate.getUTCMonth(),
              dueDate.getUTCDate()
            );

            if (start && end) {
              const startDate = new Date(start);
              const endDate = new Date(end);
              // Convert filter dates to UTC timestamps (date only)
              const startUTC = Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
              );
              const endUTC = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
              );
              return dueDateUTC >= startUTC && dueDateUTC <= endUTC;
            } else if (start) {
              const startDate = new Date(start);
              const startUTC = Date.UTC(
                startDate.getFullYear(),
                startDate.getMonth(),
                startDate.getDate()
              );
              return dueDateUTC >= startUTC;
            } else if (end) {
              const endDate = new Date(end);
              const endUTC = Date.UTC(
                endDate.getFullYear(),
                endDate.getMonth(),
                endDate.getDate()
              );
              return dueDateUTC <= endUTC;
            }
            return true;
          });
        }

        // Has notes filter
        if (activeFilters.hasNotes) {
          filtered = filtered.filter((task) => task.notes && task.notes.length > 0);
        }

        // Has subtasks filter
        if (activeFilters.hasSubtasks) {
          filtered = filtered.filter((task) => task.parent !== undefined);
        }

        return filtered;
      },

      /**
       * Sorts tasks based on sort option
       */
      getSortedTasks: (tasks: Task[]) => {
        const { sortOption } = get();
        const sorted = [...tasks];

        switch (sortOption) {
          case 'manual':
            // Keep original order (by position or localOrder)
            return sorted.sort((a, b) => {
              if (a.localOrder !== undefined && b.localOrder !== undefined) {
                return a.localOrder - b.localOrder;
              }
              return a.position.localeCompare(b.position);
            });

          case 'dueDate-asc':
            return sorted.sort((a, b) => {
              if (!a.due && !b.due) return 0;
              if (!a.due) return 1;
              if (!b.due) return -1;
              return new Date(a.due).getTime() - new Date(b.due).getTime();
            });

          case 'dueDate-desc':
            return sorted.sort((a, b) => {
              if (!a.due && !b.due) return 0;
              if (!a.due) return 1;
              if (!b.due) return -1;
              return new Date(b.due).getTime() - new Date(a.due).getTime();
            });

          case 'title-asc':
            return sorted.sort((a, b) => a.title.localeCompare(b.title));

          case 'title-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title));

          case 'status':
            return sorted.sort((a, b) => {
              if (a.status === b.status) return 0;
              return a.status === 'needsAction' ? -1 : 1;
            });

          case 'created-asc':
            return sorted.sort(
              (a, b) => new Date(a.updated).getTime() - new Date(b.updated).getTime()
            );

          case 'created-desc':
            return sorted.sort(
              (a, b) => new Date(b.updated).getTime() - new Date(a.updated).getTime()
            );

          case 'list-asc':
            return sorted.sort((a, b) => {
              const listA = a.listTitle || '';
              const listB = b.listTitle || '';
              return listA.localeCompare(listB);
            });

          case 'list-desc':
            return sorted.sort((a, b) => {
              const listA = a.listTitle || '';
              const listB = b.listTitle || '';
              return listB.localeCompare(listA);
            });

          case 'label-asc':
            return sorted.sort((a, b) => {
              // Tasks without labels come last
              if (!a.labels || a.labels.length === 0) return 1;
              if (!b.labels || b.labels.length === 0) return -1;

              // Get the first label for each task
              const labelA = useLabelStore.getState().getLabelById(a.labels[0]);
              const labelB = useLabelStore.getState().getLabelById(b.labels[0]);

              // If labels don't exist, treat as no label
              if (!labelA) return 1;
              if (!labelB) return -1;

              // Sort by label order property
              return labelA.order - labelB.order;
            });

          case 'label-desc':
            return sorted.sort((a, b) => {
              // Tasks without labels come last
              if (!a.labels || a.labels.length === 0) return 1;
              if (!b.labels || b.labels.length === 0) return -1;

              // Get the first label for each task
              const labelA = useLabelStore.getState().getLabelById(a.labels[0]);
              const labelB = useLabelStore.getState().getLabelById(b.labels[0]);

              // If labels don't exist, treat as no label
              if (!labelA) return 1;
              if (!labelB) return -1;

              // Sort by label order property (reversed)
              return labelB.order - labelA.order;
            });

          default:
            return sorted;
        }
      },

      /**
       * Applies both filtering and sorting
       */
      getFilteredAndSortedTasks: (tasks: Task[]) => {
        const filtered = get().getFilteredTasks(tasks);
        return get().getSortedTasks(filtered);
      },

      /**
       * Checks if any filters are currently active
       */
      hasActiveFilters: () => {
        const { activeFilters } = get();
        return (
          activeFilters.search !== '' ||
          activeFilters.labels.length > 0 ||
          activeFilters.excludeLabels.length > 0 ||
          activeFilters.status !== undefined ||
          activeFilters.dateRange !== undefined ||
          activeFilters.hasNotes ||
          activeFilters.hasSubtasks
        );
      },
    }),
    {
      name: 'filter-storage',
      partialize: (state) => ({
        sortOption: state.sortOption,
        filterPresets: state.filterPresets,
      }),
      // Custom storage to handle contextIsolation
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name);
          if (!str) return null;
          return JSON.parse(str);
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
