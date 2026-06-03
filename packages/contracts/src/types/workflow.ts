import type { Capability } from './action.js';

export type WorkflowStateId = string;

export type WorkflowTransition = {
  from: WorkflowStateId;
  to: WorkflowStateId;
  condition?: string;
};

/**
 * Per-state security policy — bound to workflow definition.
 * PolicyEngine reads this instead of hardcoding risk levels.
 */
export type StatePolicy = {
  capabilities: Capability[];
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  requiresHumanApproval?: boolean;
  maxRetries?: number;
};

export type WorkflowDefinition = {
  id: string;
  name: string;
  version: string;
  readonly states: readonly WorkflowStateId[];
  readonly transitions: readonly WorkflowTransition[];
  initialState: WorkflowStateId;
  statePolicies?: Record<WorkflowStateId, StatePolicy>;
  metadata?: Record<string, unknown>;
};

export type GoalState = {
  currentState: WorkflowStateId;
  userIntent?: string;
  context?: Record<string, unknown>;
};

export type WorkflowState = {
  currentState: WorkflowStateId;
  previousState?: WorkflowStateId;
  goalState: GoalState;
  history: WorkflowStateId[];
  isComplete: boolean;
  startedAt: number;
  lastTransitionAt: number;
};

export type TransitionResult = {
  success: boolean;
  fromState: WorkflowStateId;
  toState: WorkflowStateId;
  reason?: string;
};

