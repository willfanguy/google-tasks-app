# Google Tasks Electron App - Setup Instructions

Complete setup and testing instructions for the Google OAuth authentication system.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Google OAuth Credentials

Follow the detailed instructions in [OAUTH_SETUP.md](./OAUTH_SETUP.md) to:
- Create a Google Cloud project
- Enable Google Tasks API
- Create OAuth 2.0 credentials
- Configure your `.env` file

### 3. Create Environment File

```bash
cp .env.example .env
```

Edit `.env` with your Google OAuth credentials:

```env
VITE_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=your_client_secret
VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
VITE_GOOGLE_SCOPES=https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly
```

### 4. Run the Application

```bash
npm run dev
```

This will:
1. Start the Vite dev server (React frontend)
2. Compile TypeScript for Electron
3. Launch the Electron app with DevTools open

## Testing OAuth Flow

### Option 1: Console Testing (Recommended for Initial Testing)

1. Open the app with `npm run dev`
2. The DevTools console will open automatically
3. Copy and paste the contents of `test-auth.js` into the console
4. Run `runAllTests()` to test the complete OAuth flow

### Option 2: Manual Console Commands

```javascript
// Start OAuth flow
await window.electronAPI.googleAuth()

// Check authentication status
await window.electronAPI.checkAuth()

// Get detailed status
await window.electronAPI.getAuthStatus()

// Logout
await window.electronAPI.logout()
```

### Option 3: Test from React UI

You can integrate authentication into your React components:

```tsx
// Example: Login button
const handleLogin = async () => {
  const result = await window.electronAPI.googleAuth();
  if (result.success) {
    console.log('Logged in successfully!');
  }
};

// Example: Check if authenticated
const checkAuth = async () => {
  const status = await window.electronAPI.checkAuth();
  console.log('Authenticated:', status.authenticated);
};
```

## Project Structure

```
google-tasks-app/
├── electron/
│   ├── main.ts                 # Main Electron process
│   ├── preload.ts             # Preload script with IPC API
│   ├── ipc/
│   │   ├── auth.ts            # Auth IPC handlers
│   │   ├── tasks.ts           # Tasks API IPC handlers
│   │   └── storage.ts         # Storage IPC handlers
│   └── utils/
│       ├── auth.ts            # OAuth implementation
│       ├── storage.ts         # Secure token storage
│       └── window.ts          # Window management
├── src/                       # React frontend
├── .env                       # Environment variables (create this)
├── .env.example              # Environment template
├── OAUTH_SETUP.md            # Detailed OAuth setup guide
└── test-auth.js              # Testing script
```

## Features Implemented

### Authentication System

- **OAuth 2.0 Flow**: Opens default browser for authentication
- **Secure Token Storage**: Uses electron-store with encryption
- **Automatic Token Refresh**: Refreshes expired access tokens
- **Cross-Platform**: Works on macOS, Windows, and Linux

### IPC Handlers

All handlers are accessible via `window.electronAPI` in the renderer process:

#### Auth Handlers
- `googleAuth()` - Start OAuth flow
- `checkAuth()` - Check authentication status
- `logout()` - Clear credentials and logout
- `getAuthStatus()` - Get detailed auth status with expiry

#### Task Handlers (Now integrated with OAuth)
- `getTaskLists()` - Get all task lists
- `getTasks(taskListId)` - Get tasks from a list
- `createTask(taskListId, task)` - Create a new task
- `updateTask(taskListId, taskId, task)` - Update a task
- `deleteTask(taskListId, taskId)` - Delete a task
- `moveTask(taskListId, taskId, data)` - Move a task

#### Storage Handlers
- `getStore(key)` - Get stored value
- `setStore(key, value)` - Set stored value
- `deleteStore(key)` - Delete stored value

## Security Features

1. **Client Secret Protection**: OAuth client secret never exposed to renderer process
2. **Encrypted Token Storage**: Tokens stored encrypted on disk
3. **Automatic Token Refresh**: No manual token management needed
4. **Context Isolation**: Renderer process isolated from Node.js
5. **Secure IPC**: All communication via secure contextBridge

## Development Workflow

### Starting Development

```bash
npm run dev
```

### Building for Production

```bash
# Build all
npm run build

# Platform-specific builds
npm run package:mac
npm run package:win
npm run package:linux
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Token Storage Location

Tokens are stored securely in the following locations:

- **macOS**: `~/Library/Application Support/google-tasks-app/`
- **Windows**: `%APPDATA%/google-tasks-app/`
- **Linux**: `~/.config/google-tasks-app/`

The file is named `google-tasks-secure-store.json` and is encrypted by electron-store.

## Troubleshooting

### Port 3000 Already in Use

If port 3000 is already in use:

1. Change the port in `.env`:
   ```env
   VITE_GOOGLE_REDIRECT_URI=http://localhost:3001/oauth2callback
   ```

2. Update the redirect URI in Google Cloud Console to match

### OAuth Credentials Not Found

Make sure:
1. `.env` file exists in the project root
2. Environment variables are correctly set
3. You've restarted the app after creating/modifying `.env`

### Browser Doesn't Open

Check:
1. Console logs for errors
2. Firewall settings
3. Default browser settings

### "App Not Verified" Warning

This is normal during development. Click "Advanced" > "Go to [App Name] (unsafe)" to proceed.

For production, submit your app for Google verification.

## Next Steps

1. **Build UI Components**: Create React components for login/logout
2. **Error Handling**: Add user-friendly error messages
3. **Task Management**: Implement full task CRUD operations
4. **Sync**: Add background sync functionality
5. **Offline Support**: Implement offline task management
6. **Settings**: Add user preferences and configuration

## API Usage Examples

### Get Task Lists

```javascript
const taskLists = await window.electronAPI.getTaskLists();
console.log('Task lists:', taskLists);
```

### Get Tasks

```javascript
const tasks = await window.electronAPI.getTasks('taskListId');
console.log('Tasks:', tasks);
```

### Create Task

```javascript
const newTask = await window.electronAPI.createTask('taskListId', {
  title: 'New Task',
  notes: 'Task description',
  due: '2024-12-31T23:59:59Z'
});
console.log('Created task:', newTask);
```

## Additional Resources

- [OAUTH_SETUP.md](./OAUTH_SETUP.md) - Detailed OAuth setup
- [test-auth.js](./test-auth.js) - Testing utilities
- [Google Tasks API Docs](https://developers.google.com/tasks)
- [Electron Documentation](https://www.electronjs.org/docs)

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review console logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure Google Cloud project is configured properly

## License

MIT
