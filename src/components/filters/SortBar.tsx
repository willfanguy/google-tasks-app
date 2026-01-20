/**
 * SortBar Component
 * Multi-level sorting controls with progressive disclosure
 */

import { ArrowRight, X } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { SortOption } from '../../types/task';
import { logger } from '../../utils/logger';

// Sort option labels for display
const SORT_LABELS: Record<SortOption, string> = {
  'manual': 'Manual Order',
  'dueDate-asc': 'Due Date (Earliest First)',
  'dueDate-desc': 'Due Date (Latest First)',
  'title-asc': 'Title (A-Z)',
  'title-desc': 'Title (Z-A)',
  'status': 'Status (Active First)',
  'list-asc': 'List Name (A-Z)',
  'list-desc': 'List Name (Z-A)',
  'label-asc': 'Label (First to Last)',
  'label-desc': 'Label (Last to First)',
  'created-asc': 'Updated (Oldest First)',
  'created-desc': 'Updated (Newest First)',
};

// All available sort options
const SORT_OPTIONS: SortOption[] = [
  'manual',
  'dueDate-asc',
  'dueDate-desc',
  'title-asc',
  'title-desc',
  'status',
  'list-asc',
  'list-desc',
  'label-asc',
  'label-desc',
  'created-asc',
  'created-desc',
];

export default function SortBar() {
  const {
    sortOptions,
    setPrimarySortOption,
    setSecondarySortOption,
    setTertiarySortOption,
    clearSortOptions,
    hasActiveSorts,
  } = useFilterStore();

  const primarySort = sortOptions[0] || null;
  const secondarySort = sortOptions[1] || null;
  const tertiarySort = sortOptions[2] || null;

  const handlePrimaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    logger.log('[SortBar] Primary sort changed to:', value);
    if (value === 'none') {
      setPrimarySortOption(null);
    } else {
      setPrimarySortOption(value as SortOption);
    }
  };

  const handleSecondaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    logger.log('[SortBar] Secondary sort changed to:', value);
    if (value === 'none') {
      setSecondarySortOption(null);
    } else {
      setSecondarySortOption(value as SortOption);
    }
  };

  const handleTertiaryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    logger.log('[SortBar] Tertiary sort changed to:', value);
    if (value === 'none') {
      setTertiarySortOption(null);
    } else {
      setTertiarySortOption(value as SortOption);
    }
  };

  const handleClearSorts = () => {
    logger.log('[SortBar] Clearing all sorts');
    clearSortOptions();
  };

  const sortsActive = hasActiveSorts();

  // Filter out already selected options for secondary and tertiary dropdowns
  const getAvailableOptions = (currentLevel: 'secondary' | 'tertiary'): SortOption[] => {
    const usedOptions: SortOption[] = [];
    if (currentLevel === 'secondary') {
      if (primarySort) usedOptions.push(primarySort);
    } else {
      // tertiary
      if (primarySort) usedOptions.push(primarySort);
      if (secondarySort) usedOptions.push(secondarySort);
    }
    return SORT_OPTIONS.filter((opt) => !usedOptions.includes(opt));
  };

  return (
    <div className="min-h-14 py-2 border-b border-border bg-card flex flex-wrap items-center gap-3 px-4 flex-shrink-0">
      {/* No sorting state */}
      {!sortsActive && (
        <div className="text-sm text-muted-foreground">
          No sorting applied
        </div>
      )}

      {/* Primary sort */}
      {sortsActive && (
        <>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-accent-foreground bg-accent px-2 py-1 rounded-full">
              ①
            </span>
            <span className="text-sm text-muted-foreground font-medium">Sort by:</span>
            <select
              value={primarySort || 'none'}
              onChange={handlePrimaryChange}
              className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer font-medium"
            >
              <option value="none">No Sort</option>
              {SORT_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {SORT_LABELS[option]}
                </option>
              ))}
            </select>
          </div>

          {/* Arrow separator */}
          {secondarySort && (
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          )}

          {/* Secondary sort - only show if primary is set */}
          {primarySort && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-accent-foreground bg-accent px-2 py-1 rounded-full">
                ②
              </span>
              <span className="text-sm text-muted-foreground font-medium">then by:</span>
              <select
                value={secondarySort || 'none'}
                onChange={handleSecondaryChange}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
              >
                <option value="none">No Secondary Sort</option>
                {getAvailableOptions('secondary').map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Arrow separator */}
          {tertiarySort && (
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          )}

          {/* Tertiary sort - only show if secondary is set */}
          {secondarySort && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-accent-foreground bg-accent px-2 py-1 rounded-full">
                ③
              </span>
              <span className="text-sm text-muted-foreground font-medium">then by:</span>
              <select
                value={tertiarySort || 'none'}
                onChange={handleTertiaryChange}
                className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
              >
                <option value="none">No Tertiary Sort</option>
                {getAvailableOptions('tertiary').map((option) => (
                  <option key={option} value={option}>
                    {SORT_LABELS[option]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Clear sorts button */}
          <button
            onClick={handleClearSorts}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-accent hover:bg-accent/80 rounded-lg transition-colors text-accent-foreground ml-auto"
            title="Clear all sorts"
          >
            <X className="w-4 h-4" />
            <span>Clear Sorts</span>
          </button>
        </>
      )}

      {/* Add Sort button when no sorts are active */}
      {!sortsActive && (
        <select
          value="none"
          onChange={handlePrimaryChange}
          className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
        >
          <option value="none">Add sorting...</option>
          {SORT_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {SORT_LABELS[option]}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
