/**
 * TaskList Component
 * Vertical column displaying tasks for a specific list (droppable zone)
 */

import { useEffect, useState } from 'react';
import { Plus, MoreVertical, Edit2, Trash2, GripVertical, ChevronRight, ChevronDown } from 'lucide-react';
import { useDroppable } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTaskStore } from '../../stores/taskStore';
import { useFilterStore } from '../../stores/filterStore';
import { useUIStore } from '../../stores/uiStore';
import { useLabelStore } from '../../stores/labelStore';
import { TaskList as TaskListType } from '../../types/task';
import TaskCard from './TaskCard';
import {
  organizeTasksHierarchically,
  flattenTasksWithDepth,
  countDirectSubtasks,
} from '../../utils/taskHierarchy';
import { logger } from '../../utils/logger';

interface TaskListProps {
  listId: string;
  list: TaskListType;
}

export default function TaskList({ listId, list }: TaskListProps) {
  const { tasks, loadingLists, fetchTasks, updateTaskList, deleteTaskList } = useTaskStore();
  const { getFilteredAndSortedTasks } = useFilterStore();
  const { openCreateTask, collapsedTasks, toggleCompletedSection, isCompletedSectionCollapsed } = useUIStore();
  const { getTaskLabels } = useLabelStore();
  const [showMenu, setShowMenu] = useState(false);

  const tasksForList = tasks.get(listId) || [];
  const isLoading = loadingLists.has(listId);

  // Enrich tasks with labels from labelStore
  const tasksWithLabels = tasksForList.map(task => ({
    ...task,
    labels: getTaskLabels(task.id),
  }));

  // Setup sortable for list reordering
  const {
    attributes,
    listeners,
    setNodeRef: setSortableRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: listId,
    data: {
      type: 'list',
      listId,
    },
  });

  // Setup droppable zone for tasks
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `list-${listId}`,
    data: {
      listId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Fetch tasks for this list on mount
  useEffect(() => {
    logger.log(`[TaskList] Fetching tasks for list: ${listId}`);
    fetchTasks(listId);
  }, [listId, fetchTasks]);

  // Apply filters and sorting to tasks enriched with labels
  const filteredTasks = getFilteredAndSortedTasks(tasksWithLabels);

  // Organize tasks hierarchically
  const hierarchicalTasks = organizeTasksHierarchically(filteredTasks);

  // Flatten for rendering with depth information, respecting collapsed state
  const flatTasks = flattenTasksWithDepth(hierarchicalTasks, 0, collapsedTasks);

  // Separate incomplete and completed tasks
  const incompleteTasks = flatTasks.filter(task => task.status === 'needsAction');
  const completedTasks = flatTasks.filter(task => task.status === 'completed');
  const isCompletedCollapsed = isCompletedSectionCollapsed(listId);

  const handleAddTask = () => {
    logger.log(`[TaskList] Add task clicked for list: ${listId}`);
    openCreateTask(listId);
  };

  const handleRename = async () => {
    const newTitle = prompt('Enter new list name:', list.title);
    if (!newTitle || newTitle.trim() === '' || newTitle.trim() === list.title) {
      return;
    }

    logger.log(`[TaskList] Renaming list ${listId} to:`, newTitle);
    await updateTaskList(listId, newTitle.trim());
    setShowMenu(false);
  };

  const handleDelete = async () => {
    const confirmed = confirm(
      `Are you sure you want to delete "${list.title}"?\n\nThis will delete all tasks in this list. This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    logger.log(`[TaskList] Deleting list ${listId}`);
    await deleteTaskList(listId);
    setShowMenu(false);
  };

  // Combine refs for both sortable and droppable
  const setRefs = (node: HTMLDivElement | null) => {
    setSortableRef(node);
    setDroppableRef(node);
  };

  return (
    <div
      ref={setRefs}
      style={style}
      className={`w-80 flex-shrink-0 flex flex-col bg-card rounded-lg border transition-all duration-200 ${
        isOver ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      } ${
        isDragging ? 'ring-2 ring-primary/40 shadow-lg' : ''
      }`}
    >
      {/* List header */}
      <div className="p-4 border-b border-border flex items-center justify-between group/header">
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="p-1 -ml-1 cursor-grab active:cursor-grabbing hover:bg-accent rounded transition-all flex-shrink-0 opacity-0 group-hover/header:opacity-100"
          title="Drag to reorder list"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>

        <div className="flex-1 min-w-0 ml-2">
          <h3 className="text-sm font-semibold text-foreground truncate">
            {list.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
          </p>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          <button
            onClick={handleAddTask}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            title="Add task"
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
          </button>

          {/* Menu dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              title="List options"
            >
              <MoreVertical className="w-4 h-4 text-muted-foreground" />
            </button>

            {showMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />

                {/* Menu */}
                <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
                  <button
                    onClick={handleRename}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors text-left"
                  >
                    <Edit2 className="w-4 h-4" />
                    Rename List
                  </button>
                  <button
                    onClick={handleDelete}
                    className="w-full flex items-center gap-3 px-4 py-2 text-sm text-destructive hover:bg-accent transition-colors text-left"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete List
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Tasks area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-[200px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              {tasksForList.length === 0 ? 'No tasks yet' : 'No matching tasks'}
            </p>
          </div>
        ) : (
          <>
            {/* Incomplete tasks */}
            {incompleteTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                listId={listId}
                depth={task.depth || 0}
                subtaskCount={countDirectSubtasks(task)}
              />
            ))}

            {/* Completed section */}
            {completedTasks.length > 0 && (
              <>
                <button
                  onClick={() => toggleCompletedSection(listId)}
                  className="w-full flex items-center gap-2 py-2 px-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded transition-colors mt-4"
                >
                  {isCompletedCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                  <span className="font-medium">
                    Completed ({completedTasks.length})
                  </span>
                </button>

                {/* Completed tasks (only shown when expanded) */}
                {!isCompletedCollapsed && completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    listId={listId}
                    depth={task.depth || 0}
                    subtaskCount={countDirectSubtasks(task)}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
