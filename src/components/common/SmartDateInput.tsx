/**
 * SmartDateInput Component
 * Hybrid text/date input that supports natural language date parsing
 */

import { useState, useEffect, useRef } from 'react';
import { Calendar, X } from 'lucide-react';
import { parseNaturalDate, formatToDateInput, parseDateInput } from '../../utils/dateParser';

interface SmartDateInputProps {
  value: string; // YYYY-MM-DD format or empty
  onChange: (value: string) => void; // Returns YYYY-MM-DD format
  placeholder?: string;
  className?: string;
}

export default function SmartDateInput({
  value,
  onChange,
  placeholder = 'today, tomorrow, jan 15...',
  className = '',
}: SmartDateInputProps) {
  const [textValue, setTextValue] = useState('');
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [showSuggestion, setShowSuggestion] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // When the external value changes (e.g., from date picker), clear text input
  // We intentionally exclude textValue from deps to avoid infinite loops
  useEffect(() => {
    if (value && textValue) {
      setTextValue('');
      setSuggestion(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  // Format the current value for display
  const displayValue = (): string => {
    if (textValue) {
      return textValue;
    }
    if (value) {
      const date = parseDateInput(value);
      if (date) {
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
        });
      }
    }
    return '';
  };

  // Handle text input changes
  const handleTextChange = (text: string) => {
    setTextValue(text);

    if (!text.trim()) {
      setSuggestion(null);
      setShowSuggestion(false);
      return;
    }

    const parsed = parseNaturalDate(text);
    if (parsed.isValid && parsed.formatted) {
      setSuggestion(parsed.formatted);
      setShowSuggestion(true);
    } else {
      setSuggestion(null);
      setShowSuggestion(false);
    }
  };

  // Commit the parsed date
  const handleCommit = () => {
    if (!textValue.trim()) return;

    const parsed = parseNaturalDate(textValue);
    if (parsed.isValid && parsed.date) {
      onChange(formatToDateInput(parsed.date));
      setTextValue('');
      setSuggestion(null);
      setShowSuggestion(false);
    }
  };

  // Handle key events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && suggestion) {
      e.preventDefault();
      handleCommit();
    } else if (e.key === 'Escape') {
      setTextValue('');
      setSuggestion(null);
      setShowSuggestion(false);
    } else if (e.key === 'Tab' && suggestion) {
      e.preventDefault();
      handleCommit();
    }
  };

  // Handle blur - commit if valid
  const handleBlur = () => {
    // Delay hiding suggestion to allow click
    setTimeout(() => {
      setShowSuggestion(false);
    }, 150);

    if (textValue.trim() && suggestion) {
      handleCommit();
    } else if (textValue.trim() && !suggestion) {
      // Invalid input, clear it
      setTextValue('');
    }
  };

  // Clear the date
  const handleClear = () => {
    onChange('');
    setTextValue('');
    setSuggestion(null);
    setShowSuggestion(false);
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        {/* Text input with calendar icon */}
        <div className="relative flex-1">
          <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={textValue || displayValue()}
            onChange={(e) => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            onFocus={() => {
              if (textValue && suggestion) {
                setShowSuggestion(true);
              }
            }}
            placeholder={placeholder}
            className="w-full pl-10 pr-8 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground"
          />

          {/* Clear button */}
          {(value || textValue) && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent transition-colors"
            >
              <X className="w-3 h-3 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Native date picker as fallback */}
        <input
          type="date"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            setTextValue('');
            setSuggestion(null);
          }}
          className="w-10 h-10 p-0 bg-background border border-border rounded-lg cursor-pointer opacity-0 absolute right-0 pointer-events-none"
          style={{ clipPath: 'inset(0)' }}
          tabIndex={-1}
        />

        {/* Visual date picker button */}
        <label className="flex-shrink-0 p-2 rounded-lg border border-border hover:bg-accent transition-colors cursor-pointer">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={value}
            onChange={(e) => {
              onChange(e.target.value);
              setTextValue('');
              setSuggestion(null);
            }}
            className="sr-only"
          />
        </label>
      </div>

      {/* Suggestion dropdown */}
      {showSuggestion && suggestion && (
        <div className="absolute left-0 right-0 top-full mt-1 p-2 bg-card border border-border rounded-lg shadow-lg z-10">
          <button
            type="button"
            onClick={handleCommit}
            className="w-full flex items-center gap-2 p-2 rounded hover:bg-accent transition-colors text-left"
          >
            <Calendar className="w-4 h-4 text-primary" />
            <span className="text-sm">
              <span className="text-muted-foreground">Set to: </span>
              <span className="font-medium text-foreground">{suggestion}</span>
            </span>
            <span className="ml-auto text-xs text-muted-foreground">Enter</span>
          </button>
        </div>
      )}
    </div>
  );
}
