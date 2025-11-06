# Zustand Store Setup Guide

This guide will help you integrate the Zustand stores into your Google Tasks desktop app.

## What's Been Created

### 6 Comprehensive Stores

1. **authStore.ts** - Authentication state management
2. **taskStore.ts** - Task and task list management with optimistic updates
3. **boardStore.ts** - Board management with localStorage persistence
4. **filterStore.ts** - Filtering and sorting logic
5. **labelStore.ts** - Label management with localStorage persistence
6. **uiStore.ts** - UI state management (modals, notifications, theme)
7. **index.ts** - Barrel export file for easy imports

### Documentation

- **STORE_USAGE_EXAMPLES.md** - Comprehensive usage examples for all stores
- **STORE_SETUP_GUIDE.md** - This file

## Quick Start

### 1. Verify Dependencies

The stores use these packages (already in your package.json):
- ✅ `zustand` - State management
- ✅ `date-fns` - Date utilities (optional for date filtering)

### 2. Import Stores in Your Components

```tsx
// Import individual stores
import { useAuthStore } from './stores/authStore';
import { useTaskStore } from './stores/taskStore';

// OR import from barrel file
import { useAuthStore, useTaskStore, useBoardStore } from './stores';
```

### 3. Basic Integration Example

Here's a minimal example to get started:

```tsx
// src/App.tsx
import { useEffect } from 'react';
import { useAuthStore, useTaskStore, useUIStore } from './stores';

function App() {
  const { authenticated, loading: authLoading, login } = useAuthStore();
  const { taskLists, fetchTaskLists } = useTaskStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (authenticated) {
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  if (authLoading) {
    return <div>Loading...</div>;
  }

  if (!authenticated) {
    return (
      <div>
        <h1>Google Tasks</h1>
        <button onClick={login}>Login with Google</button>
      </div>
    );
  }

  return (
    <div>
      <h1>My Task Lists</h1>
      <ul>
        {taskLists.map((list) => (
          <li key={list.id}>{list.title}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
```

## Store Overview

### 1. Authentication Store (authStore.ts)

**Purpose**: Manages Google OAuth authentication

**Key Features**:
- Automatic auth check on initialization
- User info storage
- Token expiration tracking
- Error handling

**Primary Actions**:
- `login()` - Start OAuth flow
- `logout()` - Clear auth state
- `checkAuth()` - Verify current auth status
- `getAuthStatus()` - Get detailed auth info

**State**:
```typescript
{
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  user: { email?: string; name?: string; picture?: string };
  expiresAt?: number;
}
```

---

### 2. Task Store (taskStore.ts)

**Purpose**: Manages tasks and task lists with Google Tasks API

**Key Features**:
- Optimistic updates (instant UI feedback)
- Automatic rollback on errors
- Task list caching (30-second cache)
- Batch operations support

**Primary Actions**:
- `fetchTaskLists()` - Get all task lists
- `fetchTasks(listId)` - Get tasks for a list
- `createTask(listId, task)` - Create new task
- `updateTask(listId, taskId, updates)` - Update existing task
- `deleteTask(listId, taskId)` - Delete task
- `toggleTaskStatus(listId, taskId)` - Toggle complete/incomplete
- `moveTask(listId, taskId, data)` - Move or reorder task

**State**:
```typescript
{
  taskLists: TaskList[];
  tasks: Map<string, Task[]>; // listId -> tasks
  loading: boolean;
  loadingLists: Set<string>;
  error: string | null;
  lastSync: Map<string, number>; // listId -> timestamp
}
```

**Important Notes**:
- Uses optimistic updates for better UX
- Automatically rolls back on API errors
- Caches task lists to reduce API calls
- Preserves local metadata (labels)

---

### 3. Board Store (boardStore.ts)

**Purpose**: Manages board layouts and organization

**Key Features**:
- localStorage persistence
- Default board on first launch
- Board layout customization
- List reordering

