/**
 * Settings Component
 * Modal for app settings and preferences
 */

import { X, Sun, Moon, Monitor } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';

export default function Settings() {
  const { modals, closeSettings, theme, setTheme } = useUIStore();

  if (!modals.settings) return null;

  const themes = [
    {
      value: 'light' as const,
      label: 'Light',
      icon: Sun,
      description: 'Light theme',
    },
    {
      value: 'dark' as const,
      label: 'Dark',
      icon: Moon,
      description: 'Dark theme',
    },
    {
      value: 'system' as const,
      label: 'System',
      icon: Monitor,
      description: 'Follow system preference',
    },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
        onClick={closeSettings}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
          className="w-full max-w-md bg-card rounded-lg border border-border shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 id="settings-title" className="text-lg font-semibold text-foreground">Settings</h2>
            <button
              onClick={closeSettings}
              className="p-1 rounded-lg hover:bg-accent transition-colors"
              aria-label="Close settings"
            >
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 space-y-6">
            {/* Theme section */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Theme
              </label>
              <div className="space-y-2">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isSelected = theme === themeOption.value;

                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => setTheme(themeOption.value)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                        isSelected
                          ? 'border-primary bg-accent'
                          : 'border-border hover:bg-accent/50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${
                        isSelected ? 'text-primary' : 'text-muted-foreground'
                      }`} />
                      <div className="flex-1 text-left">
                        <div className={`text-sm font-medium ${
                          isSelected ? 'text-foreground' : 'text-foreground'
                        }`}>
                          {themeOption.label}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {themeOption.description}
                        </div>
                      </div>
                      {isSelected && (
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* App info section */}
            <div className="pt-4 border-t border-border">
              <div className="text-xs text-muted-foreground space-y-1">
                <div className="flex justify-between">
                  <span>Version</span>
                  <span>0.1.0</span>
                </div>
                <div className="flex justify-between">
                  <span>Build</span>
                  <span>Development</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border flex justify-end">
            <button
              onClick={closeSettings}
              className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
