/**
 * ConfirmDialog Component
 * Modal dialog for confirmations (replacement for confirm())
 */

import { useEffect, useRef } from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'default';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Focus the cancel button by default for destructive actions
      confirmButtonRef.current?.focus();
    }
  }, [isOpen]);

  // Trap focus within dialog
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      } else if (e.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const confirmButtonClass = variant === 'danger'
    ? 'bg-red-600 hover:bg-red-700 text-white'
    : variant === 'warning'
    ? 'bg-amber-600 hover:bg-amber-700 text-white'
    : 'bg-primary hover:bg-primary/90 text-primary-foreground';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onCancel}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-message"
        className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              {variant === 'danger' && (
                <AlertTriangle className="w-5 h-5 text-red-500" />
              )}
              {variant === 'warning' && (
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              )}
              <h2 id="confirm-dialog-title" className="text-lg font-semibold text-foreground">
                {title}
              </h2>
            </div>
            <button
              onClick={onCancel}
              aria-label="Close dialog"
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Message */}
          <p id="confirm-dialog-message" className="text-sm text-muted-foreground mb-6">
            {message}
          </p>

          {/* Actions */}
          <div className="flex items-center gap-2 justify-end">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors text-foreground"
            >
              {cancelText}
            </button>
            <button
              ref={confirmButtonRef}
              onClick={onConfirm}
              className={`px-4 py-2 text-sm rounded-lg transition-colors ${confirmButtonClass}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
