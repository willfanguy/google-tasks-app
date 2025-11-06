/**
 * Label/tag system for task categorization
 * Labels are local metadata and not synced to Google Tasks API
 */

export interface Label {
  id: string;
  name: string;
  color: string; // Hex color code
  order: number; // Display order
  createdAt: string;
}

export type LabelColor =
  | '#ef4444' // red
  | '#f97316' // orange
  | '#f59e0b' // amber
  | '#eab308' // yellow
  | '#84cc16' // lime
  | '#22c55e' // green
  | '#10b981' // emerald
  | '#14b8a6' // teal
  | '#06b6d4' // cyan
  | '#0ea5e9' // sky
  | '#3b82f6' // blue
  | '#6366f1' // indigo
  | '#8b5cf6' // violet
  | '#a855f7' // purple
  | '#d946ef' // fuchsia
  | '#ec4899' // pink
  | '#f43f5e' // rose
  | '#64748b'; // slate

export const DEFAULT_LABEL_COLORS: LabelColor[] = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
];
