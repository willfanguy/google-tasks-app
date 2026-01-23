/**
 * Conditional logger utility for Electron main process
 * Only logs to console in development mode
 */

const isDevelopment = process.env.NODE_ENV === 'development';

function safeWrite(fn: (...args: unknown[]) => void, args: unknown[]): void {
  try {
    fn(...args);
  } catch (err: unknown) {
    // Swallow EPIPE errors (pipe closed, e.g. when parent process exits)
    if (err && typeof err === 'object' && 'code' in err &&
        (err.code === 'EPIPE' || err.code === 'ERR_STREAM_DESTROYED')) {
      return;
    }
    throw err;
  }
}

export const logger = {
  log: (...args: unknown[]): void => {
    if (isDevelopment) {
      safeWrite(console.log, args);
    }
  },

  error: (...args: unknown[]): void => {
    if (isDevelopment) {
      safeWrite(console.error, args);
    }
  },

  warn: (...args: unknown[]): void => {
    if (isDevelopment) {
      safeWrite(console.warn, args);
    }
  },

  info: (...args: unknown[]): void => {
    if (isDevelopment) {
      safeWrite(console.info, args);
    }
  },

  debug: (...args: unknown[]): void => {
    if (isDevelopment) {
      safeWrite(console.debug, args);
    }
  },
};
