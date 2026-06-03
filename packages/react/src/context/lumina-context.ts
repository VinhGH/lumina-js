import { createContext, useContext } from 'react';
import type { GoalState, WorkflowStateId, SecurityContext } from '@lumina/contracts';
import type { SIRResult } from '@lumina/contracts';
import type { PlanResult } from '@lumina/core';

export interface LuminaRuntimeState {
  /** Current workflow state */
  currentState: WorkflowStateId;

  /** User's current goal */
  goalState: GoalState | null;

  /** Latest SIR results */
  lastSIRResult: SIRResult | null;

  /** Latest plan result (proposal — not yet approved) */
  lastPlanResult: PlanResult | null;

  /** Whether the runtime is currently processing */
  isProcessing: boolean;

  /** Last error, if any */
  error: Error | null;

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
