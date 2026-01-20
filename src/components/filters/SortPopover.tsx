/**
 * SortPopover Component
 * Dropdown popover containing multi-level sort controls
 */

import { useState } from 'react';
import { ArrowUpDown, X } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import { SortOption } from '../../types/task';

// Sort option labels for display
const SORT_LABELS: Record<SortOption, string> = {
  'manual': 'Manual Order',
  'dueDate-asc': 'Due Date (Earliest)',
  'dueDate-desc': 'Due Date (Latest)',
  'title-asc': 'Title (A-Z)',
  'title-desc': 'Title (Z-A)',
  'status': 'Status (Active First)',
  'list-asc': 'List (A-Z)',
  'list-desc': 'List (Z-A)',
  'label-asc': 'Label (First-Last)',
  'label-desc': 'Label (Last-First)',
  'created-asc': 'Updated (Oldest)',
  'created-desc': 'Updated (Newest)',
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

export default function SortPopover() {
  const [isOpen, setIsOpen] = useState(false);
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

  const sortsActive = hasActiveSorts();
  const sortCount = sortOptions.filter(Boolean).length;

  // Filter out already selected options for secondary and tertiary dropdowns
  const getAvailableOptions = (currentLevel: 'primary' | 'secondary' | 'tertiary'): SortOption[] => {
    const usedOptions: SortOption[] = [];
    if (currentLevel === 'secondary') {
      if (primarySort) usedOptions.push(primarySort);
    } else if (currentLevel === 'tertiary') {
      if (primarySort) usedOptions.push(primarySort);
      if (secondarySort) usedOptions.push(secondarySort);
    }
    return SORT_OPTIONS.filter((opt) => !usedOptions.includes(opt));
  };

  const handlePrimaryChange = (value: string) => {
    if (value === 'none') {
      setPrimarySortOption(null);
    } else {
      setPrimarySortOption(value as SortOption);
    }
  };

  const handleSecondaryChange = (value: string) => {
    if (value === 'none') {
      setSecondarySortOption(null);
    } else {
      setSecondarySortOption(value as SortOption);
    }
  };

  const handleTertiaryChange = (value: string) => {
    if (value === 'none') {
      setTertiarySortOption(null);
    } else {
      setTertiarySortOption(value as SortOption);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border rounded-lg transition-colors hover:bg-accent ${
          sortsActive ? 'border-primary text-primary' : 'border-border text-foreground'
        }`}
      >
        <ArrowUpDown className="w-4 h-4" />
        <span>Sort</span>
        {sortCount > 0 && (
          <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
            {sortCount}
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
          <div className="absolute left-0 top-full mt-1 w-72 bg-card border border-border rounded-lg shadow-lg z-20 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium text-foreground">Sort By</h3>
              {sortsActive && (
                <button
                  onClick={() => {
                    clearSortOptions();
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-3">
              {/* Primary sort */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                  <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full text-xs">1</span>
                  Primary
                </label>
                <select
                  value={primarySort || 'none'}
                  onChange={(e) => handlePrimaryChange(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
                >
                  <option value="none">No sorting</option>
                  {SORT_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {SORT_LABELS[option]}
                    </option>
                  ))}
                </select>
              </div>

              {/* Secondary sort */}
              {primarySort && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                    <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full text-xs">2</span>
                    Then by
                  </label>
                  <select
                    value={secondarySort || 'none'}
                    onChange={(e) => handleSecondaryChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
                  >
                    <option value="none">No secondary sort</option>
                    {getAvailableOptions('secondary').map((option) => (
                      <option key={option} value={option}>
                        {SORT_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Tertiary sort */}
              {secondarySort && (
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1.5 flex items-center gap-2">
                    <span className="bg-accent text-accent-foreground px-1.5 py-0.5 rounded-full text-xs">3</span>
                    Then by
                  </label>
                  <select
                    value={tertiarySort || 'none'}
                    onChange={(e) => handleTertiaryChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer"
                  >
                    <option value="none">No tertiary sort</option>
                    {getAvailableOptions('tertiary').map((option) => (
                      <option key={option} value={option}>
                        {SORT_LABELS[option]}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
