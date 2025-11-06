/**
 * LabelManager Component
 * Modal for creating, editing, and deleting labels
 */

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag } from 'lucide-react';
import { useLabelStore } from '../../stores/labelStore';
import { useUIStore } from '../../stores/uiStore';
import { DEFAULT_LABEL_COLORS, LabelColor } from '../../types/label';

// Map colors to Tailwind classes
const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; name: string }> = {
    '#ef4444': { bg: 'bg-red-500', text: 'text-white', name: 'Red' },
    '#f97316': { bg: 'bg-orange-500', text: 'text-white', name: 'Orange' },
    '#f59e0b': { bg: 'bg-amber-500', text: 'text-white', name: 'Amber' },
    '#84cc16': { bg: 'bg-lime-500', text: 'text-white', name: 'Lime' },
    '#22c55e': { bg: 'bg-green-500', text: 'text-white', name: 'Green' },
    '#06b6d4': { bg: 'bg-cyan-500', text: 'text-white', name: 'Cyan' },
    '#3b82f6': { bg: 'bg-blue-500', text: 'text-white', name: 'Blue' },
    '#8b5cf6': { bg: 'bg-violet-500', text: 'text-white', name: 'Violet' },
    '#ec4899': { bg: 'bg-pink-500', text: 'text-white', name: 'Pink' },
  };
  return colorMap[color] || colorMap['#3b82f6'];
};

export default function LabelManager() {
  const { labels, createLabel, updateLabel, deleteLabel } = useLabelStore();
  const { modals, closeLabelManager } = useUIStore();
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!modals.labelManager) return null;

  const handleCreate = () => {
    if (newLabelName.trim()) {
      createLabel(newLabelName.trim(), selectedColor);
      setNewLabelName('');
      setSelectedColor(DEFAULT_LABEL_COLORS[0]);
    }
  };

  const handleEdit = (id: string) => {
    if (editName.trim()) {
      updateLabel(id, { name: editName.trim() });
      setEditingId(null);
      setEditName('');
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this label? It will be removed from all tasks.')) {
      deleteLabel(id);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={closeLabelManager}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-card rounded-lg border border-border shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">Manage Labels</h2>
            </div>
            <button
              onClick={closeLabelManager}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Create new label */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Create New Label
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Label name"
                  value={newLabelName}
                  onChange={(e) => setNewLabelName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                />
                <select
                  value={selectedColor}
                  onChange={(e) => setSelectedColor(e.target.value as LabelColor)}
                  className="px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                >
                  {DEFAULT_LABEL_COLORS.map((color) => (
                    <option key={color} value={color}>
                      {getColorClasses(color).name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleCreate}
                  disabled={!newLabelName.trim()}
                  className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Existing labels */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Your Labels ({labels.length})
              </label>
              {labels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No labels yet. Create one above!
                </p>
              ) : (
                <div className="space-y-2">
                  {labels.map((label) => (
                    <div
                      key={label.id}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent transition-colors"
                    >
                      {editingId === label.id ? (
                        <>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleEdit(label.id);
                              if (e.key === 'Escape') setEditingId(null);
                            }}
                            onBlur={() => handleEdit(label.id)}
                            autoFocus
                            className="flex-1 px-2 py-1 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
                          />
                        </>
                      ) : (
                        <>
                          <div
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClasses(label.color).bg} ${getColorClasses(label.color).text}`}
                          >
                            {label.name}
                          </div>
                          <div className="flex-1" />
                          <button
                            onClick={() => startEdit(label.id, label.name)}
                            className="p-1 rounded hover:bg-accent transition-colors"
                            title="Edit label"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-muted-foreground" />
                          </button>
                          <button
                            onClick={() => handleDelete(label.id)}
                            className="p-1 rounded hover:bg-accent transition-colors"
                            title="Delete label"
                          >
                            <Trash2 className="w-3.5 h-3.5 text-destructive" />
                          </button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-end">
            <button
              onClick={closeLabelManager}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
