/**
 * Logger Utility
 * Conditional logging - only logs in development mode
 * In production, logs are disabled for better performance
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
}

class LoggerImpl implements Logger {
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = __DEV__;
  }

  /**
   * Log message (only in development)
   */
  log(...args: any[]): void {
    if (this.isDevelopment) {
      console.log(...args);
    }
  }

  /**
   * Info message (only in development)
   */
  info(...args: any[]): void {
    if (this.isDevelopment) {
      console.info(...args);
    }
  }

  /**
   * Warning message (always logged, but formatted)
   */
  warn(...args: any[]): void {
    if (this.isDevelopment) {
      console.warn(...args);
    }
    // In production, може да изпращаш към crash reporting service
    // Example: Sentry.captureMessage(args.join(' '), 'warning');
  }

  /**
   * Error message (always logged)
   */
  error(...args: any[]): void {
    // Errors винаги се логват, дори в production
    console.error(...args);
    // В production може да изпращаш към crash reporting service
    // Example: Sentry.captureException(new Error(args.join(' ')));
  }

  /**
   * Debug message (only in development)
   */
  debug(...args: any[]): void {
    if (this.isDevelopment) {
      console.debug(...args);
    }
  }
}

// Export singleton instance
export const logger = new LoggerImpl();

// Export type for use in other files
export type { Logger };
