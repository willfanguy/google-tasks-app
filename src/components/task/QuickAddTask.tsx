/**
 * QuickAddTask Component
 * Comprehensive modal for creating a new task with all options
 * Triggered by the floating action button
 */

import { useState, useEffect, useMemo } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useUIStore } from '../../stores/uiStore';
import { useLabelStore } from '../../stores/labelStore';
import { logger } from '../../utils/logger';
import { getColorClasses } from '../../utils/colorClasses';
import { parseTaskInput, ParsedToken } from '../../utils/taskParser';
import LabelPickerDropdown from '../common/LabelPickerDropdown';
import SmartDateInput from '../common/SmartDateInput';
import ParsedTaskPreview from '../common/ParsedTaskPreview';

export default function QuickAddTask() {
  const { modals, closeQuickAdd, selectedListId, parentTaskId } = useUIStore();
  const { taskLists, createTask, getTaskById } = useTaskStore();
  const { labels, getLabelById, getLabelByName } = useLabelStore();

  const [listId, setListId] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<'needsAction' | 'completed'>('needsAction');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parse title for natural language tokens
  const parsed = useMemo(() => parseTaskInput(title), [title]);

  // Handle removing a parsed token from title
  const handleRemoveToken = (token: ParsedToken) => {
    // Remove the raw token from the title
    const newTitle = title.replace(token.raw, '').replace(/\s+/g, ' ').trim();
    setTitle(newTitle);
  };

  // Set default list when modal opens (use selectedListId if available)
  useEffect(() => {
    if (modals.quickAdd && taskLists.length > 0) {
      if (selectedListId) {
        setListId(selectedListId);
      } else if (!listId) {
        setListId(taskLists[0].id);
      }
    }
  }, [modals.quickAdd, taskLists, listId, selectedListId]);

  // Get parent task for display
  const parentTask = parentTaskId && listId ? getTaskById(listId, parentTaskId) : null;

  if (!modals.quickAdd) {
    return null;
  }

  const handleClose = () => {
    logger.log('[QuickAddTask] Closing modal');
    // Reset form
    setTitle('');
    setNotes('');
    setDueDate('');
    setStatus('needsAction');
    setSelectedLabels([]);
    closeQuickAdd();
  };

  const handleCreate = async () => {
    // Use parsed title (with tokens removed) or fall back to raw title
    const finalTitle = parsed.title || title.trim();
    if (!finalTitle || !listId) {
      return;
    }

    logger.log('[QuickAddTask] Creating new task');
    setIsSubmitting(true);

    try {
      // Determine the target list - use parsed @list if specified
      let targetListId = listId;
      if (parsed.listName) {
        const matchingList = taskLists.find(
          l => l.title.toLowerCase() === parsed.listName!.toLowerCase()
        );
        if (matchingList) {
          targetListId = matchingList.id;
          logger.log(`[QuickAddTask] Using parsed list: ${matchingList.title}`);
        }
      }

      // Determine due date - prefer parsed date, then manual date picker
      let dueISO: string | undefined = undefined;
      const effectiveDueDate = parsed.dateFormatted || dueDate;
      if (effectiveDueDate) {
        const [year, month, day] = effectiveDueDate.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        dueISO = utcDate.toISOString();
      }

      // Merge parsed labels with manually selected labels
      const parsedLabelIds: string[] = [];
      for (const labelName of parsed.labels) {
        const existingLabel = getLabelByName(labelName);
        if (existingLabel) {
          parsedLabelIds.push(existingLabel.id);
        }
        // Note: We don't auto-create labels - user must create them first
      }
      const allLabelIds = [...new Set([...selectedLabels, ...parsedLabelIds])];

      await createTask(targetListId, {
        title: finalTitle,
        notes: notes.trim() || undefined,
        due: dueISO,
        status,
        labels: allLabelIds,
        parent: parentTaskId || undefined,
      });

      handleClose();
    } catch (error) {
      logger.error('[QuickAddTask] Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.metaKey) {
      handleCreate();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="quick-add-title"
        className="bg-card rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 id="quick-add-title" className="text-lg font-semibold text-foreground">
              {parentTask ? 'Create Subtask' : 'Create New Task'}
            </h2>
            {parentTask && (
              <p className="text-xs text-muted-foreground mt-1">
                Subtask of: {parentTask.title}
              </p>
            )}
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" onKeyDown={handleKeyDown}>
          {/* List selection */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              List
            </label>
            <select
              value={listId}
              onChange={(e) => setListId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
            >
              {taskLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
              placeholder="Task title... (try @list #label tomorrow)"
            />
            {/* Parsed tokens preview */}
            {parsed.tokens.length > 0 && (
              <div className="mt-2">
                <ParsedTaskPreview
                  parsed={parsed}
                  onRemoveToken={handleRemoveToken}
                />
                {parsed.title && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Task: "{parsed.title}"
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground resize-none"
              placeholder="Add notes..."
            />
          </div>

          {/* Due date */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Due Date
            </label>
            <SmartDateInput
              value={dueDate}
              onChange={setDueDate}
              placeholder="today, tomorrow, next monday..."
            />
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
              <LabelPickerDropdown
                labels={labels}
                selectedLabelIds={selectedLabels}
                onToggle={toggleLabel}
                variant="select"
              />
            </div>
          </div>

          {/* Status toggle */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={status === 'completed'}
                onChange={(e) => setStatus(e.target.checked ? 'completed' : 'needsAction')}
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
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 p-4 border-t border-border">
          <button
            onClick={handleClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-foreground hover:bg-accent rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!title.trim() || !listId || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                <span>Creating...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Create Task</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