**Primary Actions**:
- `createBoard(name, listIds?)` - Create new board
- `deleteBoard(id)` - Delete board (except default)
- `setCurrentBoard(id)` - Switch active board
- `updateBoardLayout(boardId, layout)` - Update layout settings
- `reorderLists(boardId, listOrder)` - Reorder lists
- `addListToBoard(boardId, listId)` - Add list to board
- `removeListFromBoard(boardId, listId)` - Remove list from board
- `toggleListCollapse(boardId, listId)` - Collapse/expand list

**State**:
```typescript
{
  boards: Board[];
  currentBoardId: string | null;
  layouts: Map<string, BoardLayout>;
}
```

**Board Layout Options**:
```typescript
{
  boardId: string;
  listOrder: string[];
  collapsedLists: string[];
  viewMode: 'board' | 'list' | 'calendar';
}
```

---

### 4. Filter Store (filterStore.ts)

**Purpose**: Manages task filtering and sorting

**Key Features**:
- Multiple filter types
- Custom sort options
- Filter presets (saved filters)
- Combined filtering and sorting

**Primary Actions**:
- `setSearchQuery(query)` - Text search
- `toggleLabelFilter(labelId)` - Toggle label filter
- `setStatusFilter(status)` - Filter by status
- `setDateRangeFilter(range)` - Filter by due date
- `setSortOption(option)` - Change sort order
- `clearFilters()` - Reset all filters
- `applyPreset(presetId)` - Apply saved filter preset
- `createPreset(name, icon?)` - Save current filters

**Computed Functions**:
- `getFilteredTasks(tasks)` - Apply active filters
- `getSortedTasks(tasks)` - Apply sorting
- `getFilteredAndSortedTasks(tasks)` - Apply both
- `hasActiveFilters()` - Check if any filters active

**Sort Options**:
- `'manual'` - Original order
- `'dueDate-asc'` / `'dueDate-desc'` - By due date
- `'title-asc'` / `'title-desc'` - Alphabetical
- `'status'` - Active first
- `'created-asc'` / `'created-desc'` - By creation date

**Default Filter Presets**:
1. All Tasks
2. Active (needsAction)
3. Completed
4. Due Today

---

### 5. Label Store (labelStore.ts)

**Purpose**: Manages task labels (local metadata)

**Key Features**:
- localStorage persistence
- Color customization
- Task-label relationships
- Label ordering

**Primary Actions**:
- `createLabel(name, color?)` - Create new label
- `updateLabel(id, updates)` - Update label properties
- `deleteLabel(id)` - Delete label and remove from tasks
- `reorderLabels(labelIds)` - Change label order
- `addLabelToTask(taskId, labelId)` - Add label to task
- `removeLabelFromTask(taskId, labelId)` - Remove label from task
- `setTaskLabels(taskId, labelIds)` - Replace all task labels
- `clearTaskLabels(taskId)` - Remove all labels from task

**Getters**:
- `getTaskLabels(taskId)` - Get label IDs for task
- `getLabelById(id)` - Get label details
- `getTasksWithLabel(labelId)` - Get tasks with label
- `getSortedLabels()` - Get labels in order

**Available Colors**:
18 predefined colors including red, orange, yellow, green, blue, purple, pink, and more.

**Important Notes**:
- Labels are LOCAL only (not synced to Google Tasks)
- Must sync labels with tasks manually when needed
- Labels persist across sessions via localStorage

---

### 6. UI Store (uiStore.ts)

**Purpose**: Manages UI state and preferences

**Key Features**:
- Modal management
- Notification system
- Theme preferences
- Loading indicators
- localStorage persistence for preferences

**Primary Actions - Modals**:
- `openTaskDetail(taskId, listId)` - Open task details
- `closeTaskDetail()` - Close task details
- `openCreateTask(listId)` - Open create task modal
- `closeCreateTask()` - Close create task modal
- `openCreateBoard()` - Open create board modal
- `closeCreateBoard()` - Close create board modal
- `openCreateLabel()` - Open create label modal
- `closeCreateLabel()` - Close create label modal
- `openSettings()` - Open settings modal
- `closeSettings()` - Close settings modal
- `toggleFilterPanel()` - Toggle filter panel
- `closeAllModals()` - Close all modals

