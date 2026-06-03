// packages/core/src/adapters/openrouter.adapter.ts
// OpenRouter LLM adapter — connects to Claude/GPT/Gemini via OpenRouter API

import type { NodeFingerprint, RuntimeAction } from '@lumina/contracts';
import type { ILLMAdapter, LLMRequest, LLMResponse } from './types.js';

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

interface OpenRouterConfig {
  apiKey: string;
  model?: string;
  baseUrl?: string;
  siteUrl?: string;
  siteName?: string;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterChoice {
  message: { role: string; content: string };
  finish_reason: string;
}

interface OpenRouterResponse {
  choices: OpenRouterChoice[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenRouter adapter — connects to any LLM via OpenRouter.
 * Supports Claude, GPT-4, Gemini, and more.
 *
 * Key design constraint: PromptBuilder ONLY sends NodeFingerprint[] to LLM.
 * NEVER sends raw DOM, innerHTML, or class names.
 */
export class OpenRouterAdapter implements ILLMAdapter {
  readonly name = 'openrouter';

  constructor(private readonly config: OpenRouterConfig) {
    if (!config.apiKey) {
      throw new Error('[OpenRouterAdapter] apiKey is required');
    }
  }

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const messages = this.buildMessages(request);

    const response = await fetch(this.config.baseUrl ?? OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': this.config.siteUrl ?? 'https://lumina-js.dev',
        'X-Title': this.config.siteName ?? 'Lumina.js',
      },
      body: JSON.stringify({
        model: this.config.model ?? DEFAULT_MODEL,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 256,
        temperature: 0.1, // Low temperature for predictability
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`[OpenRouterAdapter] API error ${response.status}: ${error}`);
    }

    const data = (await response.json()) as OpenRouterResponse;
    const content = data.choices[0]?.message?.content;

    if (!content) {
      throw new Error('[OpenRouterAdapter] Empty response from LLM');
    }

    return this.parseResponse(content, request.candidates);
  }

  private buildMessages(request: LLMRequest): OpenRouterMessage[] {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(request);

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
    ];

    if (request.history) {
      for (const h of request.history) {
        messages.push({ role: h.role, content: h.content });
      }
    }

    messages.push({ role: 'user', content: userPrompt });
    return messages;
  }

  private buildSystemPrompt(): string {
    return `You are a Lumina.js Action Planner. You propose UI actions for a workflow-aware web application.

RULES:
1. You ONLY propose. You NEVER execute. A security engine will approve/deny your proposal.
2. You ONLY see NodeFingerprint objects — never raw HTML or DOM.
3. Always respond with valid JSON matching the schema exactly.
4. Prefer the highest-scored candidate unless the intent clearly indicates another.
5. Be conservative — if unsure, prefer 'read-dom' over destructive actions.

RESPONSE SCHEMA:
{
  "actionType": "fill-input" | "click" | "navigate" | "submit-proof" | "read-dom",
  "targetNodeId": "<luminaId of target node>",
  "payload": <string | null>,
  "reasoning": "<brief explanation>",
  "confidence": <0.0 to 1.0>
}`;
  }

  private buildUserPrompt(request: LLMRequest): string {
    const candidateList = request.candidates
      .map(
        (n, i) =>
          `${i + 1}. [${n.luminaId}] tag=${n.tag} label="${n.label}" role=${n.role} capability=${n.capability} state=${n.state ?? 'any'} score=${n.score?.toFixed(2) ?? '?'}`
      )
      .join('\n');

    return `INTENT: "${request.intent}"
WORKFLOW STATE: ${request.currentState ?? 'unknown'}
GOAL: ${JSON.stringify(request.goalState ?? {})}

AVAILABLE NODES (top ${request.candidates.length} from SIR):
${candidateList}

Select the best node and action to fulfill the intent.`;
  }

  private parseResponse(content: string, candidates: NodeFingerprint[]): LLMResponse {
    let parsed: Record<string, unknown>;

    try {
      parsed = JSON.parse(content) as Record<string, unknown>;
    } catch {
      throw new Error(`[OpenRouterAdapter] Failed to parse LLM JSON: ${content}`);
    }

    const actionType = parsed['actionType'] as RuntimeAction['type'];
    const targetNodeId = parsed['targetNodeId'] as string;

    // Validate that targetNodeId is one of our candidates (prompt injection guard)
    const validIds = candidates.map((n) => n.luminaId);
    if (targetNodeId && !validIds.includes(targetNodeId)) {
      throw new Error(
        `[OpenRouterAdapter] Security violation: LLM returned unknown nodeId "${targetNodeId}". Prompt injection suspected.`
      );
    }

    return {
      actionType: actionType ?? 'read-dom',
      targetNodeId: targetNodeId ?? '',
      payload: parsed['payload'] ?? undefined,
      reasoning: (parsed['reasoning'] as string) ?? '',
      confidence: (parsed['confidence'] as number) ?? 0.5,
    };
  }
}
