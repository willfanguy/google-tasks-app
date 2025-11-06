/**
 * EmptyBoard Component
 * Empty state when no boards exist
 */

import { Layout, Plus } from 'lucide-react';
import { logger } from '../../utils/logger';
import { useUIStore } from '../../stores/uiStore';

export default function EmptyBoard() {
  const { openCreateBoard } = useUIStore();

  const handleCreateBoard = () => {
    logger.log('[EmptyBoard] Create board clicked');
    openCreateBoard();
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center max-w-md px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Layout className="w-8 h-8 text-primary" />
        </div>

        <h3 className="text-lg font-semibold text-foreground mb-2">
          No Boards Yet
        </h3>

        <p className="text-sm text-muted-foreground mb-6">
          Create your first board to start organizing your tasks in a Kanban view.
        </p>

        <button
          onClick={handleCreateBoard}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Create Board</span>
        </button>
      </div>
    </div>
  );
}