**Primary Actions - UI Preferences**:
- `toggleSidebar()` - Toggle sidebar collapsed
- `setSidebarCollapsed(collapsed)` - Set sidebar state
- `setTheme(theme)` - Set theme ('light' | 'dark' | 'system')
- `setCompactMode(compact)` - Enable/disable compact mode

**Primary Actions - Notifications**:
- `addNotification(type, message, duration?)` - Add notification
- `removeNotification(id)` - Remove notification
- `clearNotifications()` - Clear all notifications

**Primary Actions - Loading**:
- `setLoading(key, value)` - Set loading indicator
- `isLoading(key)` - Check if loading

**Notification Types**:
- `'success'` - Green, positive actions
- `'error'` - Red, errors
- `'info'` - Blue, informational
- `'warning'` - Yellow, warnings

---

## Data Flow Architecture

### Typical Flow for Creating a Task

```
1. User clicks "Create Task" button
   └─> Component calls: useUIStore.openCreateTask(listId)

2. User fills form and submits
   └─> Component calls: useTaskStore.createTask(listId, taskData)
       ├─> Store creates optimistic task (instant UI update)
       ├─> Makes API call via window.electronAPI.createTask()
       └─> On success: Replace optimistic task with real task
           On failure: Remove optimistic task, show error

3. Show success notification
   └─> Component calls: useUIStore.addNotification('success', 'Task created')

4. Close modal
   └─> Component calls: useUIStore.closeCreateTask()
```

### Typical Flow for Filtering Tasks

```
1. User types in search box
   └─> Component calls: useFilterStore.setSearchQuery(query)

2. Component gets filtered tasks
   └─> const tasks = useFilterStore.getFilteredAndSortedTasks(allTasks)

3. Component renders filtered tasks
   └─> Map over filtered tasks and display
```

### Typical Flow for Managing Labels

```
1. User creates label
   └─> Component calls: useLabelStore.createLabel(name, color)

2. User adds label to task
   └─> Component calls: useLabelStore.addLabelToTask(taskId, labelId)

3. User filters by label
   └─> Component calls: useFilterStore.toggleLabelFilter(labelId)

4. Get filtered tasks
   └─> const tasks = useFilterStore.getFilteredTasks(allTasks)
```

---

## Integration Checklist

### Phase 1: Basic Setup
- [ ] Import stores in main App component
- [ ] Add authentication flow with authStore
- [ ] Display task lists with taskStore
- [ ] Test basic CRUD operations

### Phase 2: UI Enhancement
- [ ] Integrate UI store for modals
- [ ] Add notification system
- [ ] Implement theme switcher
- [ ] Add loading states

### Phase 3: Advanced Features
- [ ] Integrate board management
- [ ] Add filtering and sorting
- [ ] Implement label system
- [ ] Add filter presets

### Phase 4: Polish
- [ ] Handle all error states
- [ ] Add optimistic updates
- [ ] Persist user preferences
- [ ] Test all flows

---

## Common Patterns

### Pattern 1: Protected Routes

```tsx
function ProtectedRoute({ children }) {
  const { authenticated, loading } = useAuthStore();

  if (loading) return <LoadingSpinner />;
  if (!authenticated) return <Navigate to="/login" />;

  return children;
}
```

### Pattern 2: Optimistic Updates

```tsx
async function handleDeleteTask(listId: string, taskId: string) {
  const { deleteTask } = useTaskStore.getState();
  const { addNotification } = useUIStore.getState();

  await deleteTask(listId, taskId);

  // Store handles optimistic update and rollback
  // Just show notification based on success
  if (!useTaskStore.getState().error) {
    addNotification('success', 'Task deleted');
  }
}
```

### Pattern 3: Combined Store Usage

```tsx
function TaskDashboard() {
  const authenticated = useAuthStore((state) => state.authenticated);
  const { getCurrentBoard } = useBoardStore();
  const { getTasksByList } = useTaskStore();
  const { getFilteredAndSortedTasks } = useFilterStore();

  const board = getCurrentBoard();

  return (
    <div>
      {board?.lists.map((listId) => {
        const allTasks = getTasksByList(listId);
        const filteredTasks = getFilteredAndSortedTasks(allTasks);
        return <TaskList key={listId} tasks={filteredTasks} />;
      })}
    </div>
  );
}
```

