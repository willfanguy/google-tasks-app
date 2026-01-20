/**
 * BulkEditToolbar Component
 * Toolbar for bulk editing selected tasks (due dates, labels, lists)
 */

import { useState } from 'react';
import { X, Calendar, Tag, Minus, List, Check } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useTaskStore } from '../../stores/taskStore';
import { useLabelStore } from '../../stores/labelStore';
import { useUIStore } from '../../stores/uiStore';
import { logger } from '../../utils/logger';

export default function BulkEditToolbar() {
  const {
    selectedTaskIds,
    clearSelection,
    isSelectionMode,
  } = useSelectionStore();
  const { taskLists, bulkUpdateTasks } = useTaskStore();
  const { labels } = useLabelStore();
  const addNotification = useUIStore((s) => s.addNotification);

  const [dueDate, setDueDate] = useState<string>('');
  const [selectedListId, setSelectedListId] = useState<string>('');
  const [selectedLabelIds, setSelectedLabelIds] = useState<string[]>([]);
  const [removeLabelIds, setRemoveLabelIds] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  if (!isSelectionMode || selectedTaskIds.size === 0) {
    return null;
  }

  const selectedCount = selectedTaskIds.size;
  const selectedTaskIdsArray = Array.from(selectedTaskIds);

  const handleApply = async () => {
    setIsApplying(true);
    try {
      const updates: {
        dueDate?: string | null;
        listId?: string;
        labelIds?: string[];
        removeLabelIds?: string[];
      } = {};

      // Convert YYYY-MM-DD to RFC 3339 timestamp at midnight UTC
      if (dueDate) {
        const [year, month, day] = dueDate.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        updates.dueDate = utcDate.toISOString();
      }
      if (selectedListId) {
        updates.listId = selectedListId;
      }
      if (selectedLabelIds.length > 0) {
        updates.labelIds = selectedLabelIds;
      }
      if (removeLabelIds.length > 0) {
        updates.removeLabelIds = removeLabelIds;
      }

      await bulkUpdateTasks(selectedTaskIdsArray, updates);

      // Clear the form and selection
      setDueDate('');
      setSelectedListId('');
      setSelectedLabelIds([]);
      setRemoveLabelIds([]);
      clearSelection();
    } catch (error) {
      logger.error('[BulkEditToolbar] Failed to apply bulk updates:', error);
      addNotification('error', 'Failed to apply bulk updates');
    } finally {
      setIsApplying(false);
    }
  };

  const handleClear = () => {
    setDueDate('');
    setSelectedListId('');
    setSelectedLabelIds([]);
    setRemoveLabelIds([]);
    clearSelection();
  };

  const handleClearDueDate = () => {
    setDueDate('');
  };

  const toggleLabel = (labelId: string) => {
    setSelectedLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const toggleRemoveLabel = (labelId: string) => {
    setRemoveLabelIds((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const hasChanges =
    dueDate !== '' || selectedListId !== '' || selectedLabelIds.length > 0 || removeLabelIds.length > 0;

  return (
    <div className="border-b bg-muted/30 px-4 py-3">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Check className="w-4 h-4 text-primary" />
            <span>{selectedCount} selected</span>
          </div>

          {/* Due Date Picker */}
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="px-2 py-1 text-xs border rounded bg-background"
              placeholder="Set due date"
            />
            {dueDate && (
              <button
                onClick={handleClearDueDate}
                className="p-1 hover:bg-accent rounded"
                title="Clear due date"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* List Selector */}
          <div className="flex items-center gap-2">
            <List className="w-4 h-4 text-muted-foreground" />
            <select
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="">Move to list...</option>
              {taskLists.map((list) => (
                <option key={list.id} value={list.id}>
                  {list.title}
                </option>
              ))}
            </select>
          </div>

          {/* Add Labels Selector */}
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-green-600" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleLabel(e.target.value);
                }
              }}
              className="px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="">
                {selectedLabelIds.length > 0
                  ? `+${selectedLabelIds.length} to add`
                  : 'Add labels...'}
              </option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {selectedLabelIds.includes(label.id) ? '✓ ' : ''}
                  {label.name}
                </option>
              ))}
            </select>
          </div>

          {/* Remove Labels Selector */}
          <div className="flex items-center gap-2">
            <Minus className="w-4 h-4 text-red-600" />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  toggleRemoveLabel(e.target.value);
                }
              }}
              className="px-2 py-1 text-xs border rounded bg-background"
            >
              <option value="">
                {removeLabelIds.length > 0
                  ? `-${removeLabelIds.length} to remove`
                  : 'Remove labels...'}
              </option>
              {labels.map((label) => (
                <option key={label.id} value={label.id}>
                  {removeLabelIds.includes(label.id) ? '✓ ' : ''}
                  {label.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleApply}
            disabled={!hasChanges || isApplying}
            className="px-3 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isApplying ? 'Applying...' : 'Apply'}
          </button>
          <button
            onClick={handleClear}
            className="px-3 py-1 text-xs font-medium rounded hover:bg-accent"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Selected Labels Display */}
      {(selectedLabelIds.length > 0 || removeLabelIds.length > 0) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {/* Labels to add */}
          {selectedLabelIds.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-green-600 font-medium">Add:</span>
              {selectedLabelIds.map((labelId) => {
                const label = labels.find((l) => l.id === labelId);
                if (!label) return null;
                return (
                  <button
                    key={`add-${labelId}`}
                    onClick={() => toggleLabel(labelId)}
                    className="px-2 py-0.5 text-xs rounded-full font-medium bg-green-600 text-white hover:bg-green-700 flex items-center gap-1"
                  >
                    {label.name}
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}
          {/* Labels to remove */}
          {removeLabelIds.length > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-xs text-red-600 font-medium">Remove:</span>
              {removeLabelIds.map((labelId) => {
                const label = labels.find((l) => l.id === labelId);
                if (!label) return null;
                return (
                  <button
                    key={`remove-${labelId}`}
                    onClick={() => toggleRemoveLabel(labelId)}
                    className="px-2 py-0.5 text-xs rounded-full font-medium bg-red-600 text-white hover:bg-red-700 flex items-center gap-1"
                  >
                    {label.name}
                    <X className="w-3 h-3" />
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
