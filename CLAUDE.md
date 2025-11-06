# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an Electron-based desktop application for Google Tasks featuring a Kanban-style board interface. The tech stack is:
- **Frontend**: React 18 + TypeScript + Vite
- **Desktop**: Electron (main process in `electron/`, renderer in `src/`)
- **State Management**: Zustand with optimistic updates
- **Styling**: Tailwind CSS + shadcn/ui components
- **Drag & Drop**: @dnd-kit library
- **API**: Google Tasks API via IPC handlers

## Development Commands

```bash
# Development
npm run dev              # Start Vite dev server + Electron (opens with DevTools)
npm run dev:vite         # Start Vite only
npm run dev:electron     # Compile and run Electron only

# Building
npm run build            # Build both React and Electron for production
npm run build:vite       # Build React app (outputs to dist/)
npm run build:electron   # Compile Electron TypeScript (outputs to dist-electron/)

# Packaging
npm run package          # Package for current platform (outputs to release/)
npm run package:mac      # Build macOS .dmg and .zip
npm run package:win      # Build Windows NSIS installer and portable
npm run package:linux    # Build Linux AppImage and .deb

# Code Quality
npm run lint             # Run ESLint on all .ts/.tsx files
npm run type-check       # TypeScript type checking without emitting files
```

## Architecture

### Electron Process Model

**Main Process** (`electron/main.ts`):
- Manages app lifecycle and window creation
- Handles IPC communication from renderer
- Node.js APIs and system integration

**Renderer Process** (`src/`):
- React application in Chromium window
- Communicates with main process via `window.electronAPI`
- No direct access to Node.js APIs

**Preload Script** (`electron/preload.ts`):
- Secure IPC bridge using `contextBridge`
- Exposes `window.electronAPI` and `window.electron` (alias)
- Type-safe API defined in `src/types/electron.d.ts`

### IPC Handlers

Located in `electron/ipc/`:
- **auth.ts** - Google OAuth flow, token management, token refresh
- **tasks.ts** - All Google Tasks API operations (CRUD for tasks and task lists)
- **storage.ts** - Key-value storage for app data

### State Management (Zustand)

All stores in `src/stores/` with full TypeScript types:

- **authStore.ts** - Authentication state (login, logout, user info, token expiry)
- **taskStore.ts** - Tasks and task lists with optimistic updates and API integration
- **boardStore.ts** - Board/list organization and layouts (persisted to localStorage)
- **filterStore.ts** - Search, filters, sorting, and filter presets (persisted)
- **labelStore.ts** - Custom labels for tasks (local metadata, persisted)
- **uiStore.ts** - Modals, notifications, theme, sidebar state, loading states (persisted)

**Key Patterns**:
- Optimistic updates in taskStore: Update UI immediately, rollback on API failure
- Stores communicate via `window.electronAPI.{method}()` for all backend operations
- Persistence handled automatically for board, label, filter, and UI stores
- Import all stores from `src/stores/index.ts`

### Path Aliases

Configured in `vite.config.ts` and `tsconfig.json`:
```typescript
'@' → './src'
'@components' → './src/components'
'@services' → './src/services'
'@stores' → './src/stores'
'@hooks' → './src/hooks'
'@types' → './src/types'
'@utils' → './src/utils'
'@constants' → './src/constants'
```

Use these aliases in imports to avoid relative path hell.

### TypeScript Configuration

Three separate tsconfig files:
- **tsconfig.json** - Root config, base settings
- **tsconfig.react.json** - React/renderer process (used by Vite)
- **tsconfig.electron.json** - Electron main process (used by tsc for electron/)

## Component Structure

Components are organized by feature in `src/components/`:
- **board/** - Kanban board, lists, and board management
- **task/** - Task cards and task detail views
- **filters/** - Filter controls, search, and sort options
- **labels/** - Label management and label pickers
- **layout/** - App shell, header, navigation
- **sidebar/** - Sidebar navigation and list selection
- **settings/** - Settings panels and preferences
- **ui/** - Base shadcn/ui components (Button, Dialog, etc.)
- **ErrorBoundary.tsx** - Top-level error boundary

## Data Flow

1. User action in React component
2. Call Zustand store action
3. Store updates state (optimistically if applicable)
4. Store calls `window.electronAPI.{method}()`
5. IPC handler in `electron/ipc/` receives request
6. Handler calls Google Tasks API
7. Response sent back to renderer
8. Store updates with server data or rolls back on error
9. React components re-render via Zustand subscriptions

## OAuth Setup

OAuth credentials required in `.env`:
```
VITE_GOOGLE_CLIENT_ID=...
VITE_GOOGLE_CLIENT_SECRET=...
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

Full OAuth setup instructions in `OAUTH_SETUP.md`. Test script available in `test-auth.js`.

## Important Notes

- **Development mode** runs Vite dev server on port 5173 and automatically opens DevTools
- **Environment variables** must be prefixed with `VITE_` to be accessible in renderer
- **Type definitions** for electronAPI must be kept in sync between `electron/preload.ts` and `src/types/electron.d.ts`
- **IPC security**: Never expose full `ipcRenderer` - only specific methods via preload script
- The app expects `window.electronAPI` to exist - will fail in browser without Electron
- **Local metadata** (labels, boards) stored in localStorage, not synced to Google Tasks
- **Optimistic updates** in taskStore provide instant UI feedback but may rollback on API errors

## Documentation

- **README.md** - Project overview, features, getting started
- **OAUTH_SETUP.md** - Complete OAuth configuration guide
- **SETUP_INSTRUCTIONS.md** - Quick start and API reference
- **IMPLEMENTATION_SUMMARY.md** - Detailed architecture and implementation notes
- **STORE_QUICKSTART.md** - 5-minute guide to using Zustand stores
- **STORE_SETUP_GUIDE.md** - Complete store integration guide
- **STORE_USAGE_EXAMPLES.md** - Advanced store usage examples
- **ZUSTAND_STORES_SUMMARY.md** - Overview of all stores
- **src/stores/README.md** - Store quick reference
