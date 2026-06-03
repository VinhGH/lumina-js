// packages/contracts/src/types/action.ts
// Core action types — the atomic unit of work in Lumina.js

/**
 * All capabilities an agent can be granted.
 * Capabilities are granted by SecurityContext and enforced by PolicyEngine.
 * Principle: LLM NEVER HAS AUTHORITY — LLM only proposes, capability system decides.
 */
export type Capability =
  | 'read-dom'
  | 'fill-input'
  | 'click'
  | 'navigate-page'
  | 'submit-proof'
  | 'mint-certificate'
  | 'read-result';

/**
 * The specific action types the executor can perform.
 * Each maps 1:1 with a required Capability.
 */
export type ActionType =
  | 'fill-input'
  | 'click'
  | 'navigate'
  | 'submit-proof'
  | 'read-dom';

/**
 * RuntimeAction — the atomic proposal from the Planner.
 * MUST pass through SecurityEngine before execution.
 * NEVER executed directly from LLM output.
 */
export type RuntimeAction = {
  /** Unique identifier for this action instance */
  actionId: string;

  /** The type of interaction to perform */
  type: ActionType;

  /** ID assigned by the Scouter/SIR — maps to a real DOM element */
  targetNodeId: string;

  /** Optional data payload (e.g., text to fill, URL to navigate to) */
  payload?: unknown;

  /** Required capability for this action */
  capability: Capability;

  /** Current workflow state when action is proposed */
  workflowState?: string;

  /** Unix timestamp (ms) when this action was created */
  timestamp: number;

  /** Human-readable intent description for auditing */
  intent?: string;
};

/**
 * Result of executing a RuntimeAction.
 */
export type ActionResult = {
  actionId: string;
  success: boolean;
  error?: string;
  timestamp: number;
};
