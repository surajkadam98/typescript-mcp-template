/**
 * Stderr-only logger.
 * MCP uses stdout for the stdio transport — all logging MUST go to stderr.
 */

export const logger = {
  success: (msg: string, ...args: unknown[]): void =>
    console.error(`[SUCCESS]  ${msg}`, ...args),

  info: (msg: string, ...args: unknown[]): void =>
    console.error(`[INFO]  ${msg}`, ...args),

  warn: (msg: string, ...args: unknown[]): void =>
    console.error(`[WARN]  ${msg}`, ...args),

  error: (msg: string, ...args: unknown[]): void =>
    console.error(`[ERROR] ${msg}`, ...args),
};
