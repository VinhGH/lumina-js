import { createContext, useContext } from 'react';
import type { GoalState, WorkflowStateId, SecurityContext, SIRResult, RuntimeAction } from '@lumina/contracts';
import type { AgentStatus, AgentRuntime } from '@lumina/core';

export interface LuminaRuntimeState {
  /** Current workflow state */
  currentState: WorkflowStateId;

  /** User's current goal */
  goalState: GoalState | null;

  /** Current execution status of the agent loop */
  status: AgentStatus;

  /** Latest SIR results */
  lastSIRResult: SIRResult | null;

  /** Action pending human approval in the queue */
  pendingApproval: RuntimeAction | null;

  /** Last error, if any */
  error: Error | null;

  /** Core AgentRuntime instance */
  runtime: AgentRuntime;

  /** Security context (read-only) */
  securityContext: SecurityContext | null;
}

export interface LuminaRuntimeActions {
  /** Submit a natural language intent for processing */
  submitIntent: (intent: string) => Promise<void>;

  /** Reset the runtime state */
  reset: () => void;

  /** Manually advance workflow state */
  advanceState: (toState: WorkflowStateId) => void;

  /** Update target goal business context properties */
  updateGoalContext: (context: Record<string, any>) => void;

  /** Approve the current pending human-in-the-loop action */
  confirmPendingAction: () => Promise<void>;

  /** Reject the current pending human-in-the-loop action */
  rejectPendingAction: () => void;
}

export type LuminaContextValue = LuminaRuntimeState & LuminaRuntimeActions;

export const LuminaContext = createContext<LuminaContextValue | null>(null);

export function useLuminaContext(): LuminaContextValue {
  const ctx = useContext(LuminaContext);
  if (!ctx) {
    throw new Error(
      '[useLuminaContext] Must be used within a <LuminaProvider>. ' +
        'Wrap your app with <LuminaProvider> from @lumina/react.'
    );
  }
  return ctx;
}
