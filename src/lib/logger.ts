/**
 * Structured logging for production observability
 * 
 * Requirements:
 * - JSON format for machine parsing
 * - Include requestId for correlation
 * - Include userId + role (metadata only, no sensitive data)
 * - Exclude credentials, PHI, tokens
 * 
 * Usage:
 * ```typescript
 * logger.info('User signed in', { userId: '123', role: 'provider' });
 * logger.error('Database query failed', { error: err.message, query: 'getPatient' });
 * ```
 */

export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  role?: string;
  ip?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  duration?: number;
  [key: string]: unknown;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  error?: {
    message: string;
    name?: string;
    stack?: string;
  };
}

class Logger {
  private static instance: Logger;
  private minLevel: LogLevel;

  private constructor() {
    // Set minimum log level based on environment
    // Production: INFO, Development: DEBUG
    this.minLevel = process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG;
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.minLevel);
  }

  private sanitizeContext(context?: LogContext): LogContext | undefined {
    if (!context) return undefined;

    const sanitized: LogContext = {};

    // Allowed fields (safe metadata only)
    const allowedFields = [
      'requestId',
      'userId',
      'role',
      'ip',
      'endpoint',
      'method',
      'statusCode',
      'duration',
      'operation',
      'entityType',
      'entityId',
      'patientId',
      'confidence',
      'refused',
      'category',
    ];

    for (const key of allowedFields) {
      if (context[key] !== undefined) {
        sanitized[key] = context[key];
      }
    }

    return sanitized;
  }

  private log(level: LogLevel, message: string, context?: LogContext, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: this.sanitizeContext(context),
    };

    // Add error details if provided (safe for production)
    if (error) {
      entry.error = {
        message: error.message,
        name: error.name,
        // Include stack trace only in development
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
      };
    }

    // Output as JSON for structured logging
    console.log(JSON.stringify(entry));
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  warn(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.WARN, message, context, error);
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  // Helper for API route logging
  apiRequest(context: LogContext): void {
    this.info('API request', context);
  }

  apiResponse(context: LogContext): void {
    this.info('API response', context);
  }

  apiError(message: string, context: LogContext, error?: Error): void {
    this.error(message, context, error);
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

/**
 * Generate a unique request ID for correlation
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
