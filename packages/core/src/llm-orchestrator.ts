// packages/core/src/llm-orchestrator.ts
// LLM Orchestrator — manages the full LLM call lifecycle

import type { NodeFingerprint, RuntimeAction, GoalState } from '@lumina/contracts';
import type { ILLMAdapter, LLMResponse } from './adapters/types.js';
import { PromptBuilder } from './prompt-builder.js';

export interface OrchestratorOptions {
  adapter: ILLMAdapter;
  maxRetries?: number;
  onRetry?: (attempt: number, error: Error) => void;
  onComplete?: (response: LLMResponse, durationMs: number) => void;
}

/**
 * LLMOrchestrator — wraps an ILLMAdapter with retry logic, timing, and callbacks.
 * The Planner uses this to make LLM calls.
 */
export class LLMOrchestrator {
  private readonly promptBuilder: PromptBuilder;
  private readonly maxRetries: number;

  constructor(private readonly options: OrchestratorOptions) {
    this.promptBuilder = new PromptBuilder();
    this.maxRetries = options.maxRetries ?? 2;
  }

  async run(params: {
    intent: string;
    candidates: NodeFingerprint[];
    goalState?: GoalState;
    currentState?: string;
    errorContext?: string;
  }): Promise<LLMResponse> {
    const request = this.promptBuilder.build({
      intent: params.errorContext
        ? `${params.intent}\n\n[RETRY CONTEXT]: ${params.errorContext}`
        : params.intent,
      candidates: params.candidates,
      goalState: params.goalState,
      currentState: params.currentState,
    });

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        const startMs = Date.now();
        const response = await this.options.adapter.complete(request);
        const durationMs = Date.now() - startMs;

        this.options.onComplete?.(response, durationMs);
        return response;
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));

        if (attempt <= this.maxRetries) {
          this.options.onRetry?.(attempt, lastError);
          await this.sleep(Math.pow(2, attempt) * 100); // Exponential backoff
        }
      }
    }

    throw lastError ?? new Error('[LLMOrchestrator] All retries exhausted');
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createLLMOrchestrator(options: OrchestratorOptions): LLMOrchestrator {
  return new LLMOrchestrator(options);
}
