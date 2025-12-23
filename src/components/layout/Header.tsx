/**
 * Header Component
 * Top navigation bar with app branding, auth status, and actions
 */

import { Settings, LogOut, CheckSquare, Tag, RefreshCw, LayoutGrid, List, CheckCheck } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useUIStore } from '../../stores/uiStore';
import { useTaskStore } from '../../stores/taskStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { logger } from '../../utils/logger';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { openSettings, openLabelManager, viewMode, setViewMode } = useUIStore();
  const { syncAll, loading } = useTaskStore();
  const { isSelectionMode, exitSelectionMode, enterSelectionMode } = useSelectionStore();

  const handleLogout = async () => {
    logger.log('[Header] Logout clicked');
    await logout();
  };

  const handleSettings = () => {
    logger.log('[Header] Settings clicked');
    openSettings();
  };

  const handleSync = async () => {
    logger.log('[Header] Sync clicked');
    await syncAll();
  };

  const handleToggleSelectionMode = () => {
    if (isSelectionMode) {
      logger.log('[Header] Exiting selection mode');
      exitSelectionMode();
    } else {
      logger.log('[Header] Entering selection mode');
      enterSelectionMode();
    }
  };

  return (
    <header
      className="h-16 border-b border-border bg-card flex items-center justify-between pr-6 flex-shrink-0"
      style={{
        WebkitAppRegion: 'drag',
        paddingLeft: '80px' // Space for macOS traffic lights
      } as React.CSSProperties}
    >
      {/* Left: App branding */}
      <div className="flex items-center gap-3">
        <CheckSquare className="w-6 h-6 text-primary" />
        <h1 className="text-xl font-bold text-foreground">Google Tasks</h1>
      </div>

      {/* Right: User info and actions */}
      <div
        className="flex items-center gap-4"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* View mode toggle */}
        <div className="flex items-center rounded-lg border border-border overflow-hidden">
          <button
            type="button"
            onClick={() => setViewMode('board')}
            className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              viewMode === 'board' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            title="Board view"
          >
            <LayoutGrid className="w-4 h-4" />
            <span className="hidden sm:inline">Board</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
              viewMode === 'list' ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
            }`}
            title="List view"
          >
            <List className="w-4 h-4" />
            <span className="hidden sm:inline">List</span>
          </button>
        </div>

        {/* User email */}
        {user.email && (
          <div className="text-sm text-muted-foreground">
            {user.email}
          </div>
        )}

        {/* Sync button */}
        <button
          onClick={handleSync}
          disabled={loading}
          className="p-2 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title="Sync with Google Tasks"
        >
          <RefreshCw className={`w-5 h-5 text-muted-foreground ${loading ? 'animate-spin' : ''}`} />
        </button>

        {/* Selection mode toggle */}
        <button
          onClick={handleToggleSelectionMode}
          className={`p-2 rounded-lg transition-colors ${
            isSelectionMode
              ? 'bg-primary text-primary-foreground'
              : 'hover:bg-accent'
          }`}
          title={isSelectionMode ? 'Exit selection mode' : 'Enter selection mode'}
        >
          <CheckCheck className={`w-5 h-5 ${isSelectionMode ? '' : 'text-muted-foreground'}`} />
        </button>

        {/* Labels button */}
        <button
          onClick={openLabelManager}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Manage Labels"
        >
          <Tag className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Settings button */}
        <button
          onClick={handleSettings}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Logout"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
