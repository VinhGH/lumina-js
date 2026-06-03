// packages/core/src/utils.ts
// Shared utility functions for the core package

/**
 * Generates a unique ID. Uses crypto.randomUUID() when available (browser + Node 15+),
 * falls back to a timestamp-based ID for older environments.
 */
export function randomUUID(): string {
  if (typeof globalThis.crypto !== 'undefined' && typeof globalThis.crypto.randomUUID === 'function') {
    return globalThis.crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `lumina-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Formats milliseconds as a human-readable duration.
 */
export function formatMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}
