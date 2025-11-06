# Zustand Stores - Quick Start

Get your stores running in 5 minutes!

## Step 1: Test the Stores (2 minutes)

### Option A: Simple Console Test
Open your browser console and run:

```javascript
// Check if stores are loaded
console.log('Auth Store:', useAuthStore.getState());
console.log('Task Store:', useTaskStore.getState());
console.log('UI Store:', useUIStore.getState());

// Test a notification
useUIStore.getState().addNotification('success', 'Stores are working!');
```

### Option B: Visual Test Component
Add this to your `src/App.tsx`:

```tsx
import { StoreTest } from './components/StoreTest';

function App() {
  return (
    <div>
      <h1>Store Test</h1>
      <StoreTest />
    </div>
  );
}

export default App;
```

Run `npm run dev` and you'll see a test panel with all stores!

---

## Step 2: Add Authentication (2 minutes)

Replace your `src/App.tsx` with:

```tsx
import { useEffect } from 'react';
import { useAuthStore, useTaskStore, useUIStore } from './stores';

function App() {
  const { authenticated, loading, login, logout, user } = useAuthStore();
  const { taskLists, fetchTaskLists } = useTaskStore();
  const { addNotification } = useUIStore();

  // Fetch task lists when authenticated
  useEffect(() => {
    if (authenticated) {
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  // Show loading state
  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Loading...</h1>
      </div>
    );
  }

  // Show login screen
  if (!authenticated) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Google Tasks App</h1>
        <p>Please login to continue</p>
        <button
          onClick={login}
          style={{
            padding: '10px 20px',
            fontSize: '16px',
            cursor: 'pointer',
          }}
        >
          Login with Google
        </button>
      </div>
    );
  }

  // Show main app
  return (
    <div style={{ padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1>Google Tasks</h1>
        <p>Welcome, {user.email}</p>
        <button onClick={logout}>Logout</button>
      </header>

      <main>
        <h2>Your Task Lists</h2>
        {taskLists.length === 0 ? (
          <p>No task lists found. Create one in Google Tasks!</p>
        ) : (
          <ul>
            {taskLists.map((list) => (
              <li key={list.id}>{list.title}</li>
            ))}
          </ul>
        )}
      </main>

      <button
        onClick={() => addNotification('success', 'Everything is working!')}
        style={{ marginTop: '20px' }}
      >
        Test Notification
      </button>
    </div>
  );
}

export default App;
```

---

## Step 3: Run Your App (1 minute)

```bash
npm run dev
```

Click "Login with Google" and you should see:
1. OAuth window opens
2. After auth, you're logged in
3. Task lists appear
4. Notification works

---

## Complete Working Example

Copy this entire file to `src/App.tsx` for a fully working app:

