// packages/security/src/capability-registry.ts
// Maps ActionType to required Capability — the authorization matrix of Lumina.js
// Principle: LLM NEVER HAS AUTHORITY — the registry is static and immutable at runtime.

import type { ActionType, Capability } from '@lumina/contracts';
import type { SecurityContext } from '@lumina/contracts';

/**
 * The canonical mapping from every ActionType to the single Capability it requires.
 *
 * This registry is the source of truth for authorization checks.
 * It is intentionally a plain object (not a Map) so it can be statically
 * analyzed, tree-shaken, and serialized without loss of fidelity.
 *
 * @remarks
 * Adding a new ActionType MUST be accompanied by adding it here.
 * Failure to do so will surface as a TypeScript compile-time error
 * because the Record type requires every ActionType key.
 */
export const CAPABILITY_REGISTRY: Record<ActionType, Capability> = {
  'fill-input': 'fill-input',
  'click': 'click',
  'navigate': 'navigate-page',
  'submit-proof': 'submit-proof',
  'read-dom': 'read-dom',
} as const;

/**
 * Returns the Capability required to execute the given ActionType.
 *
 * @param actionType - The action type to look up.
 * @returns The required Capability.
 *
 * @example
 * ```ts
 * const cap = getRequiredCapability('fill-input'); // → 'fill-input'
 * ```
 */
export function getRequiredCapability(actionType: ActionType): Capability {
  return CAPABILITY_REGISTRY[actionType];
}

/**
 * Determines whether the given SecurityContext grants permission to execute
 * the specified ActionType.
 *
 * This function is the primary capability gate used by the PolicyEngine.
 * It performs a strict membership check against the context's capability list.
 *
 * @param context - The read-only security context injected at session start.
 * @param actionType - The action type to check authorization for.
 * @returns `true` if the context includes the required capability, `false` otherwise.
 *
 * @example
 * ```ts
 * const allowed = hasCapability(ctx, 'click'); // true if ctx.capabilities includes 'click'
 * ```
 */
export function hasCapability(
  context: SecurityContext,
  actionType: ActionType,
): boolean {
  const required = getRequiredCapability(actionType);
  return context.capabilities.includes(required);
}
