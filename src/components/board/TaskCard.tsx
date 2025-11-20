/**
 * TaskCard Component
 * Individual task card with checkbox, title, due date, and labels (draggable)
 * Supports hierarchical display with indentation and subtask counts
 */

import {
  Calendar,
  FileText,
  CheckSquare,
  ChevronRight,
  ChevronDown,
  Flag,
  CheckCheck,
  Square,
} from "lucide-react";
import { useDraggable } from "@dnd-kit/core";
import { Task } from "../../types/task";
import { PRIORITY_LEVELS } from "../../types/priority";
import { useTaskStore } from "../../stores/taskStore";
import { useUIStore } from "../../stores/uiStore";
import { useLabelStore } from "../../stores/labelStore";
import { useSelectionStore } from "../../stores/selectionStore";
import { TaskWithChildren } from "../../utils/taskHierarchy";
import { logger } from "../../utils/logger";

// Map colors to Tailwind classes
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    "#ef4444": { bg: "bg-red-500", text: "text-white" },
    "#f97316": { bg: "bg-orange-500", text: "text-white" },
    "#f59e0b": { bg: "bg-amber-500", text: "text-white" },
    "#84cc16": { bg: "bg-lime-500", text: "text-white" },
    "#22c55e": { bg: "bg-green-500", text: "text-white" },
    "#06b6d4": { bg: "bg-cyan-500", text: "text-white" },
    "#3b82f6": { bg: "bg-blue-500", text: "text-white" },
    "#8b5cf6": { bg: "bg-violet-500", text: "text-white" },
    "#ec4899": { bg: "bg-pink-500", text: "text-white" },
  };
  return colorMap[color] || colorMap["#3b82f6"];
};

interface TaskCardProps {
  task: Task | TaskWithChildren;
  listId: string;
  depth?: number;
  subtaskCount?: number;
  showListName?: boolean; // Show list name badge for unified view
}

