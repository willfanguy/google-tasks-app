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
    color: '#ef4444', // red
    order: 1,
  },
  medium: {
    value: 'medium',
    label: 'Medium',
    color: '#f59e0b', // amber
    order: 2,
  },
  low: {
    value: 'low',
    label: 'Low',
    color: '#3b82f6', // blue
    order: 3,
  },
};

export const PRIORITY_OPTIONS: Priority[] = ['high', 'medium', 'low'];
