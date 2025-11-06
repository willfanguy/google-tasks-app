/**
 * Task Hierarchy Utilities
 * Functions for organizing tasks into parent-child tree structures
 */

import { Task } from '../types/task';

export interface TaskWithChildren extends Task {
  children?: TaskWithChildren[];
  depth?: number;
}

/**
 * Organizes a flat list of tasks into a hierarchical tree structure
 * Tasks with no parent are root-level, tasks with parent are nested
 *
 * @param tasks - Flat array of tasks
 * @returns Array of root tasks with children nested
 */
export function organizeTasksHierarchically(tasks: Task[]): TaskWithChildren[] {
  // Create a map for quick lookup
  const taskMap = new Map<string, TaskWithChildren>();

  // First pass: create map of all tasks
  tasks.forEach(task => {
    taskMap.set(task.id, { ...task, children: [] });
  });

  // Second pass: build hierarchy
  const rootTasks: TaskWithChildren[] = [];

  tasks.forEach(task => {
    const taskNode = taskMap.get(task.id)!;

    if (task.parent) {
      // This is a subtask - add to parent's children
      const parent = taskMap.get(task.parent);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(taskNode);
      } else {
        // Parent not found, treat as root task
        rootTasks.push(taskNode);
      }
    } else {
      // This is a root task
      rootTasks.push(taskNode);
    }
  });

  return rootTasks;
}

/**
 * Flattens a hierarchical task tree into a flat list with depth information
 * Useful for rendering with proper indentation
 *
 * @param tasks - Hierarchical tasks with children
 * @param depth - Current depth level (used for recursion)
 * @param collapsedTaskIds - Set of task IDs that are collapsed (their children will be hidden)
 * @returns Flat array with depth property set
 */
export function flattenTasksWithDepth(
  tasks: TaskWithChildren[],
  depth: number = 0,
  collapsedTaskIds: Set<string> = new Set()
): TaskWithChildren[] {
  const result: TaskWithChildren[] = [];

  tasks.forEach(task => {
    // Add current task with depth
    result.push({ ...task, depth });

    // Only add children if this task is not collapsed
    const isCollapsed = collapsedTaskIds.has(task.id);
    if (task.children && task.children.length > 0 && !isCollapsed) {
      const childrenFlat = flattenTasksWithDepth(task.children, depth + 1, collapsedTaskIds);
      result.push(...childrenFlat);
    }
  });

  return result;
}

/**
 * Counts the number of subtasks for a given task
 * Includes all nested levels
 *
 * @param task - Task with potential children
 * @returns Total count of all subtasks
 */
export function countSubtasks(task: TaskWithChildren): number {
  if (!task.children || task.children.length === 0) {
    return 0;
  }

  let count = task.children.length;

  // Recursively count children's children
  task.children.forEach(child => {
    count += countSubtasks(child);
  });

  return count;
}

/**
 * Counts only direct subtasks (not nested)
 *
 * @param task - Task with potential children
 * @returns Count of direct subtasks
 */
export function countDirectSubtasks(task: TaskWithChildren): number {
  return task.children?.length || 0;
}

/**
 * Gets all subtasks of a task from a flat task list
 *
 * @param taskId - Parent task ID
 * @param tasks - Flat array of all tasks
 * @returns Array of subtasks
 */
export function getSubtasks(taskId: string, tasks: Task[]): Task[] {
  return tasks.filter(task => task.parent === taskId);
}

/**
 * Checks if a task has any subtasks
 *
 * @param taskId - Task ID to check
 * @param tasks - Flat array of all tasks
 * @returns True if task has subtasks
 */
export function hasSubtasks(taskId: string, tasks: Task[]): boolean {
  return tasks.some(task => task.parent === taskId);
}

/**
 * Gets the depth level of a task in the hierarchy
 *
 * @param task - Task to check
 * @param tasks - Flat array of all tasks
 * @returns Depth level (0 for root tasks)
 */
export function getTaskDepth(task: Task, tasks: Task[]): number {
  let depth = 0;
  let currentTask = task;

  while (currentTask.parent) {
    depth++;
    const parent = tasks.find(t => t.id === currentTask.parent);
    if (!parent) break;
    currentTask = parent;
  }

  return depth;
}
