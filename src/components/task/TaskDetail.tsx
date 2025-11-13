/**
 * TaskDetail Component
 * Modal for viewing and editing task details
 */

import { useState, useEffect } from 'react';
import { X, Calendar, Trash2, Check, Plus } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useLabelStore } from '../../stores/labelStore';
import { Task } from '../../types/task';
import { getSubtasks } from '../../utils/taskHierarchy';
import { logger } from '../../utils/logger';

// Map colors to Tailwind classes
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string }> = {
    '#ef4444': { bg: 'bg-red-500', text: 'text-white' },
    '#f97316': { bg: 'bg-orange-500', text: 'text-white' },
    '#f59e0b': { bg: 'bg-amber-500', text: 'text-white' },
    '#84cc16': { bg: 'bg-lime-500', text: 'text-white' },
    '#22c55e': { bg: 'bg-green-500', text: 'text-white' },
    '#06b6d4': { bg: 'bg-cyan-500', text: 'text-white' },
    '#3b82f6': { bg: 'bg-blue-500', text: 'text-white' },
    '#8b5cf6': { bg: 'bg-violet-500', text: 'text-white' },
    '#ec4899': { bg: 'bg-pink-500', text: 'text-white' },
  };
  return colorMap[color] || colorMap['#3b82f6'];
};