```tsx
// src/App.tsx
import { useEffect, useState } from 'react';
import { useAuthStore, useTaskStore, useUIStore } from './stores';

function App() {
  const { authenticated, loading, login, logout, user } = useAuthStore();
  const {
    taskLists,
    fetchTaskLists,
    fetchTasks,
    getTasksByList,
    toggleTaskStatus,
    createTask,
  } = useTaskStore();
  const { addNotification, notifications, removeNotification } = useUIStore();

  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  useEffect(() => {
    if (authenticated) {
      fetchTaskLists();
    }
  }, [authenticated, fetchTaskLists]);

  useEffect(() => {
    if (selectedListId) {
      fetchTasks(selectedListId);
    }
  }, [selectedListId, fetchTasks]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedListId || !newTaskTitle.trim()) return;

    const task = await createTask(selectedListId, { title: newTaskTitle });
    if (task) {
      addNotification('success', 'Task created!');
      setNewTaskTitle('');
    } else {
      addNotification('error', 'Failed to create task');
    }
  };

  if (loading) return <div style={{ padding: '20px' }}>Loading...</div>;

  if (!authenticated) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Google Tasks App</h1>
        <button onClick={login}>Login with Google</button>
      </div>
    );
  }

  const selectedTasks = selectedListId ? getTasksByList(selectedListId) : [];

  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px' }}>
      {/* Notifications */}
      <div
        style={{ position: 'fixed', top: '20px', right: '20px', zIndex: 1000 }}
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              padding: '10px 20px',
              marginBottom: '10px',
              borderRadius: '4px',
              backgroundColor:
                notif.type === 'success'
                  ? '#22c55e'
                  : notif.type === 'error'
                  ? '#ef4444'
                  : notif.type === 'warning'
                  ? '#f59e0b'
                  : '#3b82f6',
              color: 'white',
            }}
          >
            {notif.message}
            <button
              onClick={() => removeNotification(notif.id)}
              style={{
                marginLeft: '10px',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside
        style={{
          width: '250px',
          borderRight: '1px solid #ddd',
          paddingRight: '20px',
        }}
      >
        <h2>Task Lists</h2>
        <p style={{ fontSize: '14px' }}>{user.email}</p>
        <button onClick={logout} style={{ marginBottom: '20px' }}>
          Logout
        </button>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {taskLists.map((list) => (
            <li key={list.id}>
              <button
                onClick={() => setSelectedListId(list.id)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  padding: '8px',
                  border: 'none',
                  background:
                    selectedListId === list.id ? '#e5e7eb' : 'transparent',
                  cursor: 'pointer',
                }}
              >
                {list.title}
              </button>
            </li>
          ))}
        </ul>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        {!selectedListId ? (
          <p>Select a task list to view tasks</p>
        ) : (
          <>
            <h2>
              {taskLists.find((l) => l.id === selectedListId)?.title}
            </h2>

            {/* Create Task Form */}
            <form onSubmit={handleCreateTask} style={{ marginBottom: '20px' }}>
              <input
                type="text"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
                placeholder="New task..."
                style={{ padding: '8px', width: '300px', marginRight: '8px' }}
              />
              <button type="submit" style={{ padding: '8px 16px' }}>
                Add Task
              </button>
            </form>

            {/* Task List */}
            {selectedTasks.length === 0 ? (
              <p>No tasks. Create one above!</p>
            ) : (
              <ul style={{ listStyle: 'none', padding: 0 }}>
                {selectedTasks.map((task) => (
                  <li
                    key={task.id}
                    style={{ padding: '8px 0', borderBottom: '1px solid #eee' }}
                  >
                    <label
                      style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                      <input
                        type="checkbox"
                        checked={task.status === 'completed'}
                        onChange={() =>
                          toggleTaskStatus(selectedListId, task.id)
                        }
                      />
                      <span
                        style={{
                          textDecoration:
                            task.status === 'completed'
                              ? 'line-through'
                              : 'none',
                        }}
                      >
                        {task.title}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </main>
    </div>
  );
}

export default App;
```

---

## What You Just Built

✅ Authentication system
✅ Task list display
✅ Task creation
✅ Task completion toggle
✅ Notification system
✅ Error handling
✅ Optimistic updates

---

## Troubleshooting

### "useAuthStore is not defined"
Make sure you're importing from the correct path:
```tsx
import { useAuthStore } from './stores';
```

### "window.electronAPI is undefined"
1. Make sure Electron is running
2. Check that preload.ts is loaded
3. Verify you're running in the Electron app

### Auth not working
1. Check your OAuth credentials in `.env`
2. Verify Google Cloud Console settings
3. Check browser console for errors

### Tasks not loading
1. Make sure you're authenticated first
2. Check console for API errors
3. Verify you have task lists in Google Tasks

---

## Ready for More?

Check out these files:
- **STORE_SETUP_GUIDE.md** - Complete integration guide
- **STORE_USAGE_EXAMPLES.md** - Advanced examples
- **src/stores/README.md** - Quick reference
- **ZUSTAND_STORES_SUMMARY.md** - Overview of all stores

You're all set! 🚀