---

## Troubleshooting

### Issue: Stores not persisting to localStorage

**Solution**: Check browser console for errors. Clear localStorage if needed:
```javascript
localStorage.clear()
```

Persisted stores:
- `board-storage` - Board store
- `filter-storage` - Filter presets and sort option
- `label-storage` - Labels and task-label mappings
- `ui-storage` - UI preferences (theme, sidebar, compact mode)

### Issue: Tasks not updating after API calls

**Solution**: Check:
1. Is `window.electronAPI` available?
2. Are API calls successful? (check Network tab)
3. Is authentication valid?
4. Check console for store errors

### Issue: Optimistic updates reverting immediately

**Solution**: API call is likely failing. Check:
1. Network tab for API errors
2. Console for error messages
3. Authentication status
4. API rate limits

### Issue: Filters not working

**Solution**:
1. Check if `hasActiveFilters()` returns true
2. Verify filter values are set correctly
3. Check if using `getFilteredAndSortedTasks()` correctly
4. Console log the filtered tasks to debug

### Issue: Labels not showing on tasks

**Solution**:
1. Verify labels exist in label store
2. Check task-label mappings with `getTaskLabels(taskId)`
3. Ensure label IDs match
4. Remember labels are local (not from API)

---

## Performance Tips

### 1. Use Selective Subscriptions

```tsx
// ✅ Good - only subscribes to authenticated
const authenticated = useAuthStore((state) => state.authenticated);

// ❌ Bad - subscribes to entire store
const authStore = useAuthStore();
```

### 2. Memoize Computed Values

```tsx
const filteredTasks = useMemo(() => {
  return getFilteredAndSortedTasks(tasks);
}, [tasks, getFilteredAndSortedTasks]);
```

### 3. Batch Updates

```tsx
// Update multiple things at once
useUIStore.setState((state) => {
  state.modals.createTask = false;
  state.selectedListId = null;
});
```

### 4. Cache API Calls

The task store already implements caching (30-second cache per list). To force refresh:
```tsx
fetchTasks(listId, true); // forceRefresh = true
```

---

## Next Steps

1. **Review STORE_USAGE_EXAMPLES.md** for detailed usage examples
2. **Start with authentication** - Get login/logout working first
3. **Add task display** - Show task lists and tasks
4. **Implement CRUD operations** - Create, update, delete tasks
5. **Add UI features** - Modals, notifications, theme
6. **Integrate filters** - Search, sort, filter presets
7. **Add labels** - Create labels and tag tasks
8. **Implement boards** - Multiple board views

---

## Testing Checklist

### Authentication
- [ ] Login flow works
- [ ] Logout clears state
- [ ] Auth persists on page reload
- [ ] Token expiration handled

### Tasks
- [ ] Fetch task lists
- [ ] Display tasks
- [ ] Create task (optimistic update)
- [ ] Update task (optimistic update)
- [ ] Delete task (optimistic update)
- [ ] Toggle completion
- [ ] Move task between lists

### Boards
- [ ] Create board
- [ ] Switch boards
- [ ] Delete board
- [ ] Reorder lists
- [ ] Toggle view modes
- [ ] Collapse/expand lists

### Filters
- [ ] Search tasks
- [ ] Filter by status
- [ ] Filter by labels
- [ ] Filter by date range
- [ ] Sort tasks
- [ ] Apply presets
- [ ] Create custom preset

### Labels
- [ ] Create label
- [ ] Update label color
- [ ] Delete label
- [ ] Add label to task
- [ ] Remove label from task
- [ ] Filter by label

### UI
- [ ] Open/close modals
- [ ] Show notifications
- [ ] Toggle sidebar
- [ ] Switch theme
- [ ] Loading indicators
- [ ] Preferences persist

---

## Support

If you encounter issues:
1. Check console for error messages
2. Review store state with React DevTools
3. Clear localStorage if needed: `localStorage.clear()`
4. Check API responses in Network tab
5. Verify authentication is valid

For detailed usage examples, see **STORE_USAGE_EXAMPLES.md**.