export default function TaskDetail() {
  const { modals, selectedTaskId, selectedListId, closeTaskDetail, openQuickAdd } = useUIStore();
  const { getTaskById, updateTask, deleteTask, getTasksByList } = useTaskStore();
  const { getTaskLabels, setTaskLabels, getLabelById, getSortedLabels } = useLabelStore();
  const labels = getSortedLabels();

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'needsAction' | 'completed'>('needsAction');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [showLabelPicker, setShowLabelPicker] = useState(false);

  // Get the current task
  const task = selectedTaskId && selectedListId
    ? getTaskById(selectedListId, selectedTaskId)
    : null;

  // Update local state when task changes
  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setNotes(task.notes || '');
      // Convert RFC 3339 timestamp to YYYY-MM-DD using UTC
      if (task.due) {
        const date = new Date(task.due);
        const year = date.getUTCFullYear();
        const month = String(date.getUTCMonth() + 1).padStart(2, '0');
        const day = String(date.getUTCDate()).padStart(2, '0');
        setDueDate(`${year}-${month}-${day}`);
      } else {
        setDueDate('');
      }
      setStatus(task.status);
      // Load task labels
      const taskLabels = getTaskLabels(task.id);
      setSelectedLabels(taskLabels);
    }
  }, [task, getTaskLabels]);

  if (!modals.taskDetail || !task || !selectedListId) {
    return null;
  }

  const handleClose = () => {
    logger.log('[TaskDetail] Closing modal');
    closeTaskDetail();
  };

  const handleSave = async () => {
    logger.log('[TaskDetail] Saving task changes');

    // Convert YYYY-MM-DD to RFC 3339 timestamp at midnight UTC
    let dueISO: string | undefined = undefined;
    if (dueDate) {
      const [year, month, day] = dueDate.split('-').map(Number);
      const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      dueISO = utcDate.toISOString();
    }

    const updates: Partial<Task> = {
      title,
      notes: notes || undefined,
      due: dueISO,
      status,
    };

    await updateTask(selectedListId, task.id, updates);

    // Save labels
    setTaskLabels(task.id, selectedLabels);

    handleClose();
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this task?')) {
      logger.log('[TaskDetail] Deleting task');
      await deleteTask(selectedListId, task.id);
      handleClose();
    }
  };

  const handleToggleStatus = () => {
    setStatus(status === 'completed' ? 'needsAction' : 'completed');
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleAddSubtask = () => {
    logger.log('[TaskDetail] Add subtask clicked');
    // Close this modal and open QuickAdd with parent pre-filled
    closeTaskDetail();
    openQuickAdd(selectedListId, task.id);
  };

  const handleToggleSubtask = async (subtaskId: string, currentStatus: 'needsAction' | 'completed') => {
    logger.log('[TaskDetail] Toggling subtask completion:', subtaskId);
    const newStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
    await updateTask(selectedListId, subtaskId, { status: newStatus });
  };

  // Get subtasks for this task
  const allTasksInList = selectedListId ? getTasksByList(selectedListId) : [];
  const subtasks = getSubtasks(task.id, allTasksInList);

  // Only render if modal is open
  if (!modals.taskDetail) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-card rounded-lg shadow-xl w-full max-w-[840px] max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Task Details</h2>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder="Task title..."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
              placeholder="Add notes..."
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Due Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              />
            </div>
          </div>

          {/* Labels */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Labels
            </label>
            <div className="space-y-2">
              {/* Selected labels */}
              {selectedLabels.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedLabels.map(labelId => {
                    const label = getLabelById(labelId);
                    if (!label) return null;
                    return (
                      <button
                        key={labelId}
                        onClick={() => toggleLabel(labelId)}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(label.color).bg} ${getColorClasses(label.color).text} hover:opacity-80 transition-opacity`}
                      >
                        {label.name} ×
                      </button>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">No labels assigned</p>
              )}

              {/* Label picker */}
              <div className="relative">
                <button
                  onClick={() => setShowLabelPicker(!showLabelPicker)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Label</span>
                </button>

                {showLabelPicker && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setShowLabelPicker(false)}
                    />

                    {/* Dropdown */}
                    <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 p-2 max-h-60 overflow-y-auto">
                      {labels.length === 0 ? (
                        <p className="text-xs text-muted-foreground p-2 text-center">
                          No labels yet. Create one in the label manager!
                        </p>
                      ) : (
                        <div className="space-y-1">
                          {labels.map(label => {
                            const isSelected = selectedLabels.includes(label.id);
                            return (
                              <button
                                key={label.id}
                                onClick={() => toggleLabel(label.id)}
                                className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors ${
                                  isSelected ? 'bg-accent' : ''
                                }`}
                              >
                                <div
                                  className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(label.color).bg} ${getColorClasses(label.color).text}`}
                                >
                                  {label.name}
                                </div>
                                {isSelected && (
                                  <Check className="w-4 h-4 text-primary ml-auto" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={status === 'completed'}
                onChange={handleToggleStatus}
                className="sr-only"
              />
              <div
                className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                  status === 'completed'
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground'
                }`}
              >
                {status === 'completed' && <Check className="w-4 h-4 text-primary-foreground" />}
              </div>
              <span className="text-sm text-foreground">Mark as completed</span>
            </label>
          </div>

          {/* Subtasks section */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-foreground">
                Subtasks
              </label>
              <button
                onClick={handleAddSubtask}
                className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-accent rounded transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Subtask</span>
              </button>
            </div>
            {subtasks.length === 0 ? (
              <p className="text-xs text-muted-foreground">No subtasks yet</p>
            ) : (
              <div className="space-y-1.5">
                {subtasks.map(subtask => (
                  <div
                    key={subtask.id}
                    className="flex items-center gap-2 p-2 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                  >
                    <button
                      onClick={() => handleToggleSubtask(subtask.id, subtask.status)}
                      className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 cursor-pointer transition-colors hover:scale-110 ${
                        subtask.status === 'completed'
                          ? 'bg-primary border-primary'
                          : 'border-muted-foreground hover:border-primary'
                      }`}
                    >
                      {subtask.status === 'completed' && (
                        <Check className="w-3 h-3 text-primary-foreground" />
                      )}
                    </button>
                    <span
                      className={`text-xs flex-1 ${
                        subtask.status === 'completed'
                          ? 'line-through text-muted-foreground'
                          : 'text-foreground'
                      }`}
                    >
                      {subtask.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-border">
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span>Delete</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
