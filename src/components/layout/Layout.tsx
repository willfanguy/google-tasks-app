/**
 * Layout Component
 * Main app layout with header and content area
 */

import { ReactNode } from 'react';
import Header from './Header';
import FilterBar from '../filters/FilterBar';
import BulkEditToolbar from '../filters/BulkEditToolbar';
import { useUIStore } from '../../stores/uiStore';
import UnifiedListView from '../board/UnifiedListView';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useExternalSync } from '../../hooks/useExternalSync';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { viewMode } = useUIStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  // Enable external sync (JIRA -> labels/priorities)
  useExternalSync();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header />

      {/* Main content area */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Filter bar */}
        <FilterBar />

        {/* Bulk edit toolbar */}
        <BulkEditToolbar />

        {/* View content - either board or list */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {viewMode === 'list' ? <UnifiedListView /> : children}
        </div>
      </main>
    </div>
  );
}
