import { google } from 'googleapis';
import { logger } from './logger';
import { OAuth2Client, Credentials } from 'google-auth-library';
import { shell } from 'electron';
import http from 'http';
import url from 'url';
import { getTokenStorage, saveTokenStorage, clearTokenStorage } from './storage';

// OAuth configuration from environment variables
const CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.VITE_GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = process.env.VITE_GOOGLE_REDIRECT_URI || 'http://localhost:3000/oauth2callback';
const SCOPES = process.env.VITE_GOOGLE_SCOPES?.split(' ') || [
  'https://www.googleapis.com/auth/tasks',
  'https://www.googleapis.com/auth/tasks.readonly',
];

let oauth2Client: OAuth2Client | null = null;

/**
 * Get or create the OAuth2 client
 */
export function getOAuth2Client(): OAuth2Client {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Google OAuth credentials not configured. Please check your .env file.');
  }

  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  }

  return oauth2Client;
}

/**
 * Generate the authorization URL for the OAuth flow
 */
export function generateAuthUrl(): string {
  const client = getOAuth2Client();

  return client.generateAuthUrl({
    access_type: 'offline', // Get refresh token
    scope: SCOPES,
    prompt: 'consent', // Force consent screen to ensure refresh token
  });
}

/**
 * Start the OAuth flow - opens browser and waits for callback
 */
