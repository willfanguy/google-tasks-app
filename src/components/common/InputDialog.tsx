/**
 * InputDialog Component
 * Simple modal dialog for text input (replacement for prompt())
 */

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface InputDialogProps {
  isOpen: boolean;
  title: string;
  message?: string;
  placeholder?: string;
  defaultValue?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export default function InputDialog({
  isOpen,
  title,
  message,
  placeholder = '',
  defaultValue = '',
  onConfirm,
  onCancel,
}: InputDialogProps) {
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) {
      onConfirm(value.trim());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
        <div className="bg-card border border-border rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <button
              onClick={onCancel}
              className="p-1 hover:bg-accent rounded transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Message */}
          {message && (
            <p className="text-sm text-muted-foreground mb-4">{message}</p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              autoFocus
              className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground mb-4"
            />

            {/* Actions */}
            <div className="flex items-center gap-2 justify-end">
              <button
                type="button"
                onClick={onCancel}
                className="px-4 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors text-foreground"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!value.trim()}
                className="px-4 py-2 text-sm bg-primary hover:bg-primary/90 rounded-lg transition-colors text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
