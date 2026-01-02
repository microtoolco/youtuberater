// Structured logger with request ID tracking

import { randomUUID } from 'crypto';

export interface LogContext {
  requestId: string;
  videoId?: string;
  operation?: string;
  [key: string]: unknown;
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private context: LogContext;

  constructor(context?: Partial<LogContext>) {
    this.context = {
      requestId: context?.requestId || randomUUID().slice(0, 8),
      ...context,
    };
  }

  private log(level: LogLevel, message: string, data?: Record<string, unknown>) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      requestId: this.context.requestId,
      videoId: this.context.videoId,
      operation: this.context.operation,
      message,
      ...data,
    };

    // Remove undefined values
    Object.keys(logData).forEach(key => {
      if (logData[key as keyof typeof logData] === undefined) {
        delete logData[key as keyof typeof logData];
      }
    });

    // Never log sensitive data
    const safeData = this.sanitize(logData);

    const output = JSON.stringify(safeData);

    switch (level) {
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
        if (process.env.NODE_ENV === 'development') {
          console.log(output);
        }
        break;
      default:
        console.log(output);
    }
  }

  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveKeys = ['apiKey', 'key', 'token', 'secret', 'password', 'authorization'];
    const result: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some(sk => key.toLowerCase().includes(sk))) {
        result[key] = '[REDACTED]';
      } else if (typeof value === 'string' && value.length > 500) {
        result[key] = value.slice(0, 500) + '...[truncated]';
      } else if (typeof value === 'object' && value !== null) {
        result[key] = this.sanitize(value as Record<string, unknown>);
      } else {
        result[key] = value;
      }
    }

    return result;
  }

  withContext(ctx: Partial<LogContext>): Logger {
    return new Logger({ ...this.context, ...ctx });
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, unknown>) {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, unknown>) {
    this.log('error', message, data);
  }

  getRequestId(): string {
    return this.context.requestId;
  }
}

export function createLogger(context?: Partial<LogContext>): Logger {
  return new Logger(context);
}

export type { Logger };
