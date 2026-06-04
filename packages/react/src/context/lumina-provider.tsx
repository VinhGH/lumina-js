// packages/react/src/context/lumina-provider.tsx
// LuminaProvider — React wrapper that mirrors and drives the generic Lumina AgentRuntime

import React, { useState, useEffect } from 'react';
import { LuminaContext } from './lumina-context.js';
import type { AgentRuntime } from '@lumina/core';

export interface LuminaProviderProps {
  children: React.ReactNode;
  runtime: AgentRuntime;
}

export function LuminaProvider({ children, runtime }: LuminaProviderProps) {
  const [runtimeState, setRuntimeState] = useState(runtime.getState());

  useEffect(() => {
    const unsubscribe = runtime.subscribe((nextState) => {
      setRuntimeState(nextState);
    });
    return unsubscribe;
  }, [runtime]);

  // Route transition observer - keeps FSM synchronized with route changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleLocationChange = async () => {
      try {
        const root = (runtime as any).rootElement ?? document.body;
        const nextScan = await runtime.scanAdapter.scan(root);
        // Access private sync method to update FSM state from new DOM
        if (typeof (runtime as any).synchronizeFSMFromObservation === 'function') {
          (runtime as any).synchronizeFSMFromObservation(nextScan.nodes);
        }
      } catch (e) {
        console.warn('[Lumina] Failed to scan DOM on route change:', e);
      }
    };

    window.addEventListener('popstate', handleLocationChange);

    const originalPushState = window.history.pushState;
    const originalReplaceState = window.history.replaceState;

    window.history.pushState = function (...args) {
      originalPushState.apply(this, args);
      handleLocationChange();
    };

    window.history.replaceState = function (...args) {
      originalReplaceState.apply(this, args);
      handleLocationChange();
    };

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.history.pushState = originalPushState;
      window.history.replaceState = originalReplaceState;
    };
  }, [runtime]);

  const value = {
    currentState: runtimeState.currentState,
    goalState: runtimeState.goalState,
    status: runtimeState.status,
    lastSIRResult: runtimeState.lastSIRResult,
    pendingApproval: runtimeState.pendingApproval,
    error: runtimeState.error,
    runtime,
    securityContext: runtime.securityStore.getContext() ?? null,
    submitIntent: (intent: string) => runtime.runAgentLoop(intent),
    reset: () => runtime.reset(),
    advanceState: (toState: string) => {
      runtime.fsm.transition(toState);
    },
    updateGoalContext: (ctxPatch: Record<string, any>) => {
      runtime.goalStore.mergeContext(ctxPatch);
      (runtime as any).notify();
    },
    confirmPendingAction: () => runtime.approvePendingAction(),
    rejectPendingAction: () => runtime.rejectPendingAction(),
  };

  return (
    <LuminaContext.Provider value={value as any}>
      {children}
    </LuminaContext.Provider>
  );
}