export async function startOAuthFlow(): Promise<Credentials> {
  return new Promise((resolve, reject) => {
    const authUrl = generateAuthUrl();

    logger.log('[Auth] Starting OAuth flow...');
    logger.log('[Auth] Redirect URI:', REDIRECT_URI);

    // Create a local server to handle the OAuth callback
    const server = http.createServer(async (req, res) => {
      try {
        if (!req.url) {
          return;
        }

        const queryParams = url.parse(req.url, true).query;

        // Check if this is the OAuth callback
        if (req.url.startsWith('/oauth2callback')) {
          const code = queryParams.code as string;

          if (!code) {
            const error = queryParams.error as string || 'Unknown error';
            logger.error('[Auth] OAuth callback error:', error);

            // Send error response to browser
            res.writeHead(400, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>Error: ${error}</p>
                  <p>You can close this window.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);

            server.close();
            reject(new Error(`OAuth error: ${error}`));
            return;
          }

          logger.log('[Auth] Received authorization code, exchanging for tokens...');

          try {
            // Exchange authorization code for tokens
            const client = getOAuth2Client();
            const { tokens } = await client.getToken(code);

            logger.log('[Auth] Successfully obtained tokens');
            logger.log('[Auth] Has refresh token:', !!tokens.refresh_token);

            // Set credentials on the client
            client.setCredentials(tokens);

            // Save tokens to storage
            await saveTokenStorage(tokens);

            // Send success response to browser
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
                  <h1 style="color: #4CAF50;">Authentication Successful!</h1>
                  <p>You have successfully authenticated with Google.</p>
                  <p>You can close this window and return to the app.</p>
                  <script>setTimeout(() => window.close(), 2000);</script>
                </body>
              </html>
            `);

            server.close();
            resolve(tokens);
          } catch (error) {
            logger.error('[Auth] Error exchanging code for tokens:', error);

            res.writeHead(500, { 'Content-Type': 'text/html' });
            res.end(`
              <html>
                <body>
                  <h1>Authentication Failed</h1>
                  <p>Error exchanging authorization code for tokens.</p>
                  <p>You can close this window.</p>
                  <script>setTimeout(() => window.close(), 3000);</script>
                </body>
              </html>
            `);

            server.close();
            reject(error);
          }
        }
      } catch (error) {
        logger.error('[Auth] Server error:', error);
        server.close();
        reject(error);
      }
    });

    // Start the server on port 3000
    const port = new URL(REDIRECT_URI).port || '3000';
    server.listen(parseInt(port), () => {
      logger.log(`[Auth] OAuth callback server listening on port ${port}`);

      // Open the authorization URL in the default browser
      shell.openExternal(authUrl).catch((error) => {
        logger.error('[Auth] Error opening browser:', error);
        server.close();
        reject(error);
      });
    });

    // Handle server errors
    server.on('error', (error) => {
      logger.error('[Auth] Server error:', error);
      reject(error);
    });

    // Timeout after 5 minutes
    setTimeout(() => {
      server.close();
      reject(new Error('OAuth flow timeout - no response received'));
    }, 5 * 60 * 1000);
  });
}

/**
 * Load saved credentials and check if they're valid
 */
export async function loadSavedCredentials(): Promise<OAuth2Client | null> {
  try {
    const tokens = await getTokenStorage();

    if (!tokens) {
      logger.log('[Auth] No saved credentials found');
      return null;
    }

    logger.log('[Auth] Found saved credentials');
    logger.log('[Auth] Has refresh token:', !!tokens.refresh_token);

    const client = getOAuth2Client();
    client.setCredentials(tokens);

    // Check if token is expired and refresh if needed
    if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
      logger.log('[Auth] Access token expired, refreshing...');
      await refreshAccessToken(client);
    }

    return client;
  } catch (error) {
    logger.error('[Auth] Error loading saved credentials:', error);
    return null;
  }
}

/**
 * Refresh the access token using the refresh token
 */
export async function refreshAccessToken(client: OAuth2Client): Promise<void> {
  try {
    logger.log('[Auth] Refreshing access token...');

    const { credentials } = await client.refreshAccessToken();
    client.setCredentials(credentials);

    // Save the new tokens
    await saveTokenStorage(credentials);

    logger.log('[Auth] Access token refreshed successfully');
  } catch (error) {
    logger.error('[Auth] Error refreshing access token:', error);
    throw error;
  }
}

/**
 * Check if the user is authenticated
 */
export async function checkAuthentication(): Promise<boolean> {
  try {
    const client = await loadSavedCredentials();

    if (!client) {
      return false;
    }

    // Verify the token by making a test request
    try {
      const tokens = client.credentials;

      // Check if we have required tokens
      if (!tokens.access_token) {
        return false;
      }

      // If token is expired and we have a refresh token, try to refresh
      if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
        if (tokens.refresh_token) {
          await refreshAccessToken(client);
          return true;
        }
        return false;
      }

      return true;
    } catch (error) {
      logger.error('[Auth] Error verifying token:', error);
      return false;
    }
  } catch (error) {
    logger.error('[Auth] Error checking authentication:', error);
    return false;
  }
}

/**
 * Get the current authenticated client
 */
export async function getAuthenticatedClient(): Promise<OAuth2Client> {
  const client = await loadSavedCredentials();

  if (!client) {
    throw new Error('Not authenticated. Please authenticate first.');
  }

  // Check if token needs refresh
  const tokens = client.credentials;
  if (tokens.expiry_date && tokens.expiry_date < Date.now()) {
    if (tokens.refresh_token) {
      await refreshAccessToken(client);
    } else {
      throw new Error('Access token expired and no refresh token available. Please re-authenticate.');
    }
  }

  return client;
}

/**
 * Logout - clear stored credentials
 */
export async function logout(): Promise<void> {
  try {
    logger.log('[Auth] Logging out...');

    // Revoke token if possible
    try {
      const client = await loadSavedCredentials();
      if (client) {
        await client.revokeCredentials();
        logger.log('[Auth] Credentials revoked');
      }
    } catch (error) {
      logger.error('[Auth] Error revoking credentials:', error);
      // Continue with logout even if revocation fails
    }

    // Clear stored tokens
    await clearTokenStorage();

    // Reset the oauth client
    oauth2Client = null;

    logger.log('[Auth] Logout successful');
  } catch (error) {
    logger.error('[Auth] Error during logout:', error);
    throw error;
  }
}

/**
 * Get current auth status with user information
 */
export async function getAuthStatus(): Promise<{
  authenticated: boolean;
  email?: string;
  expiresAt?: number;
}> {
  try {
    const isAuthenticated = await checkAuthentication();

    if (!isAuthenticated) {
      return { authenticated: false };
    }

    const tokens = await getTokenStorage();

    return {
      authenticated: true,
      expiresAt: tokens?.expiry_date ?? undefined,
    };
  } catch (error) {
    logger.error('[Auth] Error getting auth status:', error);
    return { authenticated: false };
  }
}
