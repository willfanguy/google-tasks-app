/**
 * FilterBar Component
 * Search, filter, and sort controls for tasks
 */

import { useState } from 'react';
import { Search, Filter, X, Tag, Ban, Check, LayoutGrid, List, Flag } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { useLabelStore } from '../../stores/labelStore';
import { useUIStore } from '../../stores/uiStore';
import { Priority, PRIORITY_LEVELS, PRIORITY_OPTIONS } from '../../types/priority';
import { logger } from '../../utils/logger';
import { getColorClasses } from '../../utils/colorClasses';

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
  const [showLabelPicker, setShowLabelPicker] = useState(false);
  const [showExcludeLabelPicker, setShowExcludeLabelPicker] = useState(false);

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
      <div className="relative flex items-center gap-2">
        <Tag className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setShowLabelPicker(!showLabelPicker)}
          className={`px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer hover:bg-accent transition-colors flex items-center gap-2 ${
            activeFilters.labels.length > 0 ? 'border-primary' : ''
          }`}
        >
          <span>
            {activeFilters.labels.length > 0
              ? `${activeFilters.labels.length} Label${activeFilters.labels.length > 1 ? 's' : ''}`
              : 'Labels'}
          </span>
        </button>

        {showLabelPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowLabelPicker(false)}
            />

            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 p-2 max-h-60 overflow-y-auto">
              {labels.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  No labels yet. Create one in the label manager!
                </p>
              ) : (
                <div className="space-y-1">
                  {labels.map((label) => {
                    const isSelected = activeFilters.labels.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleLabelFilter(label.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(label.color).bg} ${getColorClasses(label.color).text}`}
                        >
                          {label.name}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Exclude Label filter */}
      <div className="relative flex items-center gap-2">
        <Ban className="w-4 h-4 text-muted-foreground" />
        <button
          onClick={() => setShowExcludeLabelPicker(!showExcludeLabelPicker)}
          className={`px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer hover:bg-accent transition-colors flex items-center gap-2 ${
            activeFilters.excludeLabels.length > 0 ? 'border-primary' : ''
          }`}
        >
          <span>
            {activeFilters.excludeLabels.length > 0
              ? `Exclude ${activeFilters.excludeLabels.length}`
              : 'Exclude'}
          </span>
        </button>

        {showExcludeLabelPicker && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setShowExcludeLabelPicker(false)}
            />

            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 p-2 max-h-60 overflow-y-auto">
              {labels.length === 0 ? (
                <p className="text-xs text-muted-foreground p-2 text-center">
                  No labels yet. Create one in the label manager!
                </p>
              ) : (
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground p-2 border-b border-border">
                    Hide tasks with these labels
                  </div>
                  {labels.map((label) => {
                    const isSelected = activeFilters.excludeLabels.includes(label.id);
                    return (
                      <button
                        key={label.id}
                        onClick={() => toggleExcludeLabelFilter(label.id)}
                        className={`w-full flex items-center gap-2 p-2 rounded-lg hover:bg-accent transition-colors ${
                          isSelected ? 'bg-accent' : ''
                        }`}
                      >
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(label.color).bg} ${getColorClasses(label.color).text}`}
                        >
                          {label.name}
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-primary ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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
