import { useUIStore } from '@/stores/uiStore';
import { X } from 'lucide-react';

const TYPE_STYLES: Record<
  'success' | 'error' | 'info' | 'warning',
  { border: string; dot: string; label: string }
> = {
  success: {
    border: 'border-emerald-500/30',
    dot: 'bg-emerald-500',
    label: 'Success',
  },
  error: {
    border: 'border-red-500/30',
    dot: 'bg-red-500',
    label: 'Error',
  },
  info: {
    border: 'border-sky-500/30',
    dot: 'bg-sky-500',
    label: 'Info',
  },
  warning: {
    border: 'border-amber-500/30',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
};

export default function Notifications() {
  const notifications = useUIStore((s) => s.notifications);
  const removeNotification = useUIStore((s) => s.removeNotification);

  if (notifications.length === 0) return null;

  return (
    <div
      className="pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2"
      role="region"
      aria-label="Notifications"
      aria-live="polite"
      aria-relevant="additions removals"
    >
      {notifications.map((n) => {
        const style = TYPE_STYLES[n.type];
        return (
          <div
            key={n.id}
            className={`pointer-events-auto rounded-lg border ${style.border} bg-background/95 px-4 py-3 shadow-lg backdrop-blur`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1.5 flex h-4 w-4 items-center justify-center">
                <div className={`h-2 w-2 rounded-full ${style.dot}`} aria-hidden="true" />
              </div>

              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-muted-foreground">{style.label}</div>
                <div className="mt-0.5 break-words text-sm text-foreground">{n.message}</div>
              </div>

              <button
                type="button"
                className="rounded-md p-1 text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                onClick={() => removeNotification(n.id)}
                aria-label="Dismiss notification"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}


