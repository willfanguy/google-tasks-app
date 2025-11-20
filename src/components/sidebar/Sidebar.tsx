/**
 * Sidebar Component
 * Collapsible sidebar showing filter presets (views) and navigation
 */

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, List, Circle, CheckCircle, Calendar, Trash2, MoreVertical } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useFilterStore } from '../../stores/filterStore';
import { logger } from '../../utils/logger';
import InputDialog from '../common/InputDialog';
import AlertDialog from '../common/AlertDialog';

// Map icon names to components
const iconMap: Record<string, any> = {
  list: List,
  circle: Circle,
  'check-circle': CheckCircle,
  calendar: Calendar,
};

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const { filterPresets, activePresetId, applyPreset, createPreset, deletePreset, hasActiveFilters, hasActiveSorts } = useFilterStore();
  const [showMenu, setShowMenu] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showNoFiltersAlert, setShowNoFiltersAlert] = useState(false);

  const handlePresetSelect = (presetId: string) => {
    logger.log('[Sidebar] Preset selected:', presetId);
    applyPreset(presetId);
    setShowMenu(null);
  };

  const handleCreatePreset = () => {
    const filtersActive = hasActiveFilters();
    const sortsActive = hasActiveSorts();

    logger.log('[Sidebar] Button clicked - Filters:', filtersActive, 'Sorts:', sortsActive);

    if (!filtersActive && !sortsActive) {
      logger.log('[Sidebar] No filters or sorts active, showing alert');
      setShowNoFiltersAlert(true);
      return;
    }

    logger.log('[Sidebar] Opening create dialog');
    setShowCreateDialog(true);
  };

  const handleConfirmCreate = (name: string) => {
    logger.log('[Sidebar] Creating preset:', name);
    createPreset(name);
    setShowCreateDialog(false);
  };

  const handleCancelCreate = () => {
    logger.log('[Sidebar] Canceling preset creation');
    setShowCreateDialog(false);
  };

  const handleDeletePreset = (presetId: string) => {
    const preset = filterPresets.find(p => p.id === presetId);
    if (!preset) return;

    if (confirm(`Delete "${preset.name}"?`)) {
      logger.log('[Sidebar] Deleting preset:', presetId);
      deletePreset(presetId);
      setShowMenu(null);
    }
  };

  // Separate default and custom presets
  const defaultPresets = filterPresets.slice(0, 4); // First 4 are defaults
  const customPresets = filterPresets.slice(4);

  if (sidebarCollapsed) {
    return (
      <aside className="w-16 border-r border-border bg-card flex flex-col items-center py-4 flex-shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Expand sidebar"
        >
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col flex-shrink-0">
      {/* Sidebar header */}
      <div className="h-16 border-b border-border flex items-center justify-between px-4">
        <h2 className="text-sm font-semibold text-foreground">Views</h2>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg hover:bg-accent transition-colors"
          title="Collapse sidebar"
        >
          <ChevronLeft className="w-4 h-4 text-muted-foreground" />
        </button>
      </div>

      {/* Preset list */}
      <div className="flex-1 overflow-y-auto p-2">
        {/* Default presets */}
        <div className="mb-4">
          <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Default Views</div>
          <div className="space-y-1">
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
                  <span className="text-sm truncate">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom presets */}
        {customPresets.length > 0 && (
          <div>
            <div className="px-2 py-1 text-xs font-medium text-muted-foreground">Custom Views</div>
            <div className="space-y-1">
              {customPresets.map((preset) => {
                const Icon = iconMap[preset.icon || 'list'] || List;
                return (
                  <div
                    key={preset.id}
                    className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
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

                    {/* Delete button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(showMenu === preset.id ? null : preset.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-accent/50 transition-opacity"
                    >
                      <MoreVertical className="w-3 h-3" />
                    </button>

                    {/* Delete menu */}
                    {showMenu === preset.id && (
                      <>
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowMenu(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                          <button
                            onClick={() => handleDeletePreset(preset.id)}
                            className="flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors whitespace-nowrap"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Create preset button */}
      <div className="border-t border-border p-2">
        <button
          onClick={handleCreatePreset}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors text-foreground"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm">Save Current View</span>
        </button>
      </div>

      {/* Create preset dialog */}
      <InputDialog
        isOpen={showCreateDialog}
        title="Save Current View"
        message="Enter a name for this view:"
        placeholder="My Custom View"
        onConfirm={handleConfirmCreate}
        onCancel={handleCancelCreate}
      />

      {/* No filters alert dialog */}
      <AlertDialog
        isOpen={showNoFiltersAlert}
        title="No Filters or Sorts Applied"
        message="Please apply some filters or sorts first before saving a view."
        onClose={() => setShowNoFiltersAlert(false)}
      />
    </aside>
  );
}
