// packages/memory/src/security-context.store.ts
// Layer 3: Security Context — READ ONLY after initialization.
// Principle: LLM NEVER HAS AUTHORITY — security context is frozen at session start.
// Principle: BUSINESS ERRORS CAN BE CORRECTED. SECURITY ERRORS MUST BE DENIED.

import type { Capability, SecurityContext } from '@lumina/contracts';

/**
 * SecurityContextStore — Layer 3 of the 3-Layer Memory Architecture.
 *
 * Holds the immutable security context for the current session.
 * This store is intentionally **read-only**: no setters exist.
 * The context is injected once at session initialization and cannot
 * be altered by the LLM, Planner, or any runtime component.
 *
 * The security context is the single source of truth for:
 * - Who the user is (`userId`, `sessionId`)
 * - What role they hold (`role`)
 * - What capabilities they are granted (`capabilities`)
 * - When their session expires (`sessionExpiration`)
 *
 * @example
 * ```ts
 * const store = new SecurityContextStore({
 *   userId: 'user-123',
 *   sessionId: 'sess-abc',
 *   role: 'student',
 *   capabilities: ['read-dom', 'submit-proof'],
 *   sessionExpiration: Date.now() + 3_600_000,
 * });
 *
 * store.hasCapability('submit-proof'); // true
 * store.isSessionValid();              // true (within expiry)
 * ```
 */
export class SecurityContextStore {
  /**
   * The immutable security context for this session.
   * Deeply frozen at construction time — cannot be mutated.
   */
  private readonly _context: Readonly<SecurityContext>;

  /**
   * Creates a new SecurityContextStore.
   * The provided context is deep-frozen immediately.
   *
   * @param context - The security context established at session start.
   * @throws {Error} If required fields are missing or the context is invalid.
   */
  constructor(context: SecurityContext) {
    if (!context.userId?.trim()) {
      throw new Error('[SecurityContextStore] SecurityContext.userId must not be empty.');
    }
    if (!context.sessionId?.trim()) {
      throw new Error('[SecurityContextStore] SecurityContext.sessionId must not be empty.');
    }
    if (!context.role?.trim()) {
      throw new Error('[SecurityContextStore] SecurityContext.role must not be empty.');
    }
    if (!Array.isArray(context.capabilities)) {
      throw new Error('[SecurityContextStore] SecurityContext.capabilities must be an array.');
    }
    if (typeof context.sessionExpiration !== 'number' || context.sessionExpiration <= 0) {
      throw new Error('[SecurityContextStore] SecurityContext.sessionExpiration must be a positive number.');
    }

    // Deep-freeze: freeze the capabilities array AND the context object itself.
    // This guarantees the context is truly immutable at runtime.
    this._context = Object.freeze({
      ...context,
      capabilities: Object.freeze([...context.capabilities]),
    });
  }

  /**
   * Returns a read-only snapshot of the full security context.
   * The returned object is frozen — attempting to mutate it will throw in strict mode.
   *
   * **NEVER allow mutation of this object outside of the store.**
   */
  getContext(): Readonly<SecurityContext> {
    return this._context;
  }

  /**
   * Returns the user ID for the current session.
   */
  getUserId(): string {
    return this._context.userId;
  }

  /**
   * Returns the role assigned to the user in this session.
   * e.g. `'student'`, `'instructor'`, `'admin'`
   */
  getRole(): string {
    return this._context.role;
  }

  /**
   * Returns the full list of capabilities granted to this user in this session.
   * The array is frozen — consumers cannot push/pop capabilities.
   */
  getCapabilities(): readonly Capability[] {
    return this._context.capabilities;
  }

  /**
   * Checks whether the user holds a specific capability in this session.
   * The PolicyEngine uses this to determine whether an action proposal is permissible.
   *
   * @param capability - The capability to check for.
   * @returns `true` if the capability is present in the security context.
   */
  hasCapability(capability: Capability): boolean {
    return this._context.capabilities.includes(capability);
  }

  /**
   * Returns `true` if the session has not yet expired.
   * Compares `sessionExpiration` against `Date.now()`.
   *
   * This check should be performed before every privileged action.
   */
  isSessionValid(): boolean {
    return Date.now() < this._context.sessionExpiration;
  }

  /**
   * Returns the session ID for the current session.
   * Used in audit logging and action correlation.
   */
  getSessionId(): string {
    return this._context.sessionId;
  }
}
