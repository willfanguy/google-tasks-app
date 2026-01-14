/**
 * LabelManager Component
 * Modal for creating, editing, and deleting labels
 */

import { useState } from 'react';
import { X, Plus, Edit2, Trash2, Tag, GripVertical } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useLabelStore } from '../../stores/labelStore';
import { useUIStore } from '../../stores/uiStore';
import { DEFAULT_LABEL_COLORS, LabelColor, Label } from '../../types/label';
import { getColorClasses } from '../../utils/colorClasses';
import ConfirmDialog from '../common/ConfirmDialog';

interface SortableLabelProps {
  label: Label;
  editingId: string | null;
  editName: string;
  setEditName: (name: string) => void;
  setEditingId: (id: string | null) => void;
  handleEdit: (id: string) => void;
  handleDelete: (id: string) => void;
  startEdit: (id: string, name: string) => void;
}

function SortableLabel({
  label,
  editingId,
  editName,
  setEditName,
  setEditingId,
  handleEdit,
  handleDelete,
  startEdit,
}: SortableLabelProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: label.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-accent transition-colors"
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 hover:bg-accent rounded"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>

      {editingId === label.id ? (
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
  );
}

export default function LabelManager() {
  const { labels, createLabel, updateLabel, deleteLabel, reorderLabels, getSortedLabels } = useLabelStore();
  const { modals, closeLabelManager } = useUIStore();
  const [newLabelName, setNewLabelName] = useState('');
  const [selectedColor, setSelectedColor] = useState(DEFAULT_LABEL_COLORS[0]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingLabelId, setDeletingLabelId] = useState<string | null>(null);

  // Setup drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Get sorted labels
  const sortedLabels = getSortedLabels();

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

  const handleDeleteClick = (id: string) => {
    setDeletingLabelId(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = () => {
    if (deletingLabelId) {
      deleteLabel(deletingLabelId);
    }
    setShowDeleteDialog(false);
    setDeletingLabelId(null);
  };

  const handleDeleteCancel = () => {
    setShowDeleteDialog(false);
    setDeletingLabelId(null);
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = sortedLabels.findIndex((l) => l.id === active.id);
      const newIndex = sortedLabels.findIndex((l) => l.id === over.id);

      const reorderedLabels = arrayMove(sortedLabels, oldIndex, newIndex);
      reorderLabels(reorderedLabels.map((l) => l.id));
    }
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
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="label-manager-title"
          className="w-full max-w-md bg-card rounded-lg border border-border shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              <h2 id="label-manager-title" className="text-lg font-semibold text-foreground">Manage Labels</h2>
            </div>
            <button
              onClick={closeLabelManager}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close label manager"
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
                Your Labels ({labels.length}) - Drag to reorder
              </label>
              {labels.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No labels yet. Create one above!
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={sortedLabels.map((l) => l.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {sortedLabels.map((label) => (
                        <SortableLabel
                          key={label.id}
                          label={label}
                          editingId={editingId}
                          editName={editName}
                          setEditName={setEditName}
                          setEditingId={setEditingId}
                          handleEdit={handleEdit}
                          handleDelete={handleDeleteClick}
                          startEdit={startEdit}
                        />
                      ))}
                    </div>
                  </SortableContext>
                </DndContext>
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

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          isOpen={showDeleteDialog}
          title="Delete Label"
          message="Delete this label? It will be removed from all tasks."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={handleDeleteConfirm}
          onCancel={handleDeleteCancel}
        />
      </div>
    </>
  );
}
