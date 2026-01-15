/**
 * KeyboardShortcutsHelp Component
 * Modal showing all available keyboard shortcuts
 */

import { useEffect, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['j', '↓'], description: 'Move focus down' },
      { keys: ['k', '↑'], description: 'Move focus up' },
      { keys: ['Home'], description: 'Go to first task' },
      { keys: ['End'], description: 'Go to last task' },
      { keys: ['/'], description: 'Focus search input' },
    ],
  },
  {
    title: 'Task Actions',
    shortcuts: [
      { keys: ['n', '⌘N'], description: 'Create new task' },
      { keys: ['Enter', 'e'], description: 'Edit focused task' },
      { keys: ['Space'], description: 'Toggle task completion' },
      { keys: ['Delete', '⌫'], description: 'Delete focused/selected task(s)' },
      { keys: ['⌘A'], description: 'Select all tasks' },
    ],
  },
  {
    title: 'Views',
    shortcuts: [
      { keys: ['1'], description: 'All Tasks' },
      { keys: ['2'], description: 'Active' },
      { keys: ['3'], description: 'Completed' },
      { keys: ['4'], description: 'My Day' },
      { keys: ['5'], description: 'Due Today' },
    ],
  },
  {
    title: 'General',
    shortcuts: [
      { keys: ['?'], description: 'Show this help' },
      { keys: ['Esc'], description: 'Close modal / Clear selection' },
    ],
  },
];

export default function KeyboardShortcutsHelp() {
  const modals = useUIStore((s) => s.modals);
  const closeKeyboardHelp = useUIStore((s) => s.closeKeyboardHelp);
  const dialogRef = useRef<HTMLDivElement>(null);

  const isOpen = modals.keyboardHelp;

  // Focus management and keyboard handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        closeKeyboardHelp();
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => document.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, closeKeyboardHelp]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={closeKeyboardHelp}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-help-title"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="bg-card border border-border rounded-lg shadow-lg flex flex-col max-h-[80vh]">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Keyboard className="w-5 h-5 text-muted-foreground" />
              <h2 id="keyboard-help-title" className="text-lg font-semibold text-foreground">
                Keyboard Shortcuts
              </h2>
            </div>
            <button
              onClick={closeKeyboardHelp}
              aria-label="Close dialog"
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {shortcutGroups.map((group) => (
                <div key={group.title}>
                  <h3 className="text-sm font-semibold text-foreground mb-3">
                    {group.title}
                  </h3>
                  <div className="space-y-2">
                    {group.shortcuts.map((shortcut, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {shortcut.description}
                        </span>
                        <div className="flex items-center gap-1">
                          {shortcut.keys.map((key, keyIdx) => (
                            <span key={keyIdx} className="flex items-center gap-1">
                              {keyIdx > 0 && (
                                <span className="text-muted-foreground text-xs">or</span>
                              )}
                              <kbd className="px-2 py-1 bg-muted text-foreground rounded text-xs font-mono min-w-[24px] text-center">
                                {key}
                              </kbd>
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-muted/30">
            <p className="text-xs text-muted-foreground text-center">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Esc</kbd> to close
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
