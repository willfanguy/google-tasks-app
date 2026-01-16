/**
 * Header Component
 * Top navigation bar with search, user info, and account actions
 */

import { Settings, LogOut, CheckSquare, Search } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useFilterStore } from '../../stores/filterStore';
import { logger } from '../../utils/logger';

export default function Header() {
  const { user, logout } = useAuthStore();
  const { activeFilters, setSearchQuery } = useFilterStore();

  const handleLogout = async () => {
    logger.log('[Header] Logout clicked');
    await logout();
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <header
      className="h-14 border-b border-border bg-card flex items-center justify-between pr-4 flex-shrink-0"
      style={{
        WebkitAppRegion: 'drag',
        paddingLeft: '80px' // Space for macOS traffic lights
      } as React.CSSProperties}
    >
      {/* Left: App icon */}
      <CheckSquare
        className="w-5 h-5 text-primary flex-shrink-0 -ml-[64px]"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      />

      {/* Center: Search input */}
      <div
        className="flex-1 flex justify-center"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        <div className="w-full max-w-md relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            id="search-input"
            type="text"
            placeholder="Search tasks..."
            value={activeFilters.search}
            onChange={handleSearchChange}
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring text-foreground placeholder:text-muted-foreground"
          />
        </div>
      </div>

      {/* Right: User info and account actions */}
      <div
        className="flex items-center gap-3"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* User email */}
        {user.email && (
          <div className="text-sm text-muted-foreground hidden sm:block">
            {user.email}
          </div>
        )}

        {/* Settings button */}
        <button
          onClick={() => {
            logger.log('[Header] Settings clicked');
            import('../../stores/uiStore').then(m => m.useUIStore.getState().openSettings());
          }}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Settings"
          aria-label="Settings"
        >
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* Logout button */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg hover:bg-accent transition-colors"
          title="Logout"
          aria-label="Logout"
        >
          <LogOut className="w-5 h-5 text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
