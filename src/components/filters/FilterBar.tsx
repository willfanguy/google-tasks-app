/**
 * FilterBar Component
 * Compact toolbar with search, filter popover, and sort popover
 */

import { Search, LayoutGrid, List, X } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { useUIStore } from '../../stores/uiStore';
import FilterPopover from './FilterPopover';
import SortPopover from './SortPopover';

export default function FilterBar() {
  const {
    activeFilters,
    setSearchQuery,
    clearFilters,
    clearSortOptions,
    hasActiveFilters,
    hasActiveSorts,
  } = useFilterStore();
  const { viewMode, setViewMode } = useUIStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const filtersActive = hasActiveFilters();
  const sortsActive = hasActiveSorts();
  const hasAnythingActive = filtersActive || sortsActive;

  const handleClearAll = () => {
    clearFilters();
    clearSortOptions();
  };

  return (
    <div className="h-14 border-b border-border bg-card flex items-center gap-3 px-4 flex-shrink-0">
      {/* View mode toggle */}
      <div className="flex items-center gap-1 bg-accent rounded-lg p-1">
        <button
          onClick={() => setViewMode('board')}
          className={`p-2 rounded transition-colors ${
            viewMode === 'board'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-accent-foreground hover:text-accent-foreground/80'
          }`}
          title="Board View"
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`p-2 rounded transition-colors ${
            viewMode === 'list'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-accent-foreground hover:text-accent-foreground/80'
          }`}
          title="List View"
        >
          <List className="w-4 h-4" />
        </button>
      </div>

      {/* Search input */}
      <div className="flex-1 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          id="search-input"
          type="text"
          placeholder="Search tasks..."
          value={activeFilters.search}
          onChange={handleSearchChange}
          className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
        />
      </div>

      {/* Filter popover */}
      <FilterPopover />

      {/* Sort popover - only show in list view */}
      {viewMode === 'list' && <SortPopover />}

      {/* Clear all button */}
      {hasAnythingActive && (
        <button
          onClick={handleClearAll}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
          title="Clear all filters and sorts"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      )}
    </div>
  );
}
