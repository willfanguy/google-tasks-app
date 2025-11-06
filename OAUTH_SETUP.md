# Google OAuth 2.0 Setup and Testing Guide

This guide will help you set up and test the Google OAuth authentication system for the Google Tasks Electron app.

## Prerequisites

1. Node.js and npm installed
2. A Google account
3. Google Cloud Console project with OAuth 2.0 credentials

## Step 1: Create Google OAuth 2.0 Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google Tasks API:
   - Go to "APIs & Services" > "Library"
   - Search for "Google Tasks API"
   - Click "Enable"

4. Create OAuth 2.0 credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Desktop app" as the application type
   - Name it (e.g., "Google Tasks Desktop App")
   - Click "Create"

5. Download or copy your credentials:
   - You'll get a Client ID (looks like: `xxxxx.apps.googleusercontent.com`)
   - And a Client Secret (looks like: `GOCSPX-xxxxx`)

## Step 2: Configure Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_client_id_here.apps.googleusercontent.com
   VITE_GOOGLE_CLIENT_SECRET=your_client_secret_here
   VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback
   VITE_GOOGLE_SCOPES=https://www.googleapis.com/auth/tasks https://www.googleapis.com/auth/tasks.readonly
   ```

3. **Important**: Make sure `.env` is in your `.gitignore` file (it should be by default)

## Step 3: Install Dependencies

```bash
npm install
```

## Step 4: Build and Run the Application

### Development Mode

```bash
npm run dev
```

This will:
- Start the Vite dev server for the React frontend
- Compile the Electron TypeScript code
- Launch the Electron app with DevTools open

## Step 5: Test the OAuth Flow

### Test 1: Initial Authentication

1. Launch the app using `npm run dev`
2. Open the browser console in DevTools (the app opens with DevTools by default)
3. In the DevTools console, run:
   ```javascript
   window.electronAPI.googleAuth()
   ```

4. **Expected behavior**:
   - Your default browser should open with Google's OAuth consent screen
   - You should see the app name and requested permissions (Google Tasks access)
   - After clicking "Allow", you'll be redirected to `http://localhost:3000/oauth2callback`
   - The browser should show "Authentication Successful!" message
   - The browser tab will auto-close after 2 seconds
   - Check the Electron console logs for success messages

5. **Console Output** (in Electron app):
   ```
   [Auth] Starting OAuth flow...
   [Auth] Redirect URI: http://localhost:3000/oauth2callback
   [Auth] OAuth callback server listening on port 3000
   [Auth] Received authorization code, exchanging for tokens...
   [Auth] Successfully obtained tokens
   [Auth] Has refresh token: true
   [Storage] Saving tokens to secure storage
   [Storage] Tokens saved successfully
   [IPC] google-auth: OAuth flow completed successfully
   ```

### Test 2: Check Authentication Status

In the DevTools console, run:
```javascript
window.electronAPI.checkAuth()
```

**Expected output**:
```javascript
{ authenticated: true }
```

### Test 3: Get Detailed Auth Status

In the DevTools console, run:
```javascript
window.electronAPI.getAuthStatus()
```

**Expected output**:
```javascript
{
  authenticated: true,
  expiresAt: 1234567890000  // Timestamp when token expires
}
```

### Test 4: Test Token Persistence

1. Close the Electron app completely
2. Re-launch the app with `npm run dev`
3. In DevTools console, run:
   ```javascript
   window.electronAPI.checkAuth()
   ```

**Expected output**:
```javascript
{ authenticated: true }
```

This confirms that tokens are persisted securely and loaded on app restart.

### Test 5: Test Logout

In the DevTools console, run:
```javascript
window.electronAPI.logout()
```

**Expected output**:
```javascript
{ success: true, message: "Logged out successfully" }
```

Then verify authentication is cleared:
```javascript
window.electronAPI.checkAuth()
```

**Expected output**:
```javascript
{ authenticated: false }
```

## Testing OAuth Flow from UI (Optional)

You can create a simple test UI in your React app. Add this to any component:

