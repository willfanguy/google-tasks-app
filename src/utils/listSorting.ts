/**
 * List Sorting Utilities
 * Functions for sorting task lists by various metrics
 */

import { Task, TaskList } from '../types/task';

/**
 * Gets the earliest due date from a list of tasks
 * Returns null if no tasks have due dates
 */
export function getEarliestDueDate(tasks: Task[]): Date | null {
  const tasksWithDue = tasks.filter(task => task.due && task.status === 'needsAction');

  if (tasksWithDue.length === 0) {
    return null;
  }

  const dates = tasksWithDue.map(task => new Date(task.due!));
  return new Date(Math.min(...dates.map(d => d.getTime())));
}

/**
 * Counts the number of incomplete tasks in a list
 */
export function countIncompleteTasks(tasks: Task[]): number {
  return tasks.filter(task => task.status === 'needsAction').length;
}

/**
 * Sorts task lists by name (alphabetically)
 */
export function sortListsByName(lists: TaskList[]): TaskList[] {
  return [...lists].sort((a, b) =>
    a.title.localeCompare(b.title, undefined, { sensitivity: 'base' })
  );
}

/**
 * Sorts task lists by earliest due date
 * Lists with earlier due dates come first
 * Lists with no due dates come last
 */
export function sortListsByDueDate(
  lists: TaskList[],
  tasksMap: Map<string, Task[]>
): TaskList[] {
  return [...lists].sort((a, b) => {
    const tasksA = tasksMap.get(a.id) || [];
    const tasksB = tasksMap.get(b.id) || [];

    const dueDateA = getEarliestDueDate(tasksA);
    const dueDateB = getEarliestDueDate(tasksB);

    // Lists with no due dates go to the end
    if (!dueDateA && !dueDateB) return 0;
    if (!dueDateA) return 1;
    if (!dueDateB) return -1;

    // Compare dates
    return dueDateA.getTime() - dueDateB.getTime();
  });
}

/**
 * Sorts task lists by number of incomplete tasks
 * Lists with more tasks come first
 */
export function sortListsByTaskCount(
  lists: TaskList[],
  tasksMap: Map<string, Task[]>
): TaskList[] {
  return [...lists].sort((a, b) => {
    const tasksA = tasksMap.get(a.id) || [];
    const tasksB = tasksMap.get(b.id) || [];

    const countA = countIncompleteTasks(tasksA);
    const countB = countIncompleteTasks(tasksB);

    // Sort descending (more tasks first)
    return countB - countA;
  });
}

/**
 * Sorts task lists based on the specified mode
 */
export function sortTaskLists(
  lists: TaskList[],
  tasksMap: Map<string, Task[]>,
  sortMode: 'manual' | 'name' | 'dueDate' | 'taskCount',
  manualOrder?: string[]
): TaskList[] {
  switch (sortMode) {
    case 'name':
      return sortListsByName(lists);

    case 'dueDate':
      return sortListsByDueDate(lists, tasksMap);

    case 'taskCount':
      return sortListsByTaskCount(lists, tasksMap);

    case 'manual':
    default:
      // Use manual order if provided
      if (manualOrder && manualOrder.length > 0) {
        return [...lists].sort((a, b) => {
          const indexA = manualOrder.indexOf(a.id);
          const indexB = manualOrder.indexOf(b.id);

          // If not in manual order, put at end
          if (indexA === -1 && indexB === -1) return 0;
          if (indexA === -1) return 1;
          if (indexB === -1) return -1;

          return indexA - indexB;
        });
      }
      // No manual order, return as-is
      return lists;
  }
}
