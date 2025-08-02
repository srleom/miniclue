// Logger utility that can be disabled in production
const isDevelopment = process.env.NODE_ENV === "development";

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (!isDevelopment) {
      // In production, only log errors and warnings
      return level === "error" || level === "warn";
    }
    return true;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog("info")) {
      console.log(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, ...args: unknown[]): void {
    if (this.shouldLog("error")) {
      console.error(`[ERROR] ${message}`, ...args);
    }
  }

  // Special method for real-time subscription logging
  subscription(component: string, message: string, ...args: unknown[]): void {
    if (this.shouldLog("debug")) {
      console.log(`[SUBSCRIPTION:${component}] ${message}`, ...args);
    }
  }
}

export const logger = new Logger();
