/**
 * FloatingAddButton Component
 * Floating action button in bottom-right corner to quickly add tasks
 */

import { Plus } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { logger } from '../../utils/logger';

export default function FloatingAddButton() {
  const { openQuickAdd } = useUIStore();

  const handleClick = () => {
    logger.log('[FloatingAddButton] Opening quick add modal');
    openQuickAdd();
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-6 right-6 w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg hover:shadow-xl hover:scale-110 active:scale-95 transition-all duration-200 flex items-center justify-center z-40"
      title="Create new task"
    >
      <Plus className="w-6 h-6" />
    </button>
  );
}
