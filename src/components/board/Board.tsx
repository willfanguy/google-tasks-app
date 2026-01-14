/**
 * Board Component
 * Main Kanban board with horizontal scrolling task lists and drag-and-drop
 */

import { useEffect, useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import { Plus, ArrowUpDown } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useAuthStore } from '../../stores/authStore';
import { useBoardStore } from '../../stores/boardStore';
import { useUIStore } from '../../stores/uiStore';
import TaskList from './TaskList';
import EmptyTaskLists from './EmptyTaskLists';
import InputDialog from '../common/InputDialog';
import { Task } from '../../types/task';
import { sortTaskLists } from '../../utils/listSorting';
import { logger } from '../../utils/logger';

export default function Board() {
  // Auth store - only subscribe to authenticated state
  const authenticated = useAuthStore((s) => s.authenticated);

  // Task store - need multiple values, all related to tasks
  const taskLists = useTaskStore((s) => s.taskLists);
  const tasks = useTaskStore((s) => s.tasks);
  const loading = useTaskStore((s) => s.loading);
  const fetchTaskLists = useTaskStore((s) => s.fetchTaskLists);
  const moveTask = useTaskStore((s) => s.moveTask);
  const getTaskById = useTaskStore((s) => s.getTaskById);

  // Board store - layout functions
  const getBoardLayout = useBoardStore((s) => s.getBoardLayout);
  const reorderLists = useBoardStore((s) => s.reorderLists);
  const addListToBoard = useBoardStore((s) => s.addListToBoard);
  const removeListFromBoard = useBoardStore((s) => s.removeListFromBoard);

  // UI store - only specific values needed
  const listSortMode = useUIStore((s) => s.listSortMode);
  const setListSortMode = useUIStore((s) => s.setListSortMode);
  const addNotification = useUIStore((s) => s.addNotification);
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [activeListId, setActiveListId] = useState<string | null>(null);
  const [showCreateListDialog, setShowCreateListDialog] = useState(false);

  const boardId = 'default-board'; // Using default board for now
  const boardLayout = getBoardLayout(boardId);

  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement before drag starts
      },
    })
  );

  // Fetch task lists on mount
  useEffect(() => {
    if (authenticated) {
      logger.log('[Board] Fetching task lists...');
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  // Sync task lists with board store (add new lists to board)
  useEffect(() => {
    if (taskLists.length > 0 && boardLayout) {
      const currentOrder = boardLayout.listOrder;
      const allListIds = taskLists.map(l => l.id);

      // Add any new lists that aren't in the order yet (append to end)
      const newLists = allListIds.filter(id => !currentOrder.includes(id));
      if (newLists.length > 0) {
        logger.log('[Board] Adding new lists to board (appending to end):', newLists);
        newLists.forEach(listId => addListToBoard(boardId, listId));
      }

      // Remove any deleted lists from the order
      const deletedLists = currentOrder.filter(id => !allListIds.includes(id));
      if (deletedLists.length > 0) {
        logger.log('[Board] Removing deleted lists from board:', deletedLists);
        deletedLists.forEach(listId => removeListFromBoard(boardId, listId));
      }
    }
  }, [taskLists, boardLayout, addListToBoard, removeListFromBoard]);

  // Get ordered task lists based on board layout or sorting mode
  // First get the base order (manual order from board layout or API order)
  const baseOrderedLists = boardLayout?.listOrder && boardLayout.listOrder.length > 0
    ? boardLayout.listOrder
        .map(id => taskLists.find(list => list.id === id))
        .filter(Boolean)
    : taskLists;

  // Apply sorting based on selected mode
  const orderedTaskLists = sortTaskLists(
    baseOrderedLists as any[],
    tasks,
    listSortMode,
    boardLayout?.listOrder
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current as any;

    // Check if dragging a list or a task
    if (data.type === 'list') {
      logger.log('[Board] List drag started:', data.listId);
      setActiveListId(data.listId);
    } else if (data.taskId && data.listId) {
      logger.log('[Board] Task drag started:', data.taskId, data.listId);
      const task = getTaskById(data.listId, data.taskId);
      if (task) {
        setActiveTask(task);
      }
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveTask(null);
    setActiveListId(null);

    if (!over) {
      logger.log('[Board] Drag ended with no drop target');
      return;
    }

    const activeData = active.data.current as any;
    const overData = over.data.current as any;

    // Handle list reordering
    if (activeData.type === 'list' && overData.type === 'list') {
      const oldIndex = orderedTaskLists.findIndex(l => l?.id === activeData.listId);
      const newIndex = orderedTaskLists.findIndex(l => l?.id === overData.listId);

      if (oldIndex !== newIndex && oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(orderedTaskLists, oldIndex, newIndex);
        const newOrder = reordered.map(l => l!.id);
        logger.log('[Board] Reordering lists:', newOrder);
        reorderLists(boardId, newOrder);
      }
      return;
    }

    // Handle task moving (existing logic)
    if (activeData.taskId && activeData.listId) {
      const sourceListId = activeData.listId;
      const targetListId = overData.listId;
      const draggedTaskId = activeData.taskId;
      const targetTaskId = overData.taskId;

      logger.log('[Board] Task drag ended:', {
        sourceListId,
        targetListId,
        draggedTaskId,
        targetTaskId,
      });

      // If dropped in the same position, do nothing
      if (sourceListId === targetListId && draggedTaskId === targetTaskId) {
        return;
      }

      // Move task
      try {
        if (sourceListId !== targetListId) {
          // Moving to different list
          await moveTask(sourceListId, draggedTaskId, {
            destinationList: targetListId,
            previous: targetTaskId,
          });
        } else {
          // Reordering within same list
          await moveTask(sourceListId, draggedTaskId, {
            previous: targetTaskId,
          });
        }
      } catch (error) {
        logger.error('[Board] Failed to move task:', error);
        addNotification('error', 'Failed to move task');
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-sm text-muted-foreground">Loading task lists...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (taskLists.length === 0) {
    return <EmptyTaskLists />;
  }

  const handleCreateListClick = () => {
    setShowCreateListDialog(true);
  };

  const handleCreateListConfirm = async (title: string) => {
    logger.log('[Board] Creating new list:', title);
    const { createTaskList } = useTaskStore.getState();
    await createTaskList(title.trim());
    setShowCreateListDialog(false);
  };

  // Board with task lists
  return (
    <div className="h-full flex flex-col">
      {/* Sort controls */}
      <div className="flex-shrink-0 px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
          <label className="text-sm text-muted-foreground">Sort by:</label>
          <select
            value={listSortMode}
            onChange={(e) => setListSortMode(e.target.value as any)}
            className="text-sm bg-background border border-border rounded px-2 py-1 text-foreground cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="manual">Manual Order</option>
            <option value="name">Name (A-Z)</option>
            <option value="dueDate">Next Due Date</option>
            <option value="taskCount">Task Count</option>
          </select>
        </div>
      </div>

      {/* Board content */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={orderedTaskLists.map(l => l!.id)}
          strategy={horizontalListSortingStrategy}
        >
          <div className="flex-1 overflow-x-auto overflow-y-hidden">
            <div className="h-full flex gap-4 p-4 min-w-min">
            {orderedTaskLists.map((list) => (
              <TaskList key={list!.id} listId={list!.id} list={list!} />
            ))}

            {/* Create new list button */}
            <div className="w-80 flex-shrink-0">
              <button
                onClick={handleCreateListClick}
                className="w-full h-full min-h-[200px] flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border hover:border-primary hover:bg-accent/50 transition-colors"
              >
                <Plus className="w-8 h-8 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Create New List
                </span>
              </button>
            </div>

            {/* Create list dialog */}
            <InputDialog
              isOpen={showCreateListDialog}
              title="Create New List"
              message="Enter a name for the new list:"
              placeholder="List name"
              onConfirm={handleCreateListConfirm}
              onCancel={() => setShowCreateListDialog(false)}
            />
            </div>
          </div>
        </SortableContext>

        {/* Drag overlay */}
        <DragOverlay>
        {activeTask ? (
          <div className="w-80 p-3 rounded-lg border border-border bg-background shadow-xl opacity-90">
            <p className="text-sm text-foreground">{activeTask.title}</p>
          </div>
        ) : activeListId ? (
          <div className="w-80 h-[200px] bg-card rounded-lg border-2 border-primary shadow-2xl opacity-95 flex flex-col">
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">
                {taskLists.find(l => l.id === activeListId)?.title || 'Moving list...'}
              </h3>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <p className="text-xs text-muted-foreground">Drop to reorder</p>
            </div>
          </div>
        ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
