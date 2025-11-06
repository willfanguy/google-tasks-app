/**
 * EmptyTaskLists Component
 * Empty state when no task lists exist
 */

import { Layout, ExternalLink } from 'lucide-react';
import { logger } from '../../utils/logger';

export default function EmptyTaskLists() {
  const handleOpenGoogleTasks = () => {
    logger.log('[EmptyTaskLists] Opening Google Tasks web app');
    // Open in external browser
    window.open('https://tasks.google.com', '_blank');
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Layout className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Task Lists Found
        </h3>

        <p className="text-sm text-muted-foreground mb-6">
          It looks like you don't have any task lists yet. Create your first list in Google Tasks to get started.
        </p>

        <button
          onClick={handleOpenGoogleTasks}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <ExternalLink className="w-4 h-4" />
          <span>Open Google Tasks</span>
        </button>

        <p className="text-xs text-muted-foreground mt-4">
          After creating lists, refresh this app to see them
        </p>
      </div>
    </div>
  );
}
