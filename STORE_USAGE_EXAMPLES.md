# Zustand Store Usage Examples

This document provides comprehensive examples of how to use the Zustand stores in your React components.

## Table of Contents
1. [Authentication Store](#authentication-store)
2. [Task Store](#task-store)
3. [Board Store](#board-store)
4. [Filter Store](#filter-store)
5. [Label Store](#label-store)
6. [UI Store](#ui-store)
7. [Combined Examples](#combined-examples)

---

## Authentication Store

### Basic Usage

```tsx
import { useAuthStore } from './stores';

function LoginButton() {
  const { authenticated, loading, login, logout } = useAuthStore();

  if (authenticated) {
    return (
      <button onClick={logout} disabled={loading}>
        Logout
      </button>
    );
  }

  return (
    <button onClick={login} disabled={loading}>
      {loading ? 'Logging in...' : 'Login with Google'}
    </button>
  );
}
```

### Accessing User Info

```tsx
import { useAuthStore } from './stores';

function UserProfile() {
  const { user, authenticated, expiresAt } = useAuthStore();

  if (!authenticated) {
    return <div>Please log in</div>;
  }

  return (
    <div>
      <p>Email: {user.email}</p>
      {expiresAt && <p>Session expires: {new Date(expiresAt).toLocaleString()}</p>}
    </div>
  );
}
```

### Error Handling

```tsx
import { useAuthStore } from './stores';

function AuthStatus() {
  const { error, clearError } = useAuthStore();

  if (!error) return null;

  return (
    <div className="error-banner">
      <p>{error}</p>
      <button onClick={clearError}>Dismiss</button>
    </div>
  );
}
```

---

## Task Store

### Fetching Task Lists

```tsx
import { useEffect } from 'react';
import { useAuthStore, useTaskStore } from './stores';

function TaskListSidebar() {
  const authenticated = useAuthStore((state) => state.authenticated);
  const { taskLists, loading, fetchTaskLists } = useTaskStore();

  useEffect(() => {
    if (authenticated) {
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  if (loading) return <div>Loading...</div>;

  return (
    <ul>
      {taskLists.map((list) => (
        <li key={list.id}>{list.title}</li>
      ))}
    </ul>
  );
}
```

### Fetching and Displaying Tasks

```tsx
import { useEffect } from 'react';
import { useTaskStore } from './stores';

function TaskList({ listId }: { listId: string }) {
  const { fetchTasks, getTasksByList, loadingLists } = useTaskStore();
  const tasks = getTasksByList(listId);
  const isLoading = loadingLists.has(listId);

  useEffect(() => {
    fetchTasks(listId);
  }, [listId, fetchTasks]);

  if (isLoading) return <div>Loading tasks...</div>;

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task.id}>
          <input
            type="checkbox"
            checked={task.status === 'completed'}
            onChange={() => toggleTaskStatus(listId, task.id)}
          />
          {task.title}
        </li>
      ))}
    </ul>
  );
}
```

### Creating a Task

```tsx
import { useState } from 'react';
import { useTaskStore, useUIStore } from './stores';

function CreateTaskForm({ listId }: { listId: string }) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const createTask = useTaskStore((state) => state.createTask);
  const { closeCreateTask, addNotification } = useUIStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const task = await createTask(listId, { title, notes });

    if (task) {
      addNotification('success', 'Task created successfully');
      closeCreateTask();
      setTitle('');
      setNotes('');
    } else {
      addNotification('error', 'Failed to create task');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Task title"
        required
      />
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional)"
      />
      <button type="submit">Create Task</button>
    </form>
  );
}
```

### Updating a Task

```tsx
import { useState } from 'react';
import { useTaskStore } from './stores';

function TaskEditor({ listId, taskId }: { listId: string; taskId: string }) {
  const { getTaskById, updateTask } = useTaskStore();
  const task = getTaskById(listId, taskId);
  const [title, setTitle] = useState(task?.title || '');

  if (!task) return null;

  const handleSave = async () => {
    await updateTask(listId, taskId, { title });
  };

  return (
    <div>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <button onClick={handleSave}>Save</button>
    </div>
  );
}
```

### Toggle Task Completion

```tsx
import { useTaskStore } from './stores';

function TaskCheckbox({ listId, taskId }: { listId: string; taskId: string }) {
  const { getTaskById, toggleTaskStatus } = useTaskStore();
  const task = getTaskById(listId, taskId);

  if (!task) return null;

  return (
    <input
      type="checkbox"
      checked={task.status === 'completed'}
      onChange={() => toggleTaskStatus(listId, taskId)}
    />
  );
}
```

---

## Board Store

### Displaying Boards

```tsx
import { useBoardStore } from './stores';

function BoardSelector() {
  const { boards, currentBoardId, setCurrentBoard } = useBoardStore();

  return (
    <select
      value={currentBoardId || ''}
      onChange={(e) => setCurrentBoard(e.target.value)}
    >
      {boards.map((board) => (
        <option key={board.id} value={board.id}>
          {board.name}
        </option>
      ))}
    </select>
  );
}
```

### Creating a Board

```tsx
import { useState } from 'react';
import { useBoardStore, useUIStore } from './stores';

function CreateBoardModal() {
  const [name, setName] = useState('');
  const createBoard = useBoardStore((state) => state.createBoard);
  const { closeCreateBoard, addNotification } = useUIStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const board = createBoard(name);
    addNotification('success', `Board "${board.name}" created`);
    closeCreateBoard();
    setName('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Board name"
        required
      />
      <button type="submit">Create Board</button>
    </form>
  );
}
```

### Board Layout

```tsx
import { useBoardStore } from './stores';

function BoardView({ boardId }: { boardId: string }) {
  const { getBoardById, getBoardLayout, updateBoardLayout } = useBoardStore();
  const board = getBoardById(boardId);
  const layout = getBoardLayout(boardId);

  if (!board || !layout) return null;

  const toggleViewMode = () => {
    const newMode = layout.viewMode === 'board' ? 'list' : 'board';
    updateBoardLayout(boardId, { viewMode: newMode });
  };

  return (
    <div>
      <h2>{board.name}</h2>
      <button onClick={toggleViewMode}>
        Switch to {layout.viewMode === 'board' ? 'List' : 'Board'} View
      </button>
      <div className={`view-${layout.viewMode}`}>
        {/* Render lists based on view mode */}
      </div>
    </div>
  );
}
```

---

## Filter Store

### Search Filter

```tsx
import { useFilterStore } from './stores';

function SearchBar() {
  const { activeFilters, setSearchQuery } = useFilterStore();

  return (
    <input
      type="text"
      value={activeFilters.search}
      onChange={(e) => setSearchQuery(e.target.value)}
      placeholder="Search tasks..."
    />
  );
}
```

### Status Filter

```tsx
import { useFilterStore } from './stores';

function StatusFilter() {
  const { activeFilters, setStatusFilter } = useFilterStore();

  return (
    <div>
      <label>
        <input
          type="radio"
          checked={activeFilters.status === undefined}
          onChange={() => setStatusFilter(undefined)}
        />
        All
      </label>
      <label>
        <input
          type="radio"
          checked={activeFilters.status === 'needsAction'}
          onChange={() => setStatusFilter('needsAction')}
        />
        Active
      </label>
      <label>
        <input
          type="radio"
          checked={activeFilters.status === 'completed'}
          onChange={() => setStatusFilter('completed')}
        />
        Completed
      </label>
    </div>
  );
}
```

### Sorting

```tsx
import { useFilterStore } from './stores';

function SortSelector() {
  const { sortOption, setSortOption } = useFilterStore();

  return (
    <select value={sortOption} onChange={(e) => setSortOption(e.target.value as any)}>
      <option value="manual">Manual</option>
      <option value="dueDate-asc">Due Date (Ascending)</option>
      <option value="dueDate-desc">Due Date (Descending)</option>
      <option value="title-asc">Title (A-Z)</option>
      <option value="title-desc">Title (Z-A)</option>
      <option value="status">Status</option>
    </select>
  );
}
```

### Applying Filters and Sorting

```tsx
import { useTaskStore, useFilterStore } from './stores';

function FilteredTaskList({ listId }: { listId: string }) {
  const { getTasksByList } = useTaskStore();
  const { getFilteredAndSortedTasks } = useFilterStore();

  const allTasks = getTasksByList(listId);
  const filteredTasks = getFilteredAndSortedTasks(allTasks);

  return (
    <ul>
      {filteredTasks.map((task) => (
        <li key={task.id}>{task.title}</li>
      ))}
    </ul>
  );
}
```

### Filter Presets

```tsx
import { useFilterStore } from './stores';

function FilterPresets() {
  const { filterPresets, activePresetId, applyPreset } = useFilterStore();

  return (
    <div>
      {filterPresets.map((preset) => (
        <button
          key={preset.id}
          onClick={() => applyPreset(preset.id)}
          className={activePresetId === preset.id ? 'active' : ''}
        >
          {preset.name}
        </button>
      ))}
    </div>
  );
}
```

---

## Label Store

### Creating Labels

```tsx
import { useState } from 'react';
import { useLabelStore } from './stores';
import { DEFAULT_LABEL_COLORS } from './types/label';

function CreateLabelForm() {
  const [name, setName] = useState('');
  const [color, setColor] = useState(DEFAULT_LABEL_COLORS[0]);
  const createLabel = useLabelStore((state) => state.createLabel);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createLabel(name, color);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Label name"
        required
      />
      <div>
        {DEFAULT_LABEL_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setColor(c)}
            style={{ backgroundColor: c }}
            className={color === c ? 'selected' : ''}
          />
        ))}
      </div>
      <button type="submit">Create Label</button>
    </form>
  );
}
```

### Displaying Labels

```tsx
import { useLabelStore } from './stores';

function LabelList() {
  const { getSortedLabels, deleteLabel } = useLabelStore();
  const labels = getSortedLabels();

  return (
    <ul>
      {labels.map((label) => (
        <li key={label.id}>
          <span style={{ backgroundColor: label.color }}>{label.name}</span>
          <button onClick={() => deleteLabel(label.id)}>Delete</button>
        </li>
      ))}
    </ul>
  );
}
```

### Adding Labels to Tasks

```tsx
import { useLabelStore } from './stores';

function TaskLabels({ taskId }: { taskId: string }) {
  const { getTaskLabels, getLabelById, addLabelToTask, removeLabelFromTask } = useLabelStore();
  const labelIds = getTaskLabels(taskId);
  const labels = labelIds.map((id) => getLabelById(id)).filter(Boolean);

  return (
    <div>
      {labels.map((label) => (
        label && (
          <span
            key={label.id}
            style={{ backgroundColor: label.color }}
            onClick={() => removeLabelFromTask(taskId, label.id)}
          >
            {label.name} ×
          </span>
        )
      ))}
    </div>
  );
}
```

---

## UI Store

### Modal Management

```tsx
import { useUIStore } from './stores';

function TaskDetailModal() {
  const { modals, selectedTaskId, selectedListId, closeTaskDetail } = useUIStore();

  if (!modals.taskDetail || !selectedTaskId || !selectedListId) return null;

  return (
    <div className="modal">
      <div className="modal-content">
        <button onClick={closeTaskDetail}>Close</button>
        {/* Task detail content */}
      </div>
    </div>
  );
}
```

### Sidebar Toggle

```tsx
import { useUIStore } from './stores';

function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <aside className={sidebarCollapsed ? 'collapsed' : ''}>
      <button onClick={toggleSidebar}>
        {sidebarCollapsed ? 'Expand' : 'Collapse'}
      </button>
      {/* Sidebar content */}
    </aside>
  );
}
```

### Notifications

```tsx
import { useUIStore } from './stores';

function NotificationList() {
  const { notifications, removeNotification } = useUIStore();

  return (
    <div className="notifications">
      {notifications.map((notification) => (
        <div key={notification.id} className={`notification ${notification.type}`}>
          <p>{notification.message}</p>
          <button onClick={() => removeNotification(notification.id)}>×</button>
        </div>
      ))}
    </div>
  );
}
```

### Theme Switcher

```tsx
import { useUIStore } from './stores';

function ThemeSwitcher() {
  const { theme, setTheme } = useUIStore();

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value as any)}>
      <option value="light">Light</option>
      <option value="dark">Dark</option>
      <option value="system">System</option>
    </select>
  );
}
```

---

## Combined Examples

### Complete Task Card Component

```tsx
import { useTaskStore, useLabelStore, useUIStore } from './stores';

function TaskCard({ listId, taskId }: { listId: string; taskId: string }) {
  const { getTaskById, toggleTaskStatus, deleteTask } = useTaskStore();
  const { getTaskLabels, getLabelById } = useLabelStore();
  const { openTaskDetail, addNotification } = useUIStore();

  const task = getTaskById(listId, taskId);
  const labelIds = getTaskLabels(taskId);
  const labels = labelIds.map((id) => getLabelById(id)).filter(Boolean);

  if (!task) return null;

  const handleDelete = async () => {
    await deleteTask(listId, taskId);
    addNotification('success', 'Task deleted');
  };

  return (
    <div className="task-card">
      <input
        type="checkbox"
        checked={task.status === 'completed'}
        onChange={() => toggleTaskStatus(listId, taskId)}
      />
      <div onClick={() => openTaskDetail(taskId, listId)}>
        <h3>{task.title}</h3>
        {task.notes && <p>{task.notes}</p>}
        {task.due && <span>Due: {new Date(task.due).toLocaleDateString()}</span>}
        <div className="labels">
          {labels.map((label) => (
            label && (
              <span key={label.id} style={{ backgroundColor: label.color }}>
                {label.name}
              </span>
            )
          ))}
        </div>
      </div>
      <button onClick={handleDelete}>Delete</button>
    </div>
  );
}
```

### Complete Board View with Filters

```tsx
import { useEffect } from 'react';
import { useTaskStore, useBoardStore, useFilterStore, useAuthStore } from './stores';

function BoardView() {
  const authenticated = useAuthStore((state) => state.authenticated);
  const { taskLists, fetchTaskLists, fetchTasks, getTasksByList } = useTaskStore();
  const { getCurrentBoard } = useBoardStore();
  const { getFilteredAndSortedTasks, hasActiveFilters } = useFilterStore();

  const currentBoard = getCurrentBoard();

  useEffect(() => {
    if (authenticated) {
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  useEffect(() => {
    if (currentBoard && taskLists.length > 0) {
      currentBoard.lists.forEach((listId) => {
        fetchTasks(listId);
      });
    }
  }, [currentBoard, taskLists, fetchTasks]);

  if (!currentBoard) return <div>No board selected</div>;

  return (
    <div className="board-view">
      <h1>{currentBoard.name}</h1>
      {hasActiveFilters() && <p>Filters active</p>}
      <div className="lists">
        {currentBoard.lists.map((listId) => {
          const list = taskLists.find((l) => l.id === listId);
          const allTasks = getTasksByList(listId);
          const tasks = getFilteredAndSortedTasks(allTasks);

          return (
            <div key={listId} className="list">
              <h2>{list?.title}</h2>
              <ul>
                {tasks.map((task) => (
                  <li key={task.id}>{task.title}</li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Best Practices

### 1. Selective Subscriptions

Use selector functions to subscribe only to the state you need:

```tsx
// ✅ Good - only re-renders when authenticated changes
const authenticated = useAuthStore((state) => state.authenticated);

// ❌ Bad - re-renders on any auth store change
const { authenticated } = useAuthStore();
```

### 2. Avoid Inline Functions in Selectors

```tsx
// ✅ Good
const getTasksByList = useTaskStore((state) => state.getTasksByList);
const tasks = getTasksByList(listId);

// ❌ Bad - creates new selector on every render
const tasks = useTaskStore((state) => state.getTasksByList(listId));
```

### 3. Handle Loading States

```tsx
function TaskList({ listId }: { listId: string }) {
  const { getTasksByList, loadingLists } = useTaskStore();
  const tasks = getTasksByList(listId);
  const isLoading = loadingLists.has(listId);

  if (isLoading) return <LoadingSpinner />;
  if (tasks.length === 0) return <EmptyState />;

  return <TasksView tasks={tasks} />;
}
```

### 4. Error Handling

```tsx
function TaskListWithErrors({ listId }: { listId: string }) {
  const { error, clearError } = useTaskStore();
  const { addNotification } = useUIStore();

  useEffect(() => {
    if (error) {
      addNotification('error', error);
      clearError();
    }
  }, [error, addNotification, clearError]);

  // Component content...
}
```

### 5. Cleanup

```tsx
function Component() {
  const { closeAllModals } = useUIStore();

  useEffect(() => {
    return () => {
      closeAllModals(); // Cleanup on unmount
    };
  }, [closeAllModals]);

  // Component content...
}
```

---

## Testing the Stores

### Quick Test in Development

Add this to any component to test the stores:

```tsx
import { useEffect } from 'react';
import { useAuthStore, useTaskStore, useLabelStore } from './stores';

function StoreDebugger() {
  const auth = useAuthStore();
  const tasks = useTaskStore();
  const labels = useLabelStore();

  useEffect(() => {
    console.log('Auth State:', auth);
    console.log('Task State:', tasks);
    console.log('Label State:', labels);
  }, [auth, tasks, labels]);

  return <div>Check console for store state</div>;
}
```

### Manual Testing Steps

1. **Authentication**
   - Click login button
   - Verify OAuth flow
   - Check user info displays

2. **Tasks**
   - Fetch task lists
   - Create a new task
   - Update task title
   - Toggle task completion
   - Delete task

3. **Labels**
   - Create labels with different colors
   - Add labels to tasks
   - Filter tasks by label

4. **Filters**
   - Search for tasks
   - Apply status filter
   - Try different sort options
   - Use filter presets

5. **Boards**
   - Create new board
   - Switch between boards
   - Toggle view modes

6. **UI**
   - Toggle sidebar
   - Open/close modals
   - Test notifications
   - Change theme

---

## Troubleshooting

### Store not updating
- Check if you're using immer correctly (mutate draft state)
- Verify selector functions are properly used
- Check console for error messages

### Optimistic updates reverting
- API call may be failing - check network tab
- Verify rollback logic in catch blocks

### localStorage not persisting
- Check browser console for quota errors
- Verify persist middleware configuration
- Clear localStorage and retry: `localStorage.clear()`

### Labels not showing on tasks
- Verify label IDs match in both stores
- Check if task has labels array initialized
- Use `getTaskLabels(taskId)` to debug

---

## Next Steps

1. Integrate stores into your existing components
2. Add error boundaries for better error handling
3. Consider adding middleware for logging/debugging
4. Implement optimistic updates for better UX
5. Add unit tests for store actions
