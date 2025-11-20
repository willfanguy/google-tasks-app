/**
 * Layout Component
 * Main app layout with header, sidebar, and content area
 */

import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from '../sidebar/Sidebar';
import FilterBar from '../filters/FilterBar';
import SortBar from '../filters/SortBar';
import BulkEditToolbar from '../filters/BulkEditToolbar';
import { useUIStore } from '../../stores/uiStore';
import UnifiedListView from '../board/UnifiedListView';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { viewMode } = useUIStore();

  // Enable keyboard shortcuts
  useKeyboardShortcuts();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <Header />

      {/* Main content area with sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar />

        {/* Content area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Filter bar */}
          <FilterBar />

          {/* Bulk edit toolbar */}
          <BulkEditToolbar />

          {/* Sort bar */}
          {viewMode === 'list' && <SortBar />}

          {/* View content - either board or list */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {viewMode === 'list' ? <UnifiedListView /> : children}
          </div>
        </main>
      </div>
    </div>
  );
}
