# Google Tasks Desktop App

A desktop application for Google Tasks featuring a Kanban-style board interface with advanced filtering, sorting, and task management capabilities.

## Features

### Core Features
- **Kanban Board Interface**: Visual task management with drag-and-drop
- **List View**: Unified list view across all task lists
- **Google Tasks Sync**: Full bidirectional sync with Google Tasks API
- **Labels & Priority**: Custom labels and priority levels (local metadata)
- **Advanced Filtering**: Filter by labels, priority, due dates, and status
- **Flexible Sorting**: Sort by due date, priority, title, or custom order

### Productivity Features
- **Global Quick-Add** (Cmd/Ctrl+Shift+N): Capture tasks from anywhere, even when app is minimized
- **Natural Language Input**: Type `Buy milk tomorrow @Shopping #groceries !high` and it just works
  - `@ListName` or `@"List Name"` — assigns to list
  - `#label` or `#"label name"` — adds label
  - `!high`, `!medium`, `!low` (or `!p1`, `!p2`, `!p3`) — sets priority
  - Natural dates: `today`, `tomorrow`, `next monday`, `jan 15`, `+3d`
- **My Day View**: Focus on tasks due today
- **Keyboard Shortcuts**: Full keyboard navigation (press `?` to see all shortcuts)

### Cross-Platform
- Windows, macOS, and Linux support via Electron

## Tech Stack

- **Desktop Framework**: Electron
- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Drag & Drop**: @dnd-kit
- **Styling**: Tailwind CSS + shadcn/ui
- **API**: Google Tasks API

## Project Structure

```
google-tasks-app/
├── electron/                    # Electron main process
│   ├── main.ts                 # App entry, global shortcuts
│   ├── preload.ts              # Secure IPC bridge
│   ├── quickAddWindow.ts       # Global quick-add window manager
│   ├── ipc/                    # IPC handlers
│   │   ├── auth.ts             # Google OAuth
│   │   ├── tasks.ts            # Tasks API operations
│   │   ├── storage.ts          # Key-value storage
│   │   └── quickAdd.ts         # Quick-add window control
│   └── utils/                  # Electron utilities
├── src/                        # React renderer process
│   ├── components/
│   │   ├── board/              # Kanban board, task lists
│   │   ├── task/               # Task cards, detail modal, quick-add
│   │   ├── filters/            # Filter bar, search
│   │   ├── labels/             # Label management
│   │   ├── sidebar/            # Navigation, filter presets
│   │   ├── layout/             # App shell, header
│   │   ├── settings/           # Settings panel
│   │   ├── common/             # Shared components (notifications, etc.)
│   │   └── ui/                 # Base shadcn/ui components
│   ├── stores/                 # Zustand state stores
│   ├── hooks/                  # Custom React hooks
│   ├── types/                  # TypeScript definitions
│   ├── utils/                  # Utilities (dateParser, taskParser, etc.)
│   └── constants/              # App constants
└── config/                     # Build configuration
```

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Google Cloud Console account (for OAuth credentials)

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google OAuth

**📚 For detailed setup instructions, see [OAUTH_SETUP.md](./OAUTH_SETUP.md)**

Quick steps:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **Google Tasks API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Tasks API"
   - Click "Enable"
4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as application type
   - Name it "Google Tasks Desktop"
   - Download the credentials JSON

### 3. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env` and add your Google OAuth credentials:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
```

### 4. Run Development Server

```bash
npm run dev
```

This will:
- Start the Vite dev server (React app)
- Compile and launch Electron
- Open DevTools automatically

## Development

### Available Scripts

- `npm run dev` - Start development mode
- `npm run build` - Build for production
- `npm run package` - Package app for current platform
- `npm run package:mac` - Build for macOS
- `npm run package:win` - Build for Windows
- `npm run package:linux` - Build for Linux
- `npm run lint` - Run ESLint
- `npm run type-check` - Check TypeScript types

### Project Configuration

#### TypeScript

- `tsconfig.json` - Root configuration
- `tsconfig.react.json` - React/renderer process config
- `tsconfig.electron.json` - Electron main process config

#### Vite

- `config/vite.config.ts` - Vite build configuration
- Includes path aliases for clean imports

#### Tailwind CSS

- `config/tailwind.config.js` - Tailwind configuration
- `config/postcss.config.js` - PostCSS configuration
- `src/index.css` - Global styles with Tailwind directives

## Architecture

### Electron Process Model

- **Main Process** (`electron/main.ts`): Manages app lifecycle, windows, and system integration
- **Renderer Process** (`src/`): React app running in browser window
- **Preload Script** (`electron/preload.ts`): Secure IPC bridge between main and renderer

### State Management

Uses Zustand for lightweight, modular state management:

- `authStore.ts` - Authentication state and Google OAuth
- `taskStore.ts` - Tasks, task lists, and optimistic updates
- `boardStore.ts` - Board layouts and organization
- `filterStore.ts` - Active filters, sort options, and presets
- `labelStore.ts` - Labels, priorities, and task metadata
- `uiStore.ts` - Modals, theme, sidebar, notifications
- `selectionStore.ts` - Multi-select and bulk operations
- `navigationStore.ts` - Keyboard navigation focus tracking

### Data Flow

1. User interacts with React UI
2. Component calls Zustand store action
3. Store updates state optimistically (instant UI feedback)
4. Store calls `window.electronAPI.method()` via IPC
5. Main process handler calls Google Tasks API
6. Response updates store state (or rolls back on error)
7. React components re-render via Zustand subscriptions

## Documentation

- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Complete OAuth setup and testing guide
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Quick start and API reference
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Architecture and implementation details
- **[test-auth.js](./test-auth.js)** - OAuth testing utilities

## Development Roadmap

### Completed

**Phase 1 — Quick Wins** ✅
- Comprehensive keyboard shortcuts with help modal (`?`)
- "My Day" focus view for tasks due today
- Natural language date parsing in task inputs

**Phase 2 — Capture & Workflow** ✅
- Global quick-add shortcut (Cmd/Ctrl+Shift+N)
- Full natural language input (@list, #label, !priority, dates)
- Parsed token preview with removable chips

### Upcoming

**Phase 3 — Views & Visualization**
- Task templates for recurring workflows
- Calendar view with drag-to-reschedule
- Eisenhower Matrix (4-quadrant priority grid)
- Google Calendar integration

**Phase 4 — Power Features**
- Pomodoro timer integration
- Offline support with local database
- AI task breakdown (subtask suggestions)

## API Integration

### Google Tasks API Endpoints

The app will use these primary endpoints:

- `GET /users/@me/lists` - List all task lists
- `GET /lists/{listId}/tasks` - Get tasks in a list
- `POST /lists/{listId}/tasks` - Create a task
- `PATCH /lists/{listId}/tasks/{taskId}` - Update a task
- `DELETE /lists/{listId}/tasks/{taskId}` - Delete a task
- `POST /lists/{listId}/tasks/{taskId}/move` - Move a task

### Local Metadata

Labels and other customizations are stored locally (not synced to Google Tasks):

- Stored in IndexedDB
- Linked to tasks by task ID
- Backed up with settings

## Contributing

This is currently a personal project. Contributions guidelines will be added later.

## License

MIT

## Acknowledgments

- Inspired by [TasksBoard](https://tasksboard.com)
- Built with [Electron](https://electronjs.org)
- UI components from [shadcn/ui](https://ui.shadcn.com)
