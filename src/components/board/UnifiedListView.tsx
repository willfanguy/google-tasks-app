/**
 * UnifiedListView Component
 * Shows all tasks from all lists in a single unified view
 * Tasks are grouped by status/filter but not by list
 */

import { useEffect } from 'react';
import { useTaskStore } from '../../stores/taskStore';
import { useFilterStore } from '../../stores/filterStore';
import { useLabelStore } from '../../stores/labelStore';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import TaskCard from './TaskCard';
import {
  organizeTasksHierarchically,
  flattenTasksWithDepth,
  countDirectSubtasks,
} from '../../utils/taskHierarchy';
import { logger } from '../../utils/logger';

export default function UnifiedListView() {
  const { authenticated } = useAuthStore();
  const { taskLists, tasks, fetchTaskLists, fetchTasks } = useTaskStore();
  const { getFilteredAndSortedTasks } = useFilterStore();
  const { getTaskLabels } = useLabelStore();
  const { collapsedTasks } = useUIStore();

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

  // Combine all tasks from all lists
  const allTasks = Array.from(tasks.values()).flat();

  // Enrich with labels and list info
  const tasksWithMetadata = allTasks.map(task => {
    // Find which list this task belongs to
    let listId = '';
    let listTitle = '';
    for (const [lid, listTasks] of tasks.entries()) {
      if (listTasks.find(t => t.id === task.id)) {
        listId = lid;
        const list = taskLists.find(l => l.id === lid);
        listTitle = list?.title || 'Unknown List';
        break;
      }
    }

    return {
      ...task,
      labels: getTaskLabels(task.id),
      listId,
      listTitle,
    };
  });

  // Apply filters and sorting
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
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Show total count */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            All Tasks
          </h2>
          <span className="text-sm text-muted-foreground">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
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
            />
          ))}
        </div>
      </div>
    </div>
  );
}
