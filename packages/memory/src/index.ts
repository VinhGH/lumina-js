// packages/memory/src/index.ts
// Barrel export for @lumina/memory
// 3-Layer Memory Architecture — Goal State, Workflow FSM, Security Context

// ─── Layer 1: Goal State Store ────────────────────────────────────────────────
export { GoalStateStore, createGoalStateStore } from './goal-state.store.js';

// ─── Layer 2: Workflow FSM ────────────────────────────────────────────────────
export {
  WorkflowFSM,
  createFSMFromDefinition,
  createFSM,
} from './workflow-fsm.js';

export type { FSMTransitionMap } from './workflow-fsm.js';

// ─── Layer 3: Security Context Store ─────────────────────────────────────────
export { SecurityContextStore } from './security-context.store.js';
