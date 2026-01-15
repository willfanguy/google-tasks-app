/**
 * Task Input Parser
 * Parses natural language task input including dates, lists, labels, and priority
 *
 * Syntax supported:
 * - @ListName or @"List Name with spaces" - assigns to list
 * - #label or #"label name" - adds label
 * - !high, !medium, !low, !p1, !p2, !p3 - sets priority
 * - Natural language dates from dateParser (today, tomorrow, jan 15, etc.)
 */

import { Priority } from '../types/priority';
import { parseNaturalDate, formatToDateInput } from './dateParser';

export type TokenType = 'date' | 'list' | 'label' | 'priority';

export interface ParsedToken {
  type: TokenType;
  raw: string;       // Original text including sigil (@, #, !)
  value: string;     // Parsed value (list name, label name, priority value, or date string)
  start: number;     // Start position in original input
  end: number;       // End position in original input
  displayValue?: string; // Human-friendly display (e.g., "Tomorrow" for date)
}

export interface ParsedTaskInput {
  title: string;              // Cleaned title with tokens removed
  date: Date | null;          // Parsed date object
  dateFormatted: string | null; // YYYY-MM-DD format for input
  dateDisplay: string | null; // Human-friendly date (e.g., "Tomorrow")
  listName: string | null;    // From @ListName
  labels: string[];           // From #label tokens
  priority: Priority | null;  // From !priority tokens
  tokens: ParsedToken[];      // All parsed tokens for preview
}

// Priority aliases mapping to canonical priority values
const PRIORITY_MAP: Record<string, Priority> = {
  'high': 'high',
  'p1': 'high',
  'medium': 'medium',
  'med': 'medium',
  'p2': 'medium',
  'low': 'low',
  'p3': 'low',
};

/**
 * Extract tokens matching a pattern from input
 * Handles both quoted ("value") and unquoted (value) forms
 */
