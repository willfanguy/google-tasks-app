/**
 * GlobalQuickAdd Component
 * Minimal floating window for capturing tasks from anywhere
 * Triggered by global shortcut (Cmd/Ctrl+Shift+N)
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, X, ChevronDown } from 'lucide-react';
import { useTaskStore } from '../../stores/taskStore';
import { useLabelStore } from '../../stores/labelStore';
import { parseTaskInput, ParsedToken } from '../../utils/taskParser';
import ParsedTaskPreview from '../common/ParsedTaskPreview';
import { logger } from '../../utils/logger';

export default function GlobalQuickAdd() {
  const { taskLists, createTask, fetchTaskLists } = useTaskStore();
  const { getLabelByName } = useLabelStore();

  const [title, setTitle] = useState('');
  const [selectedListId, setSelectedListId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showListDropdown, setShowListDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Parse title for natural language tokens
  const parsed = useMemo(() => parseTaskInput(title), [title]);

  // Load task lists on mount
  useEffect(() => {
    fetchTaskLists();
  }, [fetchTaskLists]);

  // Set default list when lists load
  useEffect(() => {
    if (taskLists.length > 0 && !selectedListId) {
      setSelectedListId(taskLists[0].id);
    }
  }, [taskLists, selectedListId]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle removing a parsed token from title
  const handleRemoveToken = (token: ParsedToken) => {
    const newTitle = title.replace(token.raw, '').replace(/\s+/g, ' ').trim();
    setTitle(newTitle);
  };

  // Get the target list (parsed @list or selected list)
  const getTargetListId = (): string => {
    if (parsed.listName) {
      const matchingList = taskLists.find(
        l => l.title.toLowerCase() === parsed.listName!.toLowerCase()
      );
      if (matchingList) {
        return matchingList.id;
      }
    }
    return selectedListId;
  };

  // Get the target list name for display
  const getTargetListName = (): string => {
    const targetId = getTargetListId();
    const list = taskLists.find(l => l.id === targetId);
    return list?.title || 'Select list...';
  };

  // Hide the window
  const handleClose = () => {
    window.electronAPI?.quickAddHide();
  };

  // Create the task
  const handleCreate = async () => {
    const finalTitle = parsed.title || title.trim();
    const targetListId = getTargetListId();

    if (!finalTitle || !targetListId) {
      return;
    }

    logger.log('[GlobalQuickAdd] Creating task:', finalTitle);
    setIsSubmitting(true);

    try {
      // Convert parsed date to ISO format
      let dueISO: string | undefined = undefined;
      if (parsed.dateFormatted) {
        const [year, month, day] = parsed.dateFormatted.split('-').map(Number);
        const utcDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
        dueISO = utcDate.toISOString();
      }

      // Get label IDs from parsed label names
      const labelIds: string[] = [];
      for (const labelName of parsed.labels) {
        const label = getLabelByName(labelName);
        if (label) {
          labelIds.push(label.id);
        }
      }

      await createTask(targetListId, {
        title: finalTitle,
        due: dueISO,
        labels: labelIds,
      });

      // Success! Clear and hide
      setTitle('');
      handleClose();
    } catch (error) {
      logger.error('[GlobalQuickAdd] Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreate();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <div className="h-screen w-screen bg-background flex flex-col overflow-hidden select-none">
      {/* Drag handle / header */}
      <div
        className="h-8 flex items-center justify-between px-3 bg-muted/50"
        style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
      >
        <span className="text-xs text-muted-foreground font-medium">Quick Add Task</span>
        <button
          onClick={handleClose}
          className="p-1 rounded hover:bg-accent transition-colors"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-3 flex flex-col gap-2">
        {/* Task input */}
        <div className="flex gap-2">
          {/* List selector */}
          <div className="relative">
            <button
              onClick={() => setShowListDropdown(!showListDropdown)}
              className="h-10 px-3 bg-muted rounded-lg text-sm flex items-center gap-1.5 hover:bg-accent transition-colors min-w-[100px] max-w-[140px]"
            >
              <span className="truncate">{getTargetListName()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            </button>

            {/* List dropdown */}
            {showListDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10 py-1 max-h-48 overflow-y-auto">
                {taskLists.map(list => (
                  <button
                    key={list.id}
                    onClick={() => {
                      setSelectedListId(list.id);
                      setShowListDropdown(false);
                    }}
                    className={`w-full px-3 py-2 text-sm text-left hover:bg-accent transition-colors ${
                      list.id === selectedListId ? 'bg-accent/50 font-medium' : ''
                    }`}
                  >
                    {list.title}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Title input */}
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Task title... (@list #label tomorrow)"
            className="flex-1 h-10 px-3 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>

        {/* Parsed tokens preview */}
        {parsed.tokens.length > 0 && (
          <div className="flex items-center gap-2">
            <ParsedTaskPreview
              parsed={parsed}
              onRemoveToken={handleRemoveToken}
              className="flex-1"
            />
          </div>
        )}

        {/* Clean title preview */}
        {parsed.tokens.length > 0 && parsed.title && (
          <p className="text-xs text-muted-foreground px-1">
            Task: "{parsed.title}"
          </p>
        )}
      </div>

      {/* Footer with actions */}
      <div className="h-12 px-3 flex items-center justify-between border-t border-border bg-muted/30">
        <span className="text-xs text-muted-foreground">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Enter</kbd> to create, <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> to close
        </span>
        <button
          onClick={handleCreate}
          disabled={!parsed.title && !title.trim() || isSubmitting}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              <span>Creating...</span>
            </>
          ) : (
            <>
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
