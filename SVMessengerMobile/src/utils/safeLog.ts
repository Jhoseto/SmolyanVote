/**
 * Safe logging utilities
 * Ensures we never pass promises or objects with .catch() to console.error
 * This prevents "Cannot read property 'catch' of undefined" errors
 */

/**
 * Safely convert any value to a string for logging
 * NEVER returns promises or objects with .catch()
 */
export function safeErrorToString(error: any): string {
  if (error instanceof Error) {
    return error.message || error.toString() || 'Unknown error';
  } else if (error != null && typeof error !== 'object') {
    return String(error);
  } else if (error != null && typeof error === 'object') {
    // Check if it's a promise - NEVER log promises
    if (typeof error.then === 'function' || typeof error.catch === 'function') {
      return 'Promise or thenable object (not logging to avoid .catch() error)';
    } else {
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    }
  } else {
    return 'Unknown error';
  }
}

/**
 * Safely log error to console.error
 * NEVER passes promises or objects with .catch() to console.error
 */
export function safeConsoleError(message: string, error?: any): void {
  try {
    if (error !== undefined) {
      const errorMessage = safeErrorToString(error);
      console.error(message, errorMessage);
    } else {
      console.error(message);
    }
  } catch (logError) {
    // If even logging fails, use absolute minimal logging
    try {
      console.warn(message, '[Failed to log error]');
    } catch {
      // Do nothing - prevent infinite error loops
    }
  }
}

/**
 * Create a safe error handler for promise .catch() calls
 * Usage: promise.catch(safeErrorHandler('Context message'))
 */
export function safeErrorHandler(context: string) {
  return (error: any) => {
    safeConsoleError(`Error in ${context}:`, error);
  };
}

