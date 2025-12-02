/**
 * ConsoleLogger - Default logger implementation
 *
 * Simple console-based logger with color support.
 * Used as fallback when no custom LoggerFactory is provided.
 */

import type { Logger, LogContext, LogLevel } from "@agentxjs/types";
import { LogLevel as LogLevelEnum } from "@agentxjs/types";

export interface ConsoleLoggerOptions {
  level?: LogLevel;
  colors?: boolean;
  timestamps?: boolean;
}

export class ConsoleLogger implements Logger {
  readonly name: string;
  readonly level: LogLevel;
  private readonly colors: boolean;
  private readonly timestamps: boolean;

  private static readonly COLORS = {
    DEBUG: "\x1b[36m",
    INFO: "\x1b[32m",
    WARN: "\x1b[33m",
    ERROR: "\x1b[31m",
    RESET: "\x1b[0m",
  };

  constructor(name: string, options: ConsoleLoggerOptions = {}) {
    this.name = name;
    this.level = options.level ?? LogLevelEnum.INFO;
    this.colors = options.colors ?? this.isNodeEnvironment();
    this.timestamps = options.timestamps ?? true;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDebugEnabled()) {
      this.log("DEBUG", message, context);
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isInfoEnabled()) {
      this.log("INFO", message, context);
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.isWarnEnabled()) {
      this.log("WARN", message, context);
    }
  }

  error(message: string | Error, context?: LogContext): void {
    if (this.isErrorEnabled()) {
      if (message instanceof Error) {
        this.log("ERROR", message.message, { ...context, stack: message.stack });
      } else {
        this.log("ERROR", message, context);
      }
    }
  }

  isDebugEnabled(): boolean {
    return this.level <= LogLevelEnum.DEBUG;
  }

  isInfoEnabled(): boolean {
    return this.level <= LogLevelEnum.INFO;
  }

  isWarnEnabled(): boolean {
    return this.level <= LogLevelEnum.WARN;
  }

  isErrorEnabled(): boolean {
    return this.level <= LogLevelEnum.ERROR;
  }

  private log(level: string, message: string, context?: LogContext): void {
    const parts: string[] = [];

    if (this.timestamps) {
      parts.push(new Date().toISOString());
    }

    if (this.colors) {
      const color = ConsoleLogger.COLORS[level as keyof typeof ConsoleLogger.COLORS];
      parts.push(`${color}${level.padEnd(5)}${ConsoleLogger.COLORS.RESET}`);
    } else {
      parts.push(level.padEnd(5));
    }

    parts.push(`[${this.name}]`);
    parts.push(message);

    const logLine = parts.join(" ");
    const consoleMethod = this.getConsoleMethod(level);

    if (context && Object.keys(context).length > 0) {
      consoleMethod(logLine, context);
    } else {
      consoleMethod(logLine);
    }
  }

  private getConsoleMethod(level: string): (...args: unknown[]) => void {
    switch (level) {
      case "DEBUG":
        return console.debug.bind(console);
      case "INFO":
        return console.info.bind(console);
      case "WARN":
        return console.warn.bind(console);
      case "ERROR":
        return console.error.bind(console);
      default:
        return console.log.bind(console);
    }
  }

  private isNodeEnvironment(): boolean {
    return typeof process !== "undefined" && process.versions?.node !== undefined;
  }
}
