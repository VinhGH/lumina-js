// packages/core/src/adapters/types.ts
// Shared types for LLM adapters

import type { NodeFingerprint, RuntimeAction, GoalState } from '@lumina/contracts';

/** Request sent to any LLM adapter */
export interface LLMRequest {
  /** User's natural language intent */
  intent: string;

  /** Top N node fingerprints from SIR — NEVER raw DOM */
  candidates: NodeFingerprint[];

  /** Current goal state for context */
  goalState?: GoalState;

  /** Current workflow state */
  currentState?: string;

  /** Chat history for multi-turn interactions */
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/** Response from any LLM adapter */
export interface LLMResponse {
  /** The type of action proposed */
  actionType: RuntimeAction['type'];

  /** The lumina-id of the target node */
  targetNodeId: string;

  /** Optional payload (e.g., text to fill) */
  payload?: unknown;

  /** LLM's reasoning — for audit trail */
  reasoning: string;

  /** Confidence score 0-1 */
  confidence: number;
}

/** All LLM adapters implement this interface */
export interface ILLMAdapter {
  readonly name: string;
  complete(request: LLMRequest): Promise<LLMResponse>;
}
