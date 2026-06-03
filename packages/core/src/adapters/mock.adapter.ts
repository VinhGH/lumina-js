// packages/core/src/adapters/mock.adapter.ts
// Mock LLM adapter for offline testing and development
// Default adapter — no API key required

import type {
  NodeFingerprint,
  RuntimeAction,
  GoalState,
} from '@lumina/contracts';
import { ActionTypeSchema } from '@lumina/contracts';
import type { ILLMAdapter, LLMRequest, LLMResponse } from './types.js';

/**
 * MockAdapter — deterministic, offline LLM adapter.
 * Used in development and testing. Always returns predictable outputs.
 *
 * Principle: PREDICTABILITY > INTELLIGENCE.
 */
export class MockAdapter implements ILLMAdapter {
  readonly name = 'mock';

  /**
   * Returns a deterministic action proposal based on top-ranked node.
   * Never makes network calls.
   */
  async complete(request: LLMRequest): Promise<LLMResponse> {
    const topNode = request.candidates[0];

    if (!topNode) {
      return {
        actionType: 'read-dom',
        targetNodeId: '',
        payload: undefined,
        reasoning: 'No candidates available — defaulting to read-dom',
        confidence: 0,
      };
    }

    const actionType = this.inferActionType(topNode, request.intent);
    const payload = this.inferPayload(topNode, request.intent, request.goalState);

    return {
      actionType,
      targetNodeId: topNode.luminaId,
      payload,
      reasoning: `[MOCK] Selected "${topNode.label}" (${topNode.capability}) for intent: "${request.intent}"`,
      confidence: topNode.score ?? 0.8,
    };
  }

  private inferActionType(node: NodeFingerprint, intent: string): RuntimeAction['type'] {
    const intentLower = intent.toLowerCase();

    // Direct mapping from capability
    switch (node.capability) {
      case 'fill-input':
        return 'fill-input';
      case 'submit-proof':
        return 'submit-proof';
      case 'navigate-page':
        return 'navigate';
      case 'click':
        return 'click';
      case 'read-dom':
      case 'read-result':
        return 'read-dom';
      default:
        return 'click';
    }
  }

  private inferPayload(
    node: NodeFingerprint,
    intent: string,
    goalState?: GoalState
  ): unknown {
    if (node.capability === 'fill-input') {
      // Extract what to fill from intent (naive heuristic for mock)
      const match = intent.match(/["']([^"']+)["']/);
      return match ? { value: match[1] } : { value: '[mock-value]' };
    }
    return undefined;
  }
}
