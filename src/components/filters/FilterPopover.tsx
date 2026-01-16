/**
 * FilterPopover Component
 * Dropdown popover containing all filter controls
 */

import { useState } from 'react';
import { Filter, X, Check } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { useLabelStore } from '../../stores/labelStore';
import { Priority, PRIORITY_LEVELS, PRIORITY_OPTIONS } from '../../types/priority';
import { getColorClasses } from '../../utils/colorClasses';

export default function FilterPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    activeFilters,
    setStatusFilter,
    setPriorityFilter,
    toggleLabelFilter,
    toggleExcludeLabelFilter,
    clearFilters,
    hasActiveFilters,
  } = useFilterStore();
  const { getSortedLabels } = useLabelStore();
  const labels = getSortedLabels();

  const filtersActive = hasActiveFilters();
  const activeCount = [
    activeFilters.status,
    activeFilters.priority,
    activeFilters.labels.length > 0,
    activeFilters.excludeLabels.length > 0,
  ].filter(Boolean).length;

  const handleStatusChange = (value: string) => {
    if (value === 'all') {
      setStatusFilter(undefined);
    } else {
      setStatusFilter(value as 'needsAction' | 'completed');
    }
  };

  const handlePriorityChange = (value: string) => {
    if (value === 'all') {
      setPriorityFilter(undefined);
    } else {
      setPriorityFilter(value as Priority);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border rounded-lg transition-colors hover:bg-accent ${
          filtersActive ? 'border-primary text-primary' : 'border-border text-foreground'
        }`}
      >
        <Filter className="w-4 h-4" />
        <span>Filters</span>
        {activeCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {activeCount}
          </span>
        )}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute left-0 top-full mt-1 w-80 bg-card border border-border rounded-lg shadow-lg z-20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Filters</h3>
              {filtersActive && (
                <button
                  onClick={() => {
                    clearFilters();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Status filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Status
                </label>
                <div className="flex gap-1">
                  {[
                    { value: 'all', label: 'All' },
                    { value: 'needsAction', label: 'Active' },
                    { value: 'completed', label: 'Completed' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handleStatusChange(option.value)}
                      className={`flex-1 px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        (activeFilters.status || 'all') === option.value
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-accent text-accent-foreground hover:bg-accent/80'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority filter */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Priority
                </label>
                <div className="flex flex-wrap gap-1">
                  <button
                    onClick={() => handlePriorityChange('all')}
                    className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                      !activeFilters.priority
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-accent text-accent-foreground hover:bg-accent/80'
                    }`}
                  >
                    All
                  </button>
                  {PRIORITY_OPTIONS.map((p) => (
                    <button
                      key={p}
                      onClick={() => handlePriorityChange(p)}
                      className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                        activeFilters.priority === p
                          ? 'text-white'
                          : 'bg-accent hover:bg-accent/80'
                      }`}
                      style={{
                        backgroundColor: activeFilters.priority === p ? PRIORITY_LEVELS[p].color : undefined,
                        color: activeFilters.priority === p ? 'white' : PRIORITY_LEVELS[p].color,
                      }}
                    >
                      {PRIORITY_LEVELS[p].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Include labels */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Include Labels
                </label>
                {labels.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No labels created yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {labels.map((label) => {
                      const isSelected = activeFilters.labels.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          onClick={() => toggleLabelFilter(label.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            getColorClasses(label.color).bg
                          } ${getColorClasses(label.color).text} ${
                            isSelected ? 'ring-2 ring-primary ring-offset-1' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {label.name}
                          {isSelected && <Check className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Exclude labels */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Exclude Labels
                </label>
                {labels.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No labels created yet</p>
                ) : (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                    {labels.map((label) => {
                      const isSelected = activeFilters.excludeLabels.includes(label.id);
                      return (
                        <button
                          key={label.id}
                          onClick={() => toggleExcludeLabelFilter(label.id)}
                          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                            getColorClasses(label.color).bg
                          } ${getColorClasses(label.color).text} ${
                            isSelected ? 'ring-2 ring-destructive ring-offset-1' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          {label.name}
                          {isSelected && <X className="w-3 h-3" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
