/**
 * LabelPickerDropdown Component
 * Reusable dropdown for selecting labels from a list
 * Used in QuickAddTask, TaskDetail, and FilterBar
 */

import { useState } from 'react';
import { Check, Plus, Tag, Ban } from 'lucide-react';
import { Label } from '../../types/label';
import { getColorClasses } from '../../utils/colorClasses';

interface LabelPickerDropdownProps {
  /** All available labels to choose from */
  labels: Label[];
  /** Currently selected label IDs */
  selectedLabelIds: string[];
  /** Callback when a label is toggled */
  onToggle: (labelId: string) => void;
  /** Variant affects button styling and behavior */
  variant?: 'select' | 'filter' | 'exclude';
  /** Custom button text (overrides default based on variant) */
  buttonText?: string;
  /** Message shown when no labels exist */
  emptyMessage?: string;
  /** Additional description shown at top of dropdown */
  dropdownHeader?: string;
}

export default function LabelPickerDropdown({
  labels,
  selectedLabelIds,
  onToggle,
  variant = 'select',
  buttonText,
  emptyMessage = 'No labels yet. Create one in the label manager!',
  dropdownHeader,
}: LabelPickerDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCount = selectedLabelIds.length;

  // Determine button content based on variant
  const getButtonContent = () => {
    if (buttonText) return buttonText;

    switch (variant) {
      case 'select':
        return 'Add Label';
      case 'filter':
        return selectedCount > 0
          ? `${selectedCount} Label${selectedCount > 1 ? 's' : ''}`
          : 'Labels';
      case 'exclude':
        return selectedCount > 0 ? `Exclude ${selectedCount}` : 'Exclude';
      default:
        return 'Labels';
    }
  };

  // Get the appropriate icon for the variant
  const ButtonIcon = variant === 'exclude' ? Ban : variant === 'filter' ? Tag : Plus;

  // Button styling based on variant
  const getButtonClassName = () => {
    const base = 'flex items-center gap-2 transition-colors';

    switch (variant) {
      case 'select':
        return `${base} px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg`;
      case 'filter':
      case 'exclude':
        return `${base} px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground cursor-pointer hover:bg-accent ${
          selectedCount > 0 ? 'border-primary' : ''
        }`;
      default:
        return base;
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonClassName()}
      >
        {variant !== 'select' && <ButtonIcon className="w-4 h-4 text-muted-foreground" />}
        {variant === 'select' && <Plus className="w-4 h-4" />}
        <span>{getButtonContent()}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <div className="absolute left-0 top-full mt-1 w-64 bg-card border border-border rounded-lg shadow-lg z-20 p-2 max-h-60 overflow-y-auto">
            {labels.length === 0 ? (
              <p className="text-xs text-muted-foreground p-2 text-center">
                {emptyMessage}
              </p>
            ) : (
              <div className="space-y-1">
                {dropdownHeader && (
                  <div className="text-xs text-muted-foreground p-2 border-b border-border">
                    {dropdownHeader}
                  </div>
                )}
                {labels.map((label) => {
                  const isSelected = selectedLabelIds.includes(label.id);
                  return (
                    <button
                      key={label.id}
                      onClick={() => onToggle(label.id)}
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
  );
}
