// packages/security/src/audit-logger.ts
// Append-only, in-memory audit log for all security decisions.
// Principle: BUSINESS ERRORS CAN BE CORRECTED. SECURITY ERRORS MUST BE DENIED.
//            Every decision — approved or denied — is recorded immutably.

import type { AuditEntry } from '@lumina/contracts';

// ─── ID generation ────────────────────────────────────────────────────────────

/**
 * Generates a collision-resistant audit entry ID.
 *
 * Format: `audit-<timestamp>-<random6hex>`
 *
 * We avoid depending on `crypto.randomUUID()` here so the logger stays
 * compatible with environments where it may be unavailable (e.g., older
 * Node.js or edge runtimes). The combination of millisecond timestamp +
 * 6 random hex bytes is sufficient for an in-memory log.
 */
function generateAuditId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.floor(Math.random() * 0xffffff)
    .toString(16)
    .padStart(6, '0');
  return `audit-${ts}-${rand}`;
}

// ─── AuditLogger ─────────────────────────────────────────────────────────────

/**
 * AuditLogger — append-only in-memory log of all security decisions.
 *
 * Every call to `log()` creates a new `AuditEntry` with an auto-generated
 * `id` and the current `timestamp`. Entries are stored in insertion order
 * and exposed as a readonly snapshot via `getEntries()`.
 *
 * @remarks
 * **Append-only**: entries cannot be mutated or removed except via `clear()`,
 * which is provided exclusively for testing purposes and is clearly marked as
 * such. In production code, `clear()` should never be called.
 *
 * **In-memory only**: this logger does not persist entries to disk or a
 * database. For persistence, wire the entries to an external sink (e.g.,
 * ship them to a backend after each decision).
 *
 * @example
 * ```ts
 * const entry = globalAuditLogger.log({
 *   actionId: action.actionId,
 *   sessionId: context.sessionId,
 *   userId: context.userId,
 *   decision,
 *   actionType: action.type,
 *   capability: action.capability,
 * });
 * console.log(entry.id, entry.timestamp);
 * ```
 */
export class AuditLogger {
  /**
   * Internal storage. All entries are appended; none are ever removed in
   * normal operation. We use a plain array backed by a readonly view so
   * external callers cannot mutate it.
   */
  private readonly entries: AuditEntry[] = [];

  /**
   * Creates and appends a new `AuditEntry` to the log.
   *
   * The `id` and `timestamp` fields are generated automatically.
   * The caller provides every other field.
   *
   * @param entry - All `AuditEntry` fields except `id` and `timestamp`.
   * @returns The completed `AuditEntry` as stored in the log.
   */
  log(
    entry: Omit<AuditEntry, 'id' | 'timestamp'>,
  ): AuditEntry {
    const fullEntry: AuditEntry = {
      id: generateAuditId(),
      timestamp: Date.now(),
      actionId: entry.actionId,
      sessionId: entry.sessionId,
      userId: entry.userId,
      decision: entry.decision,
      actionType: entry.actionType,
      capability: entry.capability,
    };

    this.entries.push(fullEntry);
    return fullEntry;
  }

  /**
   * Returns a shallow read-only snapshot of all audit entries in insertion order.
   *
   * The returned array is a defensive copy so mutations by the caller do not
   * affect the internal state of the logger.
   *
   * @returns A readonly array of all `AuditEntry` records logged so far.
   */
  getEntries(): readonly AuditEntry[] {
    return Object.freeze([...this.entries]);
  }

  /**
   * Returns all audit entries associated with a specific session.
   *
   * Useful for producing a per-session audit trail, e.g., before committing
   * a workflow or for debugging.
   *
   * @param sessionId - The session identifier to filter by.
   * @returns A readonly array of `AuditEntry` records for the given session.
   */
  getEntriesForSession(sessionId: string): AuditEntry[] {
    return this.entries.filter((e) => e.sessionId === sessionId);
  }

  /**
   * Returns the total number of entries currently in the log.
   */
  get size(): number {
    return this.entries.length;
  }

  /**
   * **For testing only.** Removes all entries from the in-memory log.
   *
   * Do NOT call this method in production code. Clearing the audit log
   * destroys the chain of evidence required for security audits.
   *
   * @internal
   */
  clear(): void {
    this.entries.length = 0;
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────

/**
 * The global shared `AuditLogger` instance.
 *
 * Import and use this throughout the security package (and from consumers)
 * so that all security decisions flow into a single coherent audit trail
 * for the lifetime of the process.
 *
 * @example
 * ```ts
 * import { globalAuditLogger } from '@lumina/security';
 * globalAuditLogger.log({ ... });
 * ```
 */
export const globalAuditLogger = new AuditLogger();