export default function TaskCard({
  task,
  listId,
  depth = 0,
  subtaskCount = 0,
  showListName = false,
}: TaskCardProps) {
  const { toggleTaskStatus } = useTaskStore();
  const { openTaskDetail, toggleTaskCollapse, isTaskCollapsed } = useUIStore();
  const { getTaskLabels, getLabelById, getTaskPriority } = useLabelStore();
  const { isSelectionMode, isTaskSelected, toggleTaskSelection } = useSelectionStore();

  // Get task priority
  const taskPriority = getTaskPriority(task.id);
  const hasPriority = taskPriority !== undefined;

  // Setup draggable
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `task-${task.id}`,
      data: {
        taskId: task.id,
        listId,
      },
    });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleCheckboxClick = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail modal
    logger.log(`[TaskCard] Toggling task status: ${task.id}`);
    await toggleTaskStatus(listId, task.id);
  };

  const handleCardClick = () => {
    // In selection mode, clicking the card toggles selection
    if (isSelectionMode) {
      logger.log(`[TaskCard] Toggling task selection: ${task.id}`);
      toggleTaskSelection(task.id);
    } else {
      // Otherwise, open the task detail
      logger.log(`[TaskCard] Opening task detail: ${task.id}`);
      openTaskDetail(task.id, listId);
    }
  };

  const handleCollapseClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail modal
    logger.log(`[TaskCard] Toggling collapse for task: ${task.id}`);
    toggleTaskCollapse(task.id);
  };

  const handleSelectionCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent opening detail modal
    logger.log(`[TaskCard] Toggling task selection: ${task.id}`);
    toggleTaskSelection(task.id);
  };

  const isCompleted = task.status === "completed";
  const isSelected = isTaskSelected(task.id);
  const hasNotes = task.notes && task.notes.length > 0;
  const hasDueDate = task.due !== undefined;
  const hasSubtasks = subtaskCount > 0;
  const isSubtask = depth > 0;
  const isCollapsed = isTaskCollapsed(task.id);

  // Calculate left padding based on depth (30px per level)
  const leftPadding = depth * 30;

  // Get task labels
  const taskLabelIds = getTaskLabels(task.id);
  const taskLabels = taskLabelIds
    .map((labelId) => getLabelById(labelId))
    .filter(Boolean);

  // Format due date
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);

    // Get today's date in UTC
    const now = new Date();
    const todayUTC = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowUTC = Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );

    // Get the due date in UTC
    const dueDateUTC = Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate()
    );

    if (dueDateUTC === todayUTC) {
      return "Today";
    } else if (dueDateUTC === tomorrowUTC) {
      return "Tomorrow";
    } else {
      // Format using UTC date components
      const year = date.getUTCFullYear();
      const month = date.getUTCMonth();
      const day = date.getUTCDate();
      const localDate = new Date(year, month, day);
      return localDate.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  };

  // Check if overdue (using UTC for comparison)
  const isOverdue =
    hasDueDate &&
    (() => {
      if (isCompleted) return false;
      const date = new Date(task.due!);
      const now = new Date();
      const todayUTC = Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const dueDateUTC = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      );
      return dueDateUTC < todayUTC;
    })();

  // Check if due today (for styling)
  const isDueToday =
    hasDueDate &&
    (() => {
      const date = new Date(task.due!);
      const now = new Date();
      const todayUTC = Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
      );
      const dueDateUTC = Date.UTC(
        date.getUTCFullYear(),
        date.getUTCMonth(),
        date.getUTCDate()
      );
      return dueDateUTC === todayUTC;
    })();

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, marginLeft: `${leftPadding}px` }}
      {...attributes}
      {...listeners}
      onClick={handleCardClick}
      className={`p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors relative ${
        isSelectionMode ? "cursor-pointer" : "cursor-grab active:cursor-grabbing"
      } ${isCompleted ? "opacity-70" : ""} ${isDragging ? "opacity-50" : ""} ${
        isSelected ? "ring-2 ring-primary bg-accent/30" : ""
      } ${
        isOverdue && !isCompleted
          ? "border-l-4 border-l-red-500 border-t border-r border-b border-border"
          : isDueToday && !isCompleted
            ? "border-l-4 border-l-blue-500 border-t border-r border-b border-border"
            : "border-border"
      } ${isSubtask ? "border-l-2 border-l-muted-foreground/30" : ""}`}
    >
      {/* Title and checkbox */}
      <div className="flex items-start gap-2">
        {/* Selection checkbox (only shown in selection mode) */}
        {isSelectionMode && (
          <button
            onClick={handleSelectionCheckboxClick}
            className="mt-0.5 flex-shrink-0"
            title={isSelected ? "Deselect task" : "Select task"}
          >
            {isSelected ? (
              <CheckSquare className="w-5 h-5 text-blue-600 fill-blue-600" />
            ) : (
              <Square className="w-5 h-5 text-muted-foreground hover:text-blue-600 transition-colors" />
            )}
          </button>
        )}
        {/* Collapse/expand button for parent tasks */}
        {hasSubtasks && (
          <button
            onClick={handleCollapseClick}
            className="mt-0.5 flex-shrink-0 hover:bg-accent rounded p-0.5 transition-colors"
            title={isCollapsed ? "Expand subtasks" : "Collapse subtasks"}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>
        )}
        {isSubtask && (
          <ChevronRight className="w-4 h-4 mt-0.5 text-muted-foreground flex-shrink-0" />
        )}
        <button onClick={handleCheckboxClick} className="mt-0.5 flex-shrink-0">
          <div
            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
              isCompleted
                ? "bg-primary border-primary"
                : "border-muted-foreground hover:border-primary"
            }`}
          >
            {isCompleted && (
              <CheckSquare className="w-4 h-4 text-primary-foreground" />
            )}
          </div>
        </button>
        <div className="flex-1 min-w-0">
          <p
            className={`text-sm text-foreground ${
              isCompleted ? "line-through text-muted-foreground" : ""
            }`}
          >
            {task.title}
          </p>
          {hasSubtasks && (
            <p className="text-xs text-muted-foreground mt-1">
              {subtaskCount} {subtaskCount === 1 ? "subtask" : "subtasks"}
            </p>
          )}
          {hasNotes && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {task.notes}
            </p>
          )}
        </div>
      </div>

      {/* Metadata row */}
      {(hasDueDate || hasNotes || hasPriority || showListName) && (
        <div className="mt-2 flex items-center gap-3 text-xs">
          {/* List name badge (for unified view) */}
          {showListName && task.listTitle && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
              <span>{task.listTitle}</span>
            </div>
          )}

          {/* Priority */}
          {hasPriority && (
            <div
              className="flex items-center gap-1 font-medium"
              style={{ color: PRIORITY_LEVELS[taskPriority!].color }}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>{PRIORITY_LEVELS[taskPriority!].label}</span>
            </div>
          )}

          {/* Due date */}
          {hasDueDate && (
            <div
              className={`flex items-center gap-1 ${
                isOverdue
                  ? "text-destructive"
                  : isDueToday
                    ? "text-blue-600 font-medium"
                    : "text-muted-foreground"
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{formatDueDate(task.due!)}</span>
            </div>
          )}

          {/* Notes indicator */}
          {hasNotes && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <FileText className="w-3.5 h-3.5" />
            </div>
          )}
        </div>
      )}

      {/* Labels */}
      {taskLabels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {taskLabels.map((label) => (
            <span
              key={label!.id}
              className={`px-2 py-0.5 text-xs rounded-full font-medium ${getColorClasses(label!.color).bg} ${getColorClasses(label!.color).text}`}
            >
              {label!.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