```tsx
import { useEffect, useState } from 'react';

function AuthTest() {
  const [authStatus, setAuthStatus] = useState<any>(null);

  const handleLogin = async () => {
    try {
      const result = await window.electronAPI.googleAuth();
      console.log('Login result:', result);
      checkStatus();
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      const result = await window.electronAPI.logout();
      console.log('Logout result:', result);
      checkStatus();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const checkStatus = async () => {
    try {
      const status = await window.electronAPI.getAuthStatus();
      console.log('Auth status:', status);
      setAuthStatus(status);
    } catch (error) {
      console.error('Status check error:', error);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h2>OAuth Test</h2>

      <div style={{ marginBottom: 20 }}>
        <strong>Status:</strong>{' '}
        {authStatus?.authenticated ? 'Authenticated' : 'Not authenticated'}
      </div>

      {authStatus?.expiresAt && (
        <div style={{ marginBottom: 20 }}>
          <strong>Token expires:</strong>{' '}
          {new Date(authStatus.expiresAt).toLocaleString()}
        </div>
      )}

      <div>
        <button onClick={handleLogin} style={{ marginRight: 10 }}>
          Login with Google
        </button>
        <button onClick={handleLogout} style={{ marginRight: 10 }}>
          Logout
        </button>
        <button onClick={checkStatus}>
          Check Status
        </button>
      </div>
    </div>
  );
}

export default AuthTest;
```

## Troubleshooting

### Issue: "Google OAuth credentials not configured" error

**Solution**: Make sure your `.env` file exists and contains the correct credentials. Restart the app after creating/modifying `.env`.

### Issue: Browser opens but shows "Cannot GET /oauth2callback"

**Solution**: This is expected if you navigate to the URL directly. The OAuth flow must be initiated from the app using `window.electronAPI.googleAuth()`.

### Issue: "port 3000 already in use"

**Solution**:
1. Stop any processes using port 3000
2. Or change the redirect URI in your `.env` and Google Cloud Console to use a different port (e.g., `http://localhost:3001/oauth2callback`)

### Issue: OAuth consent screen shows "This app isn't verified"

**Solution**: This is normal during development. Click "Advanced" > "Go to [Your App Name] (unsafe)" to proceed. For production, you'll need to verify your app with Google.

### Issue: "No refresh token received"

**Solution**:
1. Revoke access in your Google account: https://myaccount.google.com/permissions
2. Try authenticating again - the consent screen should appear
3. The first-time consent should provide a refresh token

### Issue: Tokens not persisting between sessions

**Solution**: Check the Electron console for storage errors. The tokens are stored in:
- macOS: `~/Library/Application Support/google-tasks-app/`
- Windows: `%APPDATA%/google-tasks-app/`
- Linux: `~/.config/google-tasks-app/`

## Security Notes

1. **Never commit your `.env` file** - It contains sensitive credentials
2. **Client Secret in Main Process**: The OAuth client secret is only accessible in the main process (Node.js), never exposed to the renderer process
3. **Encrypted Storage**: Tokens are stored encrypted using electron-store
4. **Token Refresh**: Access tokens are automatically refreshed when expired using the refresh token
5. **HTTPS in Production**: For production builds, consider using HTTPS for the redirect URI

## API Usage Example

Once authenticated, you can use the Google Tasks API. Here's an example of how to integrate it with your task handlers:

```typescript
// electron/ipc/tasks.ts
import { getAuthenticatedClient } from '../utils/auth';
import { google } from 'googleapis';

export const setupTaskHandlers = () => {
  ipcMain.handle('get-task-lists', async () => {
    try {
      const auth = await getAuthenticatedClient();
      const tasks = google.tasks({ version: 'v1', auth });

      const response = await tasks.tasklists.list();
      return response.data.items;
    } catch (error) {
      console.error('Error getting task lists:', error);
      throw error;
    }
  });
};
```

## Next Steps

1. Implement the task management IPC handlers in `electron/ipc/tasks.ts`
2. Create a proper authentication UI in your React app
3. Add error handling and user feedback for auth failures
4. Implement automatic token refresh before API calls
5. Add proper TypeScript types for Google Tasks API responses

## Additional Resources

- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Google Tasks API Reference](https://developers.google.com/tasks/reference/rest)
- [googleapis npm package](https://www.npmjs.com/package/googleapis)
- [electron-store documentation](https://github.com/sindresorhus/electron-store)
