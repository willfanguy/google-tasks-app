/**
 * Natural Language Date Parser
 * Parses user-friendly date expressions into Date objects
 */

export interface ParseResult {
  date: Date | null;
  isValid: boolean;
  originalInput: string;
  formatted: string | null; // Human-readable version for preview
}

const WEEKDAY_MAP: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tuesday: 2,
  wed: 3, wednesday: 3,
  thu: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
};

const MONTH_MAP: Record<string, number> = {
  jan: 0, january: 0,
  feb: 1, february: 1,
  mar: 2, march: 2,
  apr: 3, april: 3,
  may: 4,
  jun: 5, june: 5,
  jul: 6, july: 6,
  aug: 7, august: 7,
  sep: 8, sept: 8, september: 8,
  oct: 9, october: 9,
  nov: 10, november: 10,
  dec: 11, december: 11,
};

/**
 * Get today's date at midnight local time
 */
function getToday(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Add days to a date
 */
function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Add weeks to a date
 */
function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

/**
 * Get the next occurrence of a weekday
 * @param targetDay 0 = Sunday, 1 = Monday, etc.
 * @param includeToday If true, returns today if it matches the target day
 */
function getNextWeekday(targetDay: number, includeToday = false): Date {
  const today = getToday();
  const currentDay = today.getDay();
  let daysToAdd = targetDay - currentDay;

  if (daysToAdd < 0 || (daysToAdd === 0 && !includeToday)) {
    daysToAdd += 7;
  }

  return addDays(today, daysToAdd);
}

/**
 * Format a date for display
 */
function formatDate(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  };

  const today = getToday();
  const tomorrow = addDays(today, 1);
  const yesterday = addDays(today, -1);

  if (date.getTime() === today.getTime()) {
    return 'Today';
  } else if (date.getTime() === tomorrow.getTime()) {
    return 'Tomorrow';
  } else if (date.getTime() === yesterday.getTime()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', options);
}

/**
 * Convert a Date to YYYY-MM-DD format for HTML date input
 */
export function formatToDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse a YYYY-MM-DD string to a Date
 */
export function parseDateInput(value: string): Date | null {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return new Date(year, month - 1, day);
}

/**
 * Main date parsing function
 * Parses natural language date expressions
 */
export function parseNaturalDate(input: string): ParseResult {
  const trimmed = input.trim().toLowerCase();
  const originalInput = input;

  if (!trimmed) {
    return { date: null, isValid: false, originalInput, formatted: null };
  }

  let date: Date | null = null;

  // Handle simple keywords
  if (trimmed === 'today' || trimmed === 'tod') {
    date = getToday();
  } else if (trimmed === 'tomorrow' || trimmed === 'tom' || trimmed === 'tmr') {
    date = addDays(getToday(), 1);
  } else if (trimmed === 'yesterday') {
    date = addDays(getToday(), -1);
  }

  // Handle "in X days/weeks"
  if (!date) {
    const inPattern = /^in\s+(\d+)\s+(day|days|week|weeks|d|w)$/;
    const inMatch = trimmed.match(inPattern);
    if (inMatch) {
      const amount = parseInt(inMatch[1], 10);
      const unit = inMatch[2];
      if (unit.startsWith('w')) {
        date = addWeeks(getToday(), amount);
      } else {
        date = addDays(getToday(), amount);
      }
    }
  }

  // Handle "+X" or "+Xd" or "+Xw" shorthand
  if (!date) {
    const plusPattern = /^\+(\d+)(d|w)?$/;
    const plusMatch = trimmed.match(plusPattern);
    if (plusMatch) {
      const amount = parseInt(plusMatch[1], 10);
      const unit = plusMatch[2] || 'd';
      if (unit === 'w') {
        date = addWeeks(getToday(), amount);
      } else {
        date = addDays(getToday(), amount);
      }
    }
  }

  // Handle "next monday", "next friday", etc.
  if (!date) {
    const nextPattern = /^next\s+(\w+)$/;
    const nextMatch = trimmed.match(nextPattern);
    if (nextMatch) {
      const dayName = nextMatch[1];
      if (dayName in WEEKDAY_MAP) {
        // "next monday" means the monday after this coming one
        const targetDay = WEEKDAY_MAP[dayName];
        const thisWeekday = getNextWeekday(targetDay, false);
        date = addWeeks(thisWeekday, 1);
      } else if (dayName === 'week') {
        date = addWeeks(getToday(), 1);
      }
    }
  }

  // Handle weekday names: "monday", "fri", etc. (means this coming occurrence)
  if (!date) {
    const weekdayKey = trimmed.replace(/^this\s+/, '');
    if (weekdayKey in WEEKDAY_MAP) {
      const targetDay = WEEKDAY_MAP[weekdayKey];
      date = getNextWeekday(targetDay, true);
    }
  }

  // Handle "jan 15", "january 15", "15 jan", "15 january"
  if (!date) {
    // "jan 15" or "january 15" or "jan 15th"
    const monthDayPattern = /^(\w+)\s+(\d{1,2})(?:st|nd|rd|th)?$/;
    const monthDayMatch = trimmed.match(monthDayPattern);
    if (monthDayMatch) {
      const monthName = monthDayMatch[1];
      const day = parseInt(monthDayMatch[2], 10);
      if (monthName in MONTH_MAP && day >= 1 && day <= 31) {
        const month = MONTH_MAP[monthName];
        const today = getToday();
        let year = today.getFullYear();

        // If the date has passed this year, use next year
        const candidate = new Date(year, month, day);
        if (candidate < today) {
          year++;
        }

        date = new Date(year, month, day);
      }
    }

    // "15 jan" or "15th january"
    if (!date) {
      const dayMonthPattern = /^(\d{1,2})(?:st|nd|rd|th)?\s+(\w+)$/;
      const dayMonthMatch = trimmed.match(dayMonthPattern);
      if (dayMonthMatch) {
        const day = parseInt(dayMonthMatch[1], 10);
        const monthName = dayMonthMatch[2];
        if (monthName in MONTH_MAP && day >= 1 && day <= 31) {
          const month = MONTH_MAP[monthName];
          const today = getToday();
          let year = today.getFullYear();

          const candidate = new Date(year, month, day);
          if (candidate < today) {
            year++;
          }

          date = new Date(year, month, day);
        }
      }
    }
  }

  // Handle "1/15" or "01/15" (MM/DD format)
  if (!date) {
    const slashPattern = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?$/;
    const slashMatch = trimmed.match(slashPattern);
    if (slashMatch) {
      const month = parseInt(slashMatch[1], 10) - 1; // 0-indexed
      const day = parseInt(slashMatch[2], 10);
      let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : getToday().getFullYear();

      // Handle 2-digit years
      if (year < 100) {
        year += 2000;
      }

      if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        // If no year provided and date has passed, use next year
        if (!slashMatch[3]) {
          const today = getToday();
          const candidate = new Date(year, month, day);
          if (candidate < today) {
            year++;
          }
        }

        date = new Date(year, month, day);
      }
    }
  }

  // Handle ISO format (YYYY-MM-DD) - for pasting dates
  if (!date) {
    const isoPattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const isoMatch = trimmed.match(isoPattern);
    if (isoMatch) {
      const year = parseInt(isoMatch[1], 10);
      const month = parseInt(isoMatch[2], 10) - 1;
      const day = parseInt(isoMatch[3], 10);
      date = new Date(year, month, day);
    }
  }

  if (date) {
    return {
      date,
      isValid: true,
      originalInput,
      formatted: formatDate(date),
    };
  }

  return { date: null, isValid: false, originalInput, formatted: null };
}
