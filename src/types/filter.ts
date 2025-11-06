/**
 * Filtering and sorting types
 */

import { TaskStatus, SortOption } from './task';

export interface DateRange {
  start?: Date;
  end?: Date;
}

export interface ActiveFilters {
  search: string;
  labels: string[]; // Label IDs
  status?: TaskStatus;
  dateRange?: DateRange;
  hasNotes: boolean;
  hasSubtasks: boolean;
}

export interface FilterPreset {
  id: string;
  name: string;
  filters: Partial<ActiveFilters>;
  icon?: string;
}

export const DEFAULT_FILTER_PRESETS: FilterPreset[] = [
  {
    id: 'all',
    name: 'All Tasks',
    filters: {},
    icon: 'list',
  },
  {
    id: 'active',
    name: 'Active',
    filters: { status: 'needsAction' },
    icon: 'circle',
  },
  {
    id: 'completed',
    name: 'Completed',
    filters: { status: 'completed' },
    icon: 'check-circle',
  },
  {
    id: 'today',
    name: 'Due Today',
    filters: {
      dateRange: {
        start: new Date(),
        end: new Date(),
      },
    },
    icon: 'calendar',
  },
];

export type { SortOption };
