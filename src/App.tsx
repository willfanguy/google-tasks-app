/**
 * Main App Component
 * Entry point with authentication check and main layout
 */

import { useEffect } from 'react';
import { useAuthStore } from './stores/authStore';
import { useUIStore } from './stores/uiStore';
import Layout from './components/layout/Layout';
import Board from './components/board/Board';
import UnifiedListView from './components/board/UnifiedListView';
import TaskDetail from './components/task/TaskDetail';
import AddTaskButton from './components/board/AddTaskButton';
import QuickAddTask from './components/task/QuickAddTask';
import FloatingAddButton from './components/task/FloatingAddButton';
import LabelManager from './components/labels/LabelManager';
import Settings from './components/settings/Settings';
import Notifications from './components/common/Notifications';
import { logger } from './utils/logger';

function App() {
  const { authenticated, loading, login, checkAuth } = useAuthStore();
  const { theme, viewMode } = useUIStore();

  // Check authentication on mount
  useEffect(() => {
    logger.log('[App] Checking authentication...');
    checkAuth();
  }, [checkAuth]);

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;

    // Remove existing theme classes
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.add(prefersDark ? 'dark' : 'light');

      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      // Use explicit theme
      root.classList.add(theme);
    }
  }, [theme]);

  // Show loading state
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Show login screen if not authenticated
  if (!authenticated) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Google Tasks
          </h1>
          <p className="text-muted-foreground mb-8">
            A desktop Kanban board for Google Tasks
          </p>
          <button
            onClick={login}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  // Main app with layout
  return (
    <>
      <Layout>
        {viewMode === 'board' && <Board />}
        {viewMode === 'list' && <UnifiedListView />}
      </Layout>

      {/* Toast notifications */}
      <Notifications />

      {/* Modals */}
      <TaskDetail />
      <AddTaskButton />
      <QuickAddTask />
      <LabelManager />
      <Settings />

      {/* Floating Action Button */}
      <FloatingAddButton />
    </>
  );
}

export default App;