function extractTokens(
  input: string,
  sigil: string,
  type: TokenType
): { tokens: ParsedToken[]; remaining: string } {
  const tokens: ParsedToken[] = [];
  let remaining = input;

  // Pattern for quoted values: @"list name" or #"label name"
  const quotedPattern = new RegExp(`${sigil}"([^"]+)"`, 'g');
  // Pattern for unquoted values: @listname or #label (stops at space or end)
  const unquotedPattern = new RegExp(`${sigil}([^\\s"]+)`, 'g');

  // First extract quoted tokens (they take precedence)
  let match: RegExpExecArray | null;
  while ((match = quotedPattern.exec(input)) !== null) {
    tokens.push({
      type,
      raw: match[0],
      value: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  // Then extract unquoted tokens, but skip if they overlap with quoted ones
  while ((match = unquotedPattern.exec(input)) !== null) {
    const overlaps = tokens.some(
      t => match!.index >= t.start && match!.index < t.end
    );
    if (!overlaps) {
      tokens.push({
        type,
        raw: match[0],
        value: match[1],
        start: match.index,
        end: match.index + match[0].length,
      });
    }
  }

  // Remove all found tokens from input (process in reverse order to preserve indices)
  const sortedTokens = [...tokens].sort((a, b) => b.start - a.start);
  for (const token of sortedTokens) {
    remaining = remaining.slice(0, token.start) + remaining.slice(token.end);
  }

  return { tokens, remaining };
}

/**
 * Extract priority token from input
 */
function extractPriority(input: string): {
  token: ParsedToken | null;
  remaining: string;
  priority: Priority | null;
} {
  // Pattern: !high, !medium, !low, !p1, !p2, !p3
  const pattern = /!(high|med|medium|low|p[1-3]|none)\b/gi;
  const match = pattern.exec(input);

  if (!match) {
    return { token: null, remaining: input, priority: null };
  }

  const rawPriority = match[1].toLowerCase();

  // Handle !none as removing priority
  if (rawPriority === 'none') {
    const remaining = input.slice(0, match.index) + input.slice(match.index + match[0].length);
    return {
      token: null,
      remaining: remaining.trim(),
      priority: null
    };
  }

  const priority = PRIORITY_MAP[rawPriority] || null;

  if (!priority) {
    return { token: null, remaining: input, priority: null };
  }

  const token: ParsedToken = {
    type: 'priority',
    raw: match[0],
    value: priority,
    start: match.index,
    end: match.index + match[0].length,
    displayValue: priority.charAt(0).toUpperCase() + priority.slice(1),
  };

  const remaining = input.slice(0, match.index) + input.slice(match.index + match[0].length);

  return { token, remaining: remaining.trim(), priority };
}

/**
 * Extract date from input using natural language parsing
 * Tries to find date expressions in the remaining text
 */
function extractDate(input: string): {
  token: ParsedToken | null;
  remaining: string;
  date: Date | null;
  dateFormatted: string | null;
  dateDisplay: string | null;
} {
  // Common date patterns to look for at word boundaries
  const datePatterns = [
    // Exact keywords
    /\b(today|tod|tomorrow|tom|tmr|yesterday)\b/i,
    // "in X days/weeks"
    /\bin\s+\d+\s+(days?|weeks?|d|w)\b/i,
    // "+X" or "+Xd" or "+Xw"
    /\+\d+(d|w)?/i,
    // "next monday", "next week"
    /\bnext\s+\w+\b/i,
    // Weekday names
    /\b(this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun)\b/i,
    // "jan 15", "january 15th", "15 jan"
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\s+\d{1,2}(st|nd|rd|th)?\b/i,
    /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec|january|february|march|april|may|june|july|august|september|october|november|december)\b/i,
    // MM/DD or MM/DD/YY
    /\b\d{1,2}\/\d{1,2}(\/\d{2,4})?\b/,
    // YYYY-MM-DD (ISO format)
    /\b\d{4}-\d{2}-\d{2}\b/,
  ];

  for (const pattern of datePatterns) {
    const match = pattern.exec(input);
    if (match) {
      const parsed = parseNaturalDate(match[0]);
      if (parsed.isValid && parsed.date) {
        const token: ParsedToken = {
          type: 'date',
          raw: match[0],
          value: formatToDateInput(parsed.date),
          start: match.index,
          end: match.index + match[0].length,
          displayValue: parsed.formatted || undefined,
        };

        const remaining = input.slice(0, match.index) + input.slice(match.index + match[0].length);

        return {
          token,
          remaining: remaining.trim(),
          date: parsed.date,
          dateFormatted: formatToDateInput(parsed.date),
          dateDisplay: parsed.formatted,
        };
      }
    }
  }

  return {
    token: null,
    remaining: input,
    date: null,
    dateFormatted: null,
    dateDisplay: null,
  };
}

/**
 * Clean up title by removing extra whitespace
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s+/g, ' ')  // Collapse multiple spaces
    .trim();
}

/**
 * Main parsing function
 * Parses a task input string and extracts all metadata
 */
export function parseTaskInput(input: string): ParsedTaskInput {
  const allTokens: ParsedToken[] = [];
  let remaining = input;

  // 1. Extract list assignment (@ListName)
  const listResult = extractTokens(remaining, '@', 'list');
  remaining = listResult.remaining;
  allTokens.push(...listResult.tokens);
  const listName = listResult.tokens.length > 0 ? listResult.tokens[0].value : null;

  // 2. Extract labels (#label)
  const labelResult = extractTokens(remaining, '#', 'label');
  remaining = labelResult.remaining;
  allTokens.push(...labelResult.tokens);
  const labels = labelResult.tokens.map(t => t.value);

  // 3. Extract priority (!high, !p1, etc.)
  const priorityResult = extractPriority(remaining);
  remaining = priorityResult.remaining;
  if (priorityResult.token) {
    allTokens.push(priorityResult.token);
  }

  // 4. Extract date (natural language)
  const dateResult = extractDate(remaining);
  remaining = dateResult.remaining;
  if (dateResult.token) {
    allTokens.push(dateResult.token);
  }

  // 5. Clean up the remaining title
  const title = cleanTitle(remaining);

  // Sort tokens by their original position for consistent display
  allTokens.sort((a, b) => a.start - b.start);

  return {
    title,
    date: dateResult.date,
    dateFormatted: dateResult.dateFormatted,
    dateDisplay: dateResult.dateDisplay,
    listName,
    labels,
    priority: priorityResult.priority,
    tokens: allTokens,
  };
}

/**
 * Check if input has any parseable tokens
 * Useful for showing/hiding the preview
 */
export function hasParseableContent(input: string): boolean {
  const parsed = parseTaskInput(input);
  return parsed.tokens.length > 0;
}

/**
 * Get a preview string for parsed content
 * Returns something like "Tomorrow, @Work, #urgent, High priority"
 */
export function getParsePreview(parsed: ParsedTaskInput): string {
  const parts: string[] = [];

  if (parsed.dateDisplay) {
    parts.push(parsed.dateDisplay);
  }

  if (parsed.listName) {
    parts.push(`@${parsed.listName}`);
  }

  for (const label of parsed.labels) {
    parts.push(`#${label}`);
  }

  if (parsed.priority) {
    parts.push(`${parsed.priority.charAt(0).toUpperCase() + parsed.priority.slice(1)} priority`);
  }

  return parts.join(', ');
}
