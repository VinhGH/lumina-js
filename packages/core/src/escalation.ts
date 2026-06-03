// packages/core/src/escalation.ts
// Validation Escalation Pipeline — Chain of Responsibility Pattern
// Principle: BUSINESS ERRORS CAN BE CORRECTED. SECURITY ERRORS MUST BE DENIED.

import type { RuntimeAction, PolicyDecision } from '@lumina/contracts';

export type EscalationLevel =
  | 'silent-repair'
  | 'llm-retry'
  | 'ask-user'
  | 'deny';

export interface EscalationContext {
  action: RuntimeAction;
  error: Error | string;
  attemptCount: number;
  policyDecision?: PolicyDecision;
}

export interface EscalationResult {
  level: EscalationLevel;
  resolved: boolean;
  repairedAction?: RuntimeAction;
  userMessage?: string;
  denyReason?: string;
}

export type EscalationHandler = (
  context: EscalationContext
) => Promise<EscalationResult | null>;

// ─── Silent Repair ────────────────────────────────────────────────────────────

/**
 * Stage 1: Silent Repair — automatically fixes minor data issues.
 * Examples: 'SUV' → 'suv', '01/02/2026' → '2026-02-01'
 */
export async function silentRepair(
  context: EscalationContext
): Promise<EscalationResult | null> {
  const { action } = context;

  if (action.type !== 'fill-input' || !action.payload) {
    return null; // Can't repair non-fill actions
  }

  const payload = action.payload as { value?: string };
  if (typeof payload.value !== 'string') return null;

  let repaired = payload.value;
  let didRepair = false;

  // Normalize: trim whitespace
  const trimmed = repaired.trim();
  if (trimmed !== repaired) {
    repaired = trimmed;
    didRepair = true;
  }

  // Normalize: US date format → ISO
  const usDateMatch = repaired.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (usDateMatch) {
    repaired = `${usDateMatch[3]}-${usDateMatch[1]}-${usDateMatch[2]}`;
    didRepair = true;
  }

  if (!didRepair) return null;

  return {
    level: 'silent-repair',
    resolved: true,
    repairedAction: {
      ...action,
      payload: { ...payload, value: repaired },
    },
  };
}

// ─── LLM Retry ───────────────────────────────────────────────────────────────

/**
 * Stage 2: LLM Retry — re-run the LLM with additional error context.
 * Max 2 retries before escalating.
 */
export async function llmRetry(
  context: EscalationContext,
  retryFn: (error: string) => Promise<RuntimeAction | null>
): Promise<EscalationResult | null> {
  if (context.attemptCount >= 3) {
    return null; // Escalate further
  }

  try {
    const errorMsg =
      typeof context.error === 'string' ? context.error : context.error.message;
    const retriedAction = await retryFn(errorMsg);

    if (!retriedAction) return null;

    return {
      level: 'llm-retry',
      resolved: true,
      repairedAction: retriedAction,
    };
  } catch {
    return null;
  }
}

// ─── Ask User ────────────────────────────────────────────────────────────────

/**
 * Stage 3: Ask User — surface the error to the human for manual resolution.
 */
export function askUser(context: EscalationContext): EscalationResult {
  const errorMsg =
    typeof context.error === 'string' ? context.error : context.error.message;

  return {
    level: 'ask-user',
    resolved: false,
    userMessage: `Lumina.js needs your help to complete this action.\n\nAction: ${context.action.type} on ${context.action.targetNodeId}\nIssue: ${errorMsg}\n\nPlease review and confirm.`,
  };
}

// ─── Deny ────────────────────────────────────────────────────────────────────

/**
 * Stage 4: Deny — hard stop. Used for security violations.
 * SECURITY ERRORS MUST BE DENIED.
 */
export function deny(context: EscalationContext, reason?: string): EscalationResult {
  const denyReason =
    reason ??
    (context.policyDecision?.reason ?? 'Security policy denied this action');

  return {
    level: 'deny',
    resolved: false,
    denyReason,
  };
}

// ─── Pipeline Orchestrator ───────────────────────────────────────────────────

/**
 * EscalationPipeline — Chain of Responsibility orchestrator.
 * Runs handlers in order: SilentRepair → LLMRetry → AskUser → Deny
 */
export class EscalationPipeline {
  /**
   * Runs the full escalation chain for a business error.
   * Security errors ALWAYS escalate directly to Deny.
   */
  async handleBusinessError(
    context: EscalationContext,
    retryFn?: (error: string) => Promise<RuntimeAction | null>
  ): Promise<EscalationResult> {
    // Stage 1: Silent Repair
    const repaired = await silentRepair(context);
    if (repaired?.resolved) return repaired;

    // Stage 2: LLM Retry
    if (retryFn) {
      const retried = await llmRetry(context, retryFn);
      if (retried?.resolved) return retried;
    }

    // Stage 3: Ask User
    return askUser(context);
  }

  /**
   * Handles security errors — ALWAYS denies.
   * SECURITY ERRORS MUST BE DENIED.
   */
  handleSecurityError(context: EscalationContext, reason?: string): EscalationResult {
    return deny(context, reason);
  }
}

export function createEscalationPipeline(): EscalationPipeline {
  return new EscalationPipeline();
}
