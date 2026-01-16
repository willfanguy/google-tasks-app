/**
 * FilterBar Component
 * Toolbar with view toggle, views/filters/sort popovers, and task actions
 */

import { X, RefreshCw, Tag, CheckCheck, LayoutGrid, List } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useSelectionStore } from '../../stores/selectionStore';
import ViewsPopover from './ViewsPopover';
import FilterPopover from './FilterPopover';
import SortPopover from './SortPopover';

export default function FilterBar() {
  const {
    clearFilters,
    clearSortOptions,
    hasActiveFilters,
    hasActiveSorts,
  } = useFilterStore();
  const { viewMode, setViewMode, openLabelManager } = useUIStore();
  const { syncAll, loading } = useTaskStore();
  const { isSelectionMode, exitSelectionMode, enterSelectionMode } = useSelectionStore();

  const filtersActive = hasActiveFilters();
  const sortsActive = hasActiveSorts();
  const hasAnythingActive = filtersActive || sortsActive;

  const handleClearAll = () => {
    clearFilters();
    clearSortOptions();
  };

  const handleSync = async () => {
    await syncAll();
  };

  const handleToggleSelectionMode = () => {
    if (isSelectionMode) {
      exitSelectionMode();
    } else {
      enterSelectionMode();
    }
  };

  return (
    <div className="h-12 border-b border-border bg-card flex items-center gap-2 px-4 flex-shrink-0">
      {/* View mode toggle */}
      <div className="flex items-center rounded-lg border border-border overflow-hidden">
        <button
          type="button"
          onClick={() => setViewMode('board')}
          className={`px-2.5 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
            viewMode === 'board' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          }`}
          title="Board view"
        >
          <LayoutGrid className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Board</span>
        </button>
        <button
          type="button"
          onClick={() => setViewMode('list')}
          className={`px-2.5 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${
            viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
          }`}
          title="List view"
        >
          <List className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">List</span>
        </button>
      </div>

      {/* Divider */}
      <div className="w-px h-6 bg-border" />

      {/* Views popover */}
      <ViewsPopover />

      {/* Filter popover */}
      <FilterPopover />

      {/* Sort popover - only show in list view */}
      {viewMode === 'list' && <SortPopover />}

      {/* Clear all button */}
      {hasAnythingActive && (
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          title="Clear all filters and sorts"
        >
          <X className="w-4 h-4" />
          <span className="hidden sm:inline text-xs">Clear</span>
        </button>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Sync button */}
      <button
        onClick={handleSync}
        disabled={loading}
        className="p-1.5 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        title="Sync with Google Tasks"
        aria-label="Sync with Google Tasks"
      >
        <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
      </button>

      {/* Selection mode toggle */}
      <button
        onClick={handleToggleSelectionMode}
        className={`p-1.5 rounded-lg transition-colors ${
          isSelectionMode
            ? 'bg-primary text-primary-foreground'
            : 'hover:bg-accent'
        }`}
        title={isSelectionMode ? 'Exit selection mode' : 'Enter selection mode'}
        aria-label={isSelectionMode ? 'Exit selection mode' : 'Enter selection mode'}
        aria-pressed={isSelectionMode}
      >
        <CheckCheck className={`w-4 h-4 ${isSelectionMode ? '' : 'text-muted-foreground'}`} />
      </button>

      {/* Labels button */}
      <button
        onClick={openLabelManager}
        className="p-1.5 rounded-lg hover:bg-accent transition-colors"
        title="Manage Labels"
        aria-label="Manage Labels"
      >
        <Tag className="w-4 h-4 text-muted-foreground" />
      </button>
    </div>
  );
}
