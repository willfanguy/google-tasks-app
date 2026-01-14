/**
 * Shared utility for mapping hex colors to Tailwind CSS classes
 * Used by label components throughout the app
 */

export interface ColorClasses {
  bg: string;
  text: string;
  name: string;
}

const colorMap: Record<string, ColorClasses> = {
  '#ef4444': { bg: 'bg-red-500', text: 'text-white', name: 'Red' },
  '#f97316': { bg: 'bg-orange-500', text: 'text-white', name: 'Orange' },
  '#f59e0b': { bg: 'bg-amber-500', text: 'text-white', name: 'Amber' },
  '#eab308': { bg: 'bg-yellow-500', text: 'text-white', name: 'Yellow' },
  '#84cc16': { bg: 'bg-lime-500', text: 'text-white', name: 'Lime' },
  '#22c55e': { bg: 'bg-green-500', text: 'text-white', name: 'Green' },
  '#10b981': { bg: 'bg-emerald-500', text: 'text-white', name: 'Emerald' },
  '#14b8a6': { bg: 'bg-teal-500', text: 'text-white', name: 'Teal' },
  '#06b6d4': { bg: 'bg-cyan-500', text: 'text-white', name: 'Cyan' },
  '#0ea5e9': { bg: 'bg-sky-500', text: 'text-white', name: 'Sky' },
  '#3b82f6': { bg: 'bg-blue-500', text: 'text-white', name: 'Blue' },
  '#6366f1': { bg: 'bg-indigo-500', text: 'text-white', name: 'Indigo' },
  '#8b5cf6': { bg: 'bg-violet-500', text: 'text-white', name: 'Violet' },
  '#a855f7': { bg: 'bg-purple-500', text: 'text-white', name: 'Purple' },
  '#d946ef': { bg: 'bg-fuchsia-500', text: 'text-white', name: 'Fuchsia' },
  '#ec4899': { bg: 'bg-pink-500', text: 'text-white', name: 'Pink' },
  '#f43f5e': { bg: 'bg-rose-500', text: 'text-white', name: 'Rose' },
  '#64748b': { bg: 'bg-slate-500', text: 'text-white', name: 'Slate' },
};

const defaultColor: ColorClasses = { bg: 'bg-blue-500', text: 'text-white', name: 'Blue' };

/**
 * Get Tailwind CSS classes for a given hex color
 * Falls back to blue if color not found
 */
export function getColorClasses(color: string): ColorClasses {
  return colorMap[color] || defaultColor;
}
