// packages/core/src/prompt-builder.ts
// Builds minimal, structured prompts for the LLM.
// INVARIANT: This module NEVER receives or exposes raw HTML/DOM to LLM.
// Principle: LLM NEVER TOUCHES RAW DOM.

import type { NodeFingerprint, GoalState } from '@lumina/contracts';
import type { LLMRequest } from './adapters/types.js';

export interface PromptBuilderOptions {
  maxCandidates?: number;
}

/**
 * PromptBuilder — transforms SIR output into a structured LLM request.
 *
 * INVARIANT: input is always NodeFingerprint[] — never Element, innerHTML, or className.
 * This is enforced by TypeScript types.
 */
export class PromptBuilder {
  constructor(private readonly options: PromptBuilderOptions = {}) {}

  /**
   * Build a structured LLMRequest from intent + SIR candidates.
   * The result is SAFE to send to any LLM adapter.
   */
  build(params: {
    intent: string;
    candidates: NodeFingerprint[];
    goalState?: GoalState;
    currentState?: string;
    history?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }): LLMRequest {
    const maxCandidates = this.options.maxCandidates ?? 5;
    const safeCandidates = params.candidates.slice(0, maxCandidates);

    // Validate: ensure no raw DOM leaks (TypeScript enforces NodeFingerprint structure)
    this.assertNoRawDom(safeCandidates);

    return {
      intent: params.intent,
      candidates: safeCandidates,
      goalState: params.goalState,
      currentState: params.currentState,
      history: params.history,
    };
  }

  /**
   * Runtime guard against raw DOM leakage.
   * NodeFingerprint must not contain innerHTML, className, or Element references.
   */
  private assertNoRawDom(candidates: NodeFingerprint[]): void {
    for (const node of candidates) {
      if ('innerHTML' in node || 'className' in node || 'element' in node) {
        throw new Error(
          `[PromptBuilder] INVARIANT VIOLATION: NodeFingerprint contains raw DOM property. ` +
            `This would violate "LLM NEVER TOUCHES RAW DOM". Node: ${node.luminaId}`
        );
      }
    }
  }
}

export function createPromptBuilder(options?: PromptBuilderOptions): PromptBuilder {
  return new PromptBuilder(options);
}
