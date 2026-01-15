/**
 * ParsedTaskPreview Component
 * Displays parsed task tokens as interactive chips
 * Shows preview of dates, lists, labels, and priority
 */

import { Calendar, List, Tag, Flag, X } from 'lucide-react';
import { ParsedTaskInput, ParsedToken } from '../../utils/taskParser';
import { PRIORITY_LEVELS } from '../../types/priority';

interface ParsedTaskPreviewProps {
  parsed: ParsedTaskInput;
  onRemoveToken?: (token: ParsedToken) => void;
  className?: string;
}

export default function ParsedTaskPreview({
  parsed,
  onRemoveToken,
  className = '',
}: ParsedTaskPreviewProps) {
  // Don't render if there are no tokens
  if (parsed.tokens.length === 0) {
    return null;
  }

  const renderToken = (token: ParsedToken, index: number) => {
    const handleRemove = (e: React.MouseEvent) => {
      e.stopPropagation();
      onRemoveToken?.(token);
    };

    const canRemove = !!onRemoveToken;

    switch (token.type) {
      case 'date':
        return (
          <div
            key={`date-${index}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 text-xs font-medium"
          >
            <Calendar className="w-3 h-3" />
            <span>{token.displayValue || token.value}</span>
            {canRemove && (
              <button
                onClick={handleRemove}
                className="ml-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5 transition-colors"
                title="Remove date"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'list':
        return (
          <div
            key={`list-${index}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 text-xs font-medium"
          >
            <List className="w-3 h-3" />
            <span>@{token.value}</span>
            {canRemove && (
              <button
                onClick={handleRemove}
                className="ml-0.5 hover:bg-purple-200 dark:hover:bg-purple-800 rounded-full p-0.5 transition-colors"
                title="Remove list"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'label':
        return (
          <div
            key={`label-${index}-${token.value}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 text-xs font-medium"
          >
            <Tag className="w-3 h-3" />
            <span>#{token.value}</span>
            {canRemove && (
              <button
                onClick={handleRemove}
                className="ml-0.5 hover:bg-green-200 dark:hover:bg-green-800 rounded-full p-0.5 transition-colors"
                title="Remove label"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );

      case 'priority': {
        const priorityColor = PRIORITY_LEVELS[token.value as keyof typeof PRIORITY_LEVELS]?.color;
        return (
          <div
            key={`priority-${index}`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{
              backgroundColor: `${priorityColor}20`,
              color: priorityColor,
            }}
          >
            <Flag className="w-3 h-3" />
            <span>{token.displayValue}</span>
            {canRemove && (
              <button
                onClick={handleRemove}
                className="ml-0.5 rounded-full p-0.5 transition-colors hover:opacity-70"
                title="Remove priority"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {parsed.tokens.map((token, index) => renderToken(token, index))}
    </div>
  );
}
