/**
 * AlertDialog Component
 * Simple modal dialog for alerts (replacement for alert())
 */

import { X } from 'lucide-react';

interface AlertDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
}

export default function AlertDialog({
  isOpen,
  title,
  message,
  onClose,
}: AlertDialogProps) {
  if (!isOpen) return null;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' || e.key === 'Enter') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6" onKeyDown={handleKeyDown}>
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Message */}
          <p className="text-sm text-muted-foreground mb-4">{message}</p>

          {/* Action */}
          <div className="flex items-center justify-end">
            <button
              onClick={onClose}
              autoFocus
              className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 rounded-lg transition-colors text-primary-foreground"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
