/**
 * Task priority system
 * Priorities are local metadata and not synced to Google Tasks API
 */

export type Priority = 'high' | 'medium' | 'low';

export interface PriorityConfig {
  value: Priority;
  label: string;
  color: string;
  order: number; // For sorting (lower = higher priority)
}

export const PRIORITY_LEVELS: Record<Priority, PriorityConfig> = {
  high: {
    value: 'high',
    label: 'High',
    color: '#a30000', // Inferno
    order: 1,
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    color: '#ff7700', // Harvest Orange
    order: 2,
  },
  low: {
    value: 'low',
    label: 'Low',
    color: '#003459', // Deep Space Blue
    order: 3,
  },
};

export const PRIORITY_OPTIONS: Priority[] = ['high', 'medium', 'low'];
