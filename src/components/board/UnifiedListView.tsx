/**
 * UnifiedListView Component
 * Shows all tasks from all lists in a single unified view
 * Tasks are grouped by status/filter but not by list
 */

import { useEffect, useMemo } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useFilterStore } from '../../stores/filterStore';
import { useLabelStore } from '../../stores/labelStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { PRIORITY_LEVELS } from '../../types/priority';
import TaskCard from './TaskCard';
import { Task } from '../../types/task';
import {
  organizeTasksHierarchically,
  flattenTasksWithDepth,
  countDirectSubtasks,
} from '../../utils/taskHierarchy';
import { logger } from '../../utils/logger';

export default function UnifiedListView() {
  const authenticated = useAuthStore((s) => s.authenticated);
  const taskLists = useTaskStore((s) => s.taskLists);
  const tasks = useTaskStore((s) => s.tasks);
  const fetchTaskLists = useTaskStore((s) => s.fetchTaskLists);
  const fetchTasks = useTaskStore((s) => s.fetchTasks);
  // IMPORTANT: subscribe to filter state so this view re-renders when filters change
  // (Selecting only the function would not trigger a re-render on status changes.)
  const activeFilters = useFilterStore((s) => s.activeFilters);
  const sortOptions = useFilterStore((s) => s.sortOptions);
  const getFilteredAndSortedTasks = useFilterStore((s) => s.getFilteredAndSortedTasks);
  const activePresetId = useFilterStore((s) => s.activePresetId);
  const filterPresets = useFilterStore((s) => s.filterPresets);
  const getTaskLabels = useLabelStore((s) => s.getTaskLabels);
  const getLabelById = useLabelStore((s) => s.getLabelById);
  const collapsedTasks = useUIStore((s) => s.collapsedTasks);

  // Build dynamic title based on active preset or filters
  const viewTitle = useMemo(() => {
    // If a preset is active, use its name
    if (activePresetId) {
      const preset = filterPresets.find((p) => p.id === activePresetId);
      if (preset) {
        return preset.name;
      }
    }

    // Otherwise, build title from active filters
    const parts: string[] = [];

    // Status filter
    if (activeFilters.status === 'needsAction') {
      parts.push('Active');
    } else if (activeFilters.status === 'completed') {
      parts.push('Completed');
    }

    // Priority filter
    if (activeFilters.priority) {
      parts.push(PRIORITY_LEVELS[activeFilters.priority].label);
    }

    // Label filter (show first label name if filtering by labels)
    if (activeFilters.labels.length > 0) {
      const firstLabel = getLabelById(activeFilters.labels[0]);
      if (firstLabel) {
        parts.push(firstLabel.name);
        if (activeFilters.labels.length > 1) {
          parts.push(`+${activeFilters.labels.length - 1}`);
        }
      }
    }

    // If no filters, show "All Tasks"
    if (parts.length === 0) {
      return 'All Tasks';
    }

    return parts.join(' · ') + ' Tasks';
  }, [activePresetId, filterPresets, activeFilters, getLabelById]);

  // Intentionally "use" these values to keep the subscriptions active even if
  // the current render logic doesn't directly reference them.
  void activeFilters;
  void sortOptions;

  // Fetch task lists on mount
  useEffect(() => {
    if (authenticated) {
      logger.log('[UnifiedListView] Fetching task lists...');
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  // Fetch tasks for all lists
  useEffect(() => {
    if (taskLists.length > 0) {
      logger.log('[UnifiedListView] Fetching tasks for all lists');
      taskLists.forEach(list => {
        fetchTasks(list.id);
      });
    }
  }, [taskLists, fetchTasks]);

  const listTitlesById = useMemo(() => {
    return new Map(taskLists.map((l) => [l.id, l.title] as const));
  }, [taskLists]);

  // Enrich with labels + list metadata in one pass (avoids O(n^2) scans)
  const tasksWithMetadata = useMemo(() => {
    const enriched: Task[] = [];
    for (const [listId, listTasks] of tasks.entries()) {
      const listTitle = listTitlesById.get(listId) || 'Unknown List';
      for (const task of listTasks) {
        enriched.push({
          ...task,
          labels: getTaskLabels(task.id),
          listId,
          listTitle,
        });
      }
    }
    return enriched;
  }, [tasks, listTitlesById, getTaskLabels]);

  // Apply filters and sorting
  // Note: we intentionally compute this on render so changes to filters/sorts
  // always reflect immediately in list view.
  const filteredTasks = getFilteredAndSortedTasks(tasksWithMetadata);

  // Organize tasks hierarchically
  const hierarchicalTasks = organizeTasksHierarchically(filteredTasks);

  // Flatten for rendering with depth information, respecting collapsed state
  const flatTasks = flattenTasksWithDepth(hierarchicalTasks, 0, collapsedTasks);

  if (filteredTasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg mb-2">No tasks found</p>
          <p className="text-sm">Try adjusting your filters or create a new task</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        {/* Compact header */}
        <div className="flex items-center gap-2 mb-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {viewTitle}
          </h2>
          <span className="text-xs text-muted-foreground/60">
            ({filteredTasks.length})
          </span>
        </div>

        {/* Task list */}
        <div className="space-y-2">
          {flatTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              listId={task.listId || ''}
              depth={task.depth || 0}
              subtaskCount={countDirectSubtasks(task)}
              showListName={true}
              inlineLabels={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
