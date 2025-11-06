# Google Tasks Desktop App

A desktop application for Google Tasks featuring a Kanban-style board interface with advanced filtering, sorting, and task management capabilities.

## Features (Planned)

- **Kanban Board Interface**: Visual task management with drag-and-drop
- **Advanced Filtering**: Filter tasks by labels, due dates, status, and more
- **Flexible Sorting**: Sort by due date, priority, title, or custom order
- **Google Tasks Sync**: Full bidirectional sync with Google Tasks
- **Labels & Tags**: Custom labels for task categorization (local metadata)
- **Multiple Boards**: Organize tasks across different boards
- **Offline Support**: Work offline with automatic sync when connected
- **Keyboard Shortcuts**: Power user features for quick navigation
- **Cross-Platform**: Windows, macOS, and Linux support

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
├── electron/              # Electron main process
│   ├── main.ts           # App entry point
│   ├── preload.ts        # IPC bridge
│   └── ipc/              # IPC handlers (auth, tasks, storage)
├── src/                  # React renderer process
│   ├── components/       # React components
│   │   ├── board/        # Board and list components
│   │   ├── task/         # Task card and detail views
│   │   ├── filters/      # Filter and sort controls
│   │   ├── labels/       # Label management
│   │   └── ui/           # Base UI components (shadcn)
│   ├── services/         # Business logic
│   │   ├── api/          # Google Tasks API client
│   │   ├── sync/         # Sync engine
│   │   └── storage/      # Local storage
│   ├── stores/           # Zustand state stores
│   ├── hooks/            # Custom React hooks
│   ├── types/            # TypeScript definitions
│   ├── utils/            # Utility functions
│   └── constants/        # App constants
└── config/               # Configuration files
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

- `boardStore.ts` - Board and list state
- `taskStore.ts` - Tasks and subtasks
- `filterStore.ts` - Active filters and sort options
- `labelStore.ts` - Label metadata
- `authStore.ts` - Authentication state
- `uiStore.ts` - UI state (modals, loading, etc.)

### Data Flow

1. **UI Actions** → Zustand stores → Service layer → IPC → Main process → Google Tasks API
2. **Sync Engine** → Background polling → Update stores → Re-render UI

### Offline Support

- IndexedDB for local caching
- Offline queue for pending changes
- Conflict resolution when syncing

## Documentation

- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Complete OAuth setup and testing guide
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Quick start and API reference
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Architecture and implementation details
- **[test-auth.js](./test-auth.js)** - OAuth testing utilities

## Next Steps for Development

### Phase 1: Authentication & API Integration ✅ COMPLETED
- [x] Implement Google OAuth flow in Electron
- [x] Create Google Tasks API client
- [x] Set up token refresh mechanism
- [x] Build secure token storage
- [x] Implement IPC handlers for auth and tasks

### Phase 2: Core UI
- [ ] Build Kanban board layout
- [ ] Create task list component
- [ ] Implement task card component
- [ ] Add drag-and-drop with @dnd-kit
- [ ] Create task detail modal

### Phase 3: Filtering & Sorting
- [ ] Build filter toolbar
- [ ] Implement search functionality
- [ ] Add date range filtering
- [ ] Create sort dropdown
- [ ] Build label filter

### Phase 4: Labels & Customization
- [ ] Create label management UI
- [ ] Implement label picker
- [ ] Add color customization
- [ ] Build label filter logic

### Phase 5: Advanced Features
- [ ] Multiple boards support
- [ ] Keyboard shortcuts
- [ ] Settings panel
- [ ] Background sync
- [ ] Offline mode
- [ ] Export/import

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
