/**
 * ViewsPopover Component
 * Dropdown popover for selecting filter presets (views)
 */

import { useState } from 'react';
import { Layers, Sun, List, Circle, CheckCircle, Calendar, Plus, Trash2 } from 'lucide-react';
import { useFilterStore } from '../../stores/filterStore';
import InputDialog from '../common/InputDialog';
import AlertDialog from '../common/AlertDialog';
import ConfirmDialog from '../common/ConfirmDialog';
import { logger } from '../../utils/logger';

// Map icon names to components
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  sun: Sun,
  list: List,
  circle: Circle,
  'check-circle': CheckCircle,
  calendar: Calendar,
};

export default function ViewsPopover() {
  const [isOpen, setIsOpen] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNoFiltersAlert, setShowNoFiltersAlert] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingPresetId, setDeletingPresetId] = useState<string | null>(null);

  const filterPresets = useFilterStore((s) => s.filterPresets);
  const activePresetId = useFilterStore((s) => s.activePresetId);
  const applyPreset = useFilterStore((s) => s.applyPreset);
  const createPreset = useFilterStore((s) => s.createPreset);
  const deletePreset = useFilterStore((s) => s.deletePreset);
  const hasActiveFilters = useFilterStore((s) => s.hasActiveFilters);
  const hasActiveSorts = useFilterStore((s) => s.hasActiveSorts);

  // Separate default and custom presets
  const defaultPresets = filterPresets.slice(0, 5);
  const customPresets = filterPresets.slice(5);

  const activePreset = filterPresets.find((p) => p.id === activePresetId);

  const handlePresetSelect = (presetId: string) => {
    logger.log('[ViewsPopover] Preset selected:', presetId);
    applyPreset(presetId);
    setIsOpen(false);
  };

  const handleCreatePreset = () => {
    const filtersActive = hasActiveFilters();
    const sortsActive = hasActiveSorts();

    if (!filtersActive && !sortsActive) {
      setShowNoFiltersAlert(true);
      return;
    }

    setShowCreateDialog(true);
  };

  const handleConfirmCreate = (name: string) => {
    logger.log('[ViewsPopover] Creating preset:', name);
    createPreset(name);
    setShowCreateDialog(false);
  };

  const handleDeletePreset = (presetId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingPresetId(presetId);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingPresetId) {
      deletePreset(deletingPresetId);
    }
    setShowDeleteDialog(false);
    setDeletingPresetId(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-2 text-sm bg-background border rounded-lg transition-colors hover:bg-accent ${
          activePresetId ? 'border-primary text-primary' : 'border-border text-foreground'
        }`}
      >
        <Layers className="w-4 h-4" />
        <span>{activePreset?.name || 'Views'}</span>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Popover */}
          <div className="absolute left-0 top-full mt-1 w-56 bg-card border border-border rounded-lg shadow-lg z-20 p-2 max-h-80 overflow-y-auto">
            {/* Default presets */}
            <div className="mb-2">
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Default Views</div>
              {defaultPresets.map((preset) => {
                const Icon = iconMap[preset.icon || 'list'] || List;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handlePresetSelect(preset.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      activePresetId === preset.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="text-sm">{preset.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Custom presets */}
            {customPresets.length > 0 && (
              <div className="mb-2 border-t border-border pt-2">
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Custom Views</div>
                {customPresets.map((preset) => {
                  const Icon = iconMap[preset.icon || 'list'] || List;
                  return (
                    <div
                      key={preset.id}
                      className={`group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
                        activePresetId === preset.id
                          ? 'bg-primary text-primary-foreground'
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      <button
                        onClick={() => handlePresetSelect(preset.id)}
                        className="flex items-center gap-2 flex-1 text-left"
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm truncate">{preset.name}</span>
                      </button>
                      <button
                        onClick={(e) => handleDeletePreset(preset.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/20 transition-opacity"
                        title="Delete view"
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Save current view button */}
            <div className="border-t border-border pt-2">
              <button
                onClick={handleCreatePreset}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
              >
                <Plus className="w-4 h-4" />
                <span className="text-sm">Save Current View</span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Create preset dialog */}
      <InputDialog
        isOpen={showCreateDialog}
        title="Save Current View"
        message="Enter a name for this view:"
        placeholder="My Custom View"
        onConfirm={handleConfirmCreate}
        onCancel={() => setShowCreateDialog(false)}
      />

      {/* No filters alert */}
      <AlertDialog
        isOpen={showNoFiltersAlert}
        title="No Filters or Sorts Applied"
        message="Please apply some filters or sorts first before saving a view."
        onClose={() => setShowNoFiltersAlert(false)}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={showDeleteDialog}
        title="Delete View"
        message={`Delete "${filterPresets.find((p) => p.id === deletingPresetId)?.name || 'this view'}"?`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setShowDeleteDialog(false);
          setDeletingPresetId(null);
        }}
      />
    </div>
  );
}
