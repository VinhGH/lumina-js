// packages/sdk/src/index.ts
// 🌟 Lumina.js Unified SDK Barrel Export

// ─── Tầng 1: Public API (Dành cho Developer thông thường) ──────────────────────
export { defineWorkflow } from '@lumina/workflow';
export type { TypedWorkflowDefinition } from '@lumina/workflow';

export { LuminaProvider, LuminaContext, useLumina, useIntent, useWorkflow } from '@lumina/react';
export type {
  LuminaProviderProps,
  UseWorkflowReturn,
  UseIntentReturn,
  LuminaContextValue,
} from '@lumina/react';

// Public shared types from @lumina/contracts
export type {
  WorkflowStateId,
  GoalState,
  Capability,
  ActionType,
  RuntimeAction,
  ActionResult,
  InteractiveNode,
  ScoutResult,
  SIRResult,
  WorkflowDefinition,
  StatePolicy,
  RiskLevel,
  SecurityContext,
} from '@lumina/contracts';

// ─── Tầng 2: Advanced API (Cho mở rộng / Tùy biến sâu) ─────────────────────────
export { AgentRuntime } from '@lumina/core';
export type { RuntimeConfig, AgentStatus, RuntimeState } from '@lumina/core';
export { RuleBasedLLMAdapter, MockAdapter, OpenRouterAdapter } from '@lumina/core';
export { Planner } from '@lumina/core';
export { EventBus } from '@lumina/core';
export { PolicyEngine } from '@lumina/security';
export { ToolRegistry, globalToolRegistry } from '@lumina/tools';
