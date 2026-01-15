/**
 * FilterBar Component
 * Search, filter, and sort controls for tasks
 */

import { Search, Filter, X, LayoutGrid, List, Flag } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { useLabelStore } from '../../stores/labelStore';
import { useUIStore } from '../../stores/uiStore';
import { Priority, PRIORITY_LEVELS, PRIORITY_OPTIONS } from '../../types/priority';
import { logger } from '../../utils/logger';
import LabelPickerDropdown from '../common/LabelPickerDropdown';

export default function FilterBar() {
  const {
    activeFilters,
    setSearchQuery,
    setStatusFilter,
    setPriorityFilter,
    toggleLabelFilter,
    toggleExcludeLabelFilter,
    clearFilters,
    hasActiveFilters,
  } = useFilterStore();
  const { getSortedLabels } = useLabelStore();
  const labels = getSortedLabels();
  const { viewMode, setViewMode } = useUIStore();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setStatusFilter(undefined);
    } else {
      setStatusFilter(value as 'needsAction' | 'completed');
    }
  };

  const handlePriorityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value === 'all') {
      setPriorityFilter(undefined);
    } else {
      setPriorityFilter(value as Priority);
    }
  };

  const handleClearFilters = () => {
    logger.log('[FilterBar] Clearing filters');
    clearFilters();
  };

  const filtersActive = hasActiveFilters();

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

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <select
          value={activeFilters.status || 'all'}
          onChange={handleStatusChange}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
        >
          <option value="all">All Tasks</option>
          <option value="needsAction">Active</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-2">
        <Flag
          className="w-4 h-4"
          style={{ color: activeFilters.priority ? PRIORITY_LEVELS[activeFilters.priority].color : undefined }}
        />
        <select
          value={activeFilters.priority || 'all'}
          onChange={handlePriorityChange}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
          style={{
            color: activeFilters.priority ? PRIORITY_LEVELS[activeFilters.priority].color : undefined,
            fontWeight: activeFilters.priority ? '600' : undefined
          }}
        >
          <option value="all">All Priorities</option>
          {PRIORITY_OPTIONS.map((p) => (
            <option key={p} value={p}>
              {PRIORITY_LEVELS[p].label}
            </option>
          ))}
        </select>
      </div>

      {/* Label filter */}
      <LabelPickerDropdown
        labels={labels}
        selectedLabelIds={activeFilters.labels}
        onToggle={toggleLabelFilter}
        variant="filter"
      />

      {/* Exclude Label filter */}
      <LabelPickerDropdown
        labels={labels}
        selectedLabelIds={activeFilters.excludeLabels}
        onToggle={toggleExcludeLabelFilter}
        variant="exclude"
        dropdownHeader="Hide tasks with these labels"
      />

      {/* Clear filters button */}
      {filtersActive && (
        <button
          onClick={handleClearFilters}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors text-accent-foreground"
        >
          <X className="w-4 h-4" />
          <span>Clear</span>
        </button>
      )}

      {/* Active filter indicator */}
      {filtersActive && (
        <div className="text-xs text-muted-foreground">
          Filters active
        </div>
      )}
    </div>
  );
}
