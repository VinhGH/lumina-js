import { useLuminaContext } from '../context/lumina-context.js';
import type { WorkflowStateId, GoalState } from '@lumina/contracts';

export interface UseWorkflowReturn {
  currentState: WorkflowStateId;
  goalState: GoalState | null;
  advanceState: (toState: WorkflowStateId) => void;
  isAtState: (state: WorkflowStateId) => boolean;
  reset: () => void;
}

/**
 * `useWorkflow` — hook for accessing and controlling workflow state.
 */
export function useWorkflow(): UseWorkflowReturn {
  const { currentState, goalState, advanceState, reset } = useLuminaContext();

  return {
    currentState,
    goalState,
    advanceState,
    isAtState: (state: WorkflowStateId) => currentState === state,
    reset,
  };
}
