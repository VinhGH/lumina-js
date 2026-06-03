// packages/core/src/planner.ts
// Planner — orchestrates SIR + LLM + Security to produce RuntimeActions
// Principle: LLM NEVER HAS AUTHORITY. Planner produces proposals, SecurityEngine approves.

import type {
  RuntimeAction,
  NodeFingerprint,
  GoalState,
  SIRResult,
  PolicyDecision,
} from '@lumina/contracts';
import { RuntimeActionSchema } from '@lumina/contracts';
import type { ILLMAdapter } from './adapters/types.js';
import { PromptBuilder } from './prompt-builder.js';
import { EscalationPipeline } from './escalation.js';
import { randomUUID } from './utils.js';

export interface PlannerOptions {
  adapter: ILLMAdapter;
  maxRetries?: number;
}

export interface PlanResult {
  action: RuntimeAction;
  reasoning: string;
  confidence: number;
  candidatesUsed: NodeFingerprint[];
}

export interface PlannerContext {
  intent: string;
  sirResult: SIRResult;
  goalState?: GoalState;
  currentState?: string;
  history?: Array<{ role: 'user' | 'assistant'; content: string }>;
}

/**
 * Planner — the bridge between SIR output and RuntimeAction proposals.
 */
export class Planner {
  private readonly promptBuilder: PromptBuilder;
  private readonly escalation: EscalationPipeline;
  private readonly maxRetries: number;

  constructor(private readonly options: PlannerOptions) {
    this.promptBuilder = new PromptBuilder({ maxCandidates: 5 });
    this.escalation = new EscalationPipeline();
    this.maxRetries = options.maxRetries ?? 2;
  }

  /**
   * Plans the next action given an intent and SIR results.
   * Returns a PROPOSAL — must be approved by SecurityEngine before execution.
   */
  async plan(context: PlannerContext): Promise<PlanResult> {
    const { intent, sirResult, goalState, currentState, history } = context;

    if (sirResult.topNodes.length === 0) {
      throw new Error('[Planner] No candidates from SIR — cannot plan action');
    }

    // Build LLM request (only NodeFingerprints, never raw DOM)
    const llmRequest = this.promptBuilder.build({
      intent,
      candidates: sirResult.topNodes,
      goalState,
      currentState,
      history,
    });

    // Get LLM proposal
    const llmResponse = await this.options.adapter.complete(llmRequest);

    // Validate and construct RuntimeAction
    const actionData: RuntimeAction = {
      actionId: randomUUID(),
      type: llmResponse.actionType,
      targetNodeId: llmResponse.targetNodeId,
      payload: llmResponse.payload,
      capability: this.inferCapability(llmResponse.actionType),
      workflowState: currentState,
      timestamp: Date.now(),
      intent,
    };

    // Zod validation
    const parseResult = RuntimeActionSchema.safeParse(actionData);
    if (!parseResult.success) {
      throw new Error(
        `[Planner] Invalid RuntimeAction from LLM: ${parseResult.error.message}`
      );
    }

    return {
      action: parseResult.data,
      reasoning: llmResponse.reasoning,
      confidence: llmResponse.confidence,
      candidatesUsed: sirResult.topNodes,
    };
  }

  private inferCapability(actionType: RuntimeAction['type']): RuntimeAction['capability'] {
    switch (actionType) {
      case 'fill-input': return 'fill-input';
      case 'click': return 'click';
      case 'navigate': return 'navigate-page';
      case 'submit-proof': return 'submit-proof';
      case 'read-dom': return 'read-dom';
      default: return 'read-dom';
    }
  }
}

export function createPlanner(options: PlannerOptions): Planner {
  return new Planner(options);
}
