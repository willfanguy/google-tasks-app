# Zustand Stores

This directory contains all Zustand state management stores for the Google Tasks desktop app.

## Quick Reference

### Store Files

- **authStore.ts** - Authentication state (login, logout, user info)
- **taskStore.ts** - Tasks and task lists (CRUD with optimistic updates)
- **boardStore.ts** - Board management (layouts, organization)
- **filterStore.ts** - Filtering and sorting (search, filters, presets)
- **labelStore.ts** - Label management (tags for tasks)
- **uiStore.ts** - UI state (modals, notifications, theme, preferences)
- **index.ts** - Barrel exports for easy importing

## Quick Import

```typescript
import {
  useAuthStore,
  useTaskStore,
  useBoardStore,
  useFilterStore,
  useLabelStore,
  useUIStore,
} from './stores';
```

## Quick Usage

### Authentication
```typescript
const { authenticated, login, logout } = useAuthStore();
```

### Tasks
```typescript
const { taskLists, fetchTaskLists, createTask, updateTask } = useTaskStore();
```

### Boards
```typescript
const { boards, currentBoardId, setCurrentBoard } = useBoardStore();
```

### Filters
```typescript
const { setSearchQuery, setSortOption, getFilteredAndSortedTasks } = useFilterStore();
```

### Labels
```typescript
const { labels, createLabel, addLabelToTask } = useLabelStore();
```

### UI
```typescript
const { openTaskDetail, addNotification, toggleSidebar } = useUIStore();
```

## Documentation

- **[STORE_SETUP_GUIDE.md](../../../STORE_SETUP_GUIDE.md)** - Complete setup and integration guide
- **[STORE_USAGE_EXAMPLES.md](../../../STORE_USAGE_EXAMPLES.md)** - Detailed usage examples for all stores

## Key Features

### Optimistic Updates
Task store implements optimistic updates for instant UI feedback with automatic rollback on errors.

### Persistence
These stores persist to localStorage:
- Board store (boards and layouts)
- Label store (labels and task-label mappings)
- Filter store (presets and sort preferences)
- UI store (theme, sidebar, compact mode)

### Error Handling
All stores include comprehensive error handling with user-friendly error messages.

### TypeScript
Fully typed with TypeScript for better IDE support and type safety.

## Store State Summary

### authStore
```typescript
{
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  user: UserInfo;
  expiresAt?: number;
}
```

### taskStore
```typescript
{
  taskLists: TaskList[];
  tasks: Map<string, Task[]>;
  loading: boolean;
  loadingLists: Set<string>;
  error: string | null;
  lastSync: Map<string, number>;
}
```

### boardStore
```typescript
{
  boards: Board[];
  currentBoardId: string | null;
  layouts: Map<string, BoardLayout>;
}
```

### filterStore
```typescript
{
  activeFilters: ActiveFilters;
  sortOption: SortOption;
  filterPresets: FilterPreset[];
  activePresetId: string | null;
}
```

### labelStore
```typescript
{
  labels: Label[];
  taskLabels: Map<string, string[]>;
}
```

### uiStore
```typescript
{
  modals: ModalState;
  selectedTaskId: string | null;
  selectedListId: string | null;
  sidebarCollapsed: boolean;
  theme: 'light' | 'dark' | 'system';
  compactMode: boolean;
  loading: LoadingState;
  notifications: Notification[];
}
```

## Testing

### Quick Test Component

Add this to any component to inspect store state:

```tsx
function StoreDebug() {
  const auth = useAuthStore();
  const tasks = useTaskStore();
  const ui = useUIStore();

  console.log('Auth:', auth);
  console.log('Tasks:', tasks);
  console.log('UI:', ui);

  return <div>Check console for store state</div>;
}
```

### Manual Actions

Test stores directly from console:

```javascript
// Test auth
useAuthStore.getState().checkAuth();

// Test tasks
useTaskStore.getState().fetchTaskLists();

// Test notifications
useUIStore.getState().addNotification('success', 'Test notification');

// Test labels
useLabelStore.getState().createLabel('Test Label', '#ef4444');
```

## Common Issues

### Store not updating UI
- Make sure you're using selectors: `useStore((state) => state.value)`
- Check if component is properly subscribed to store changes

### localStorage quota exceeded
- Clear localStorage: `localStorage.clear()`
- Reduce data being stored

### API calls failing
- Check authentication status
- Verify `window.electronAPI` is available
- Check network tab for errors

### Optimistic updates reverting
- API call is failing - check console and network tab
- Verify authentication is valid

## Performance Tips

1. **Use selective subscriptions**
   ```typescript
   // Good
   const authenticated = useAuthStore((state) => state.authenticated);

   // Bad
   const { authenticated } = useAuthStore();
   ```

2. **Avoid inline selectors**
   ```typescript
   // Good
   const getTasksByList = useTaskStore((state) => state.getTasksByList);
   const tasks = getTasksByList(listId);

   // Bad
   const tasks = useTaskStore((state) => state.getTasksByList(listId));
   ```

3. **Batch updates when possible**
   ```typescript
   useUIStore.setState((state) => {
     state.modals.taskDetail = false;
     state.selectedTaskId = null;
   });
   ```

## Architecture Notes

### Data Flow
1. User action triggers store action
2. Store updates state (optimistic if applicable)
3. API call made via `window.electronAPI`
4. On success: Update with server response
5. On failure: Rollback and show error

### Store Separation
- **Auth Store**: Isolated authentication logic
- **Task Store**: Core data management with API integration
- **Board Store**: UI organization layer on top of task data
- **Filter Store**: Pure computed/derived state
- **Label Store**: Local metadata layer
- **UI Store**: Ephemeral UI state

### Persistence Strategy
- **Session**: Auth state (not persisted)
- **Persistent**: Boards, labels, UI preferences
- **Hybrid**: Tasks (cached with expiration)

## Maintenance

### Adding New Actions

1. Add action to interface
2. Implement action in store
3. Add console.log for debugging
4. Update documentation
5. Add usage example

### Adding New State

1. Add to interface
2. Add to initial state
3. Add getter if needed
4. Implement actions to modify
5. Update persistence config if needed

### Debugging

1. Check console for store logs
2. Use React DevTools to inspect state
3. Test actions from browser console
4. Verify localStorage data
5. Check API responses in Network tab

## Further Reading

- [Zustand Documentation](https://github.com/pmndrs/zustand)
- [Immer Documentation](https://immerjs.github.io/immer/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
