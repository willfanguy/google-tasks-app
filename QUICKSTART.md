# Quick Start Checklist

Follow these steps to get the Google Tasks app running with OAuth authentication.

## Prerequisites Checklist

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Google account

## Setup Steps

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Google Cloud Project

**Detailed instructions in [OAUTH_SETUP.md](./OAUTH_SETUP.md)**

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Create new project (or select existing)
- [ ] Enable Google Tasks API
- [ ] Create OAuth 2.0 Desktop App credentials
- [ ] Note your Client ID and Client Secret

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` file:
- [ ] Add `VITE_GOOGLE_CLIENT_ID`
- [ ] Add `VITE_GOOGLE_CLIENT_SECRET`
- [ ] Verify `VITE_GOOGLE_REDIRECT_URI=http://localhost:3000/oauth2callback`
- [ ] Verify scopes are set

### 4. Run the App

```bash
npm run dev
```

Expected behavior:
- [ ] Vite dev server starts
- [ ] Electron app window opens
- [ ] DevTools opens automatically

### 5. Test Authentication

**In DevTools Console:**

```javascript
// Option 1: Copy test-auth.js contents and run
runAllTests()

// Option 2: Test manually
await window.electronAPI.googleAuth()
```

Expected flow:
- [ ] Browser opens with Google OAuth consent screen
- [ ] Click "Allow" to grant permissions
- [ ] Browser shows "Authentication Successful!" message
- [ ] Browser tab auto-closes
- [ ] Check Electron console for success logs

### 6. Verify Authentication

```javascript
// Check if authenticated
await window.electronAPI.checkAuth()
// Should return: { authenticated: true }

// Get detailed status
await window.electronAPI.getAuthStatus()
// Should return: { authenticated: true, expiresAt: <timestamp> }
```

### 7. Test Task API (Optional)

```javascript
// Get task lists
const lists = await window.electronAPI.getTaskLists()
console.log('Task lists:', lists)

// Get tasks from first list
if (lists.length > 0) {
  const tasks = await window.electronAPI.getTasks(lists[0].id)
  console.log('Tasks:', tasks)
}
```

## Troubleshooting

### Issue: "Google OAuth credentials not configured"
**Solution**: Check that your `.env` file exists and has valid credentials

### Issue: Browser doesn't open
**Solution**:
1. Check console logs for errors
2. Verify firewall isn't blocking port 3000
3. Try running `npm run dev` again

### Issue: Port 3000 already in use
**Solution**:
1. Change `VITE_GOOGLE_REDIRECT_URI` in `.env` to use different port (e.g., 3001)
2. Update redirect URI in Google Cloud Console to match

### Issue: "This app isn't verified" warning
**Solution**:
1. Click "Advanced"
2. Click "Go to [App Name] (unsafe)"
3. This is normal during development

### Issue: No refresh token received
**Solution**:
1. Go to [Google Account Permissions](https://myaccount.google.com/permissions)
2. Revoke access to your app
3. Try authenticating again - consent screen should appear

### Issue: Tokens not persisting
**Solution**: Check storage location:
- macOS: `~/Library/Application Support/google-tasks-app/`
- Windows: `%APPDATA%/google-tasks-app/`
- Linux: `~/.config/google-tasks-app/`

## Success Criteria

You've successfully set up the app when:
- ✅ App launches without errors
- ✅ Browser opens for OAuth
- ✅ Authentication completes successfully
- ✅ `checkAuth()` returns `{ authenticated: true }`
- ✅ `getTaskLists()` returns your Google task lists
- ✅ Authentication persists after restarting app

## Next Steps

Now that OAuth is working:

1. **Build UI Components**
   - Create login/logout buttons
   - Add authentication state to UI
   - Show user info when authenticated

2. **Implement Task Management**
   - Build task list display
   - Create task creation form
   - Add task editing functionality

3. **Add Error Handling**
   - User-friendly error messages
   - Retry mechanisms
   - Loading states

4. **Enhance Features**
   - Background sync
   - Offline support
   - Settings panel

## Documentation

- **[OAUTH_SETUP.md](./OAUTH_SETUP.md)** - Detailed OAuth setup and testing
- **[SETUP_INSTRUCTIONS.md](./SETUP_INSTRUCTIONS.md)** - Complete API reference
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Architecture details
- **[test-auth.js](./test-auth.js)** - Testing utilities

## Support

If you encounter issues:
1. Check the console logs for detailed error messages
2. Review the troubleshooting section above
3. Consult [OAUTH_SETUP.md](./OAUTH_SETUP.md) for detailed guidance
4. Verify all environment variables are set correctly

## Testing Commands

```javascript
// Authentication
await window.electronAPI.googleAuth()        // Start OAuth
await window.electronAPI.checkAuth()         // Check status
await window.electronAPI.getAuthStatus()     // Detailed status
await window.electronAPI.logout()            // Logout

// Task Management
await window.electronAPI.getTaskLists()      // Get lists
await window.electronAPI.getTasks(listId)    // Get tasks
await window.electronAPI.createTask(listId, task) // Create
await window.electronAPI.updateTask(listId, taskId, task) // Update
await window.electronAPI.deleteTask(listId, taskId) // Delete
```

---

**Ready?** Start with Step 1 and work through the checklist!
