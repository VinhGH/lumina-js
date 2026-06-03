// packages/contracts/src/index.ts
// Single barrel export for @lumina/contracts
// This is the ONLY file consumers import from

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  Capability,
  ActionType,
  RuntimeAction,
  ActionResult,
} from './types/action.js';

export type {
  RiskLevel,
  SecurityToken,
  SecurityContext,
  PolicyDecision,
  AuditEntry,
} from './types/security.js';

export type {
  NodeFingerprint,
  InteractiveNode,
  ScoutResult,
  SIRResult,
  SemanticType,
} from './types/node.js';

export type {
  WorkflowStateId,
  WorkflowTransition,
  StatePolicy,
  WorkflowDefinition,
  GoalState,
  WorkflowState,
  TransitionResult,
} from './types/workflow.js';

// ─── Schemas ─────────────────────────────────────────────────────────────────
export {
  CapabilitySchema,
  ActionTypeSchema,
  RuntimeActionSchema,
  ActionResultSchema,
} from './schemas/action.schema.js';

export {
  RiskLevelSchema,
  SecurityTokenSchema,
  SecurityContextSchema,
  PolicyDecisionSchema,
  AuditEntrySchema,
} from './schemas/security.schema.js';

export {
  WorkflowStateIdSchema,
  SemanticTypeSchema,
  NodeFingerprintSchema,
  InteractiveNodeSchema,
  ScoutResultSchema,
  SIRResultSchema,
} from './schemas/node.schema.js';

// ─── Version ─────────────────────────────────────────────────────────────────
export const LUMINA_VERSION = '1.0.0-alpha';
