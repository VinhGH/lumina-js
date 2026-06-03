// packages/react/src/hooks/useIntent.ts
// Hook for submitting user intents to the Lumina runtime

import { useState, useCallback } from 'react';
import { useLuminaContext } from '../context/lumina-context.js';
import type { PlanResult } from '@lumina/core';

export interface UseIntentReturn {
  /** Submit a natural language intent */
  submitIntent: (intent: string) => Promise<void>;

  /** Current intent being processed */
  currentIntent: string | null;

  /** Whether the intent is being processed */
  isProcessing: boolean;

  /** Last plan result from the Planner */
  lastPlanResult: PlanResult | null;

  /** Last error during intent processing */
  error: Error | null;

  /** Clear error state */
  clearError: () => void;
}

/**
 * `useIntent` — hook for submitting natural language intents.
 *
 * @example
 * ```tsx
 * function IntentInput() {
 *   const { submitIntent, isProcessing } = useIntent();
 *
 *   return (
 *     <input
 *       onKeyDown={(e) => {
 *         if (e.key === 'Enter') submitIntent(e.currentTarget.value);
 *       }}
 *       disabled={isProcessing}
 *     />
 *   );
 * }
 * ```
 */
export function useIntent(): UseIntentReturn {
  const { submitIntent: runtimeSubmit, isProcessing, lastPlanResult, error } = useLuminaContext();
  const [currentIntent, setCurrentIntent] = useState<string | null>(null);
  const [localError, setLocalError] = useState<Error | null>(null);

  const submitIntent = useCallback(async (intent: string) => {
    setCurrentIntent(intent);
    setLocalError(null);
    try {
      await runtimeSubmit(intent);
    } catch (err) {
      setLocalError(err instanceof Error ? err : new Error(String(err)));
    }
  }, [runtimeSubmit]);

  const clearError = useCallback(() => {
    setLocalError(null);
  }, []);

  return {
    submitIntent,
    currentIntent,
    isProcessing,
    lastPlanResult,
    error: localError ?? error,
    clearError,
  };
}
