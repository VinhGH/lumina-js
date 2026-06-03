// packages/core/src/index.ts
// Barrel export for @lumina/core

// ─── Adapters ────────────────────────────────────────────────────────────────
export type { ILLMAdapter, LLMRequest, LLMResponse } from './adapters/types.js';
export { MockAdapter } from './adapters/mock.adapter.js';
export { OpenRouterAdapter } from './adapters/openrouter.adapter.js';

// ─── Prompt Builder ──────────────────────────────────────────────────────────
export { PromptBuilder, createPromptBuilder } from './prompt-builder.js';
export type { PromptBuilderOptions } from './prompt-builder.js';

// ─── Planner ─────────────────────────────────────────────────────────────────
export { Planner, createPlanner } from './planner.js';
export type { PlannerOptions, PlanResult, PlannerContext } from './planner.js';

// ─── LLM Orchestrator ────────────────────────────────────────────────────────
export { LLMOrchestrator, createLLMOrchestrator } from './llm-orchestrator.js';
export type { OrchestratorOptions } from './llm-orchestrator.js';

// ─── Tool Router ─────────────────────────────────────────────────────────────
export {
  ToolRouter,
  createToolRouter,
} from './tool-router.js';

// ─── Escalation ──────────────────────────────────────────────────────────────
export {
  EscalationPipeline,
  createEscalationPipeline,
  silentRepair,
  llmRetry,
  askUser,
  deny,
} from './escalation.js';
export type {
  EscalationLevel,
  EscalationContext,
  EscalationResult,
  EscalationHandler,
} from './escalation.js';

// ─── Utils ───────────────────────────────────────────────────────────────────
export { randomUUID, formatMs } from './utils.js';
