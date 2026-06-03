import type {
  WorkflowStateId,
  WorkflowState,
  GoalState,
  TransitionResult,
  WorkflowDefinition,
} from '@lumina/contracts';

export type FSMTransitionMap = Record<string, string[]>;

function buildInitialGoalState(state: string): GoalState {
  return { currentState: state };
}

function buildInitialWorkflowState(state: string): WorkflowState {
  const now = Date.now();
  return {
    currentState: state,
    previousState: undefined,
    goalState: buildInitialGoalState(state),
    history: [state],
    isComplete: false,
    startedAt: now,
    lastTransitionAt: now,
  };
}

export class WorkflowFSM<T extends string = string> {
  private _state: WorkflowState;
  private readonly transitions: FSMTransitionMap;
  private readonly listeners: Set<(state: WorkflowState) => void>;
  private readonly _initialState: T;

  constructor(
    transitions: FSMTransitionMap = {},
    initialState: T,
  ) {
    this.transitions = transitions;
    this._initialState = initialState;
    this._state = buildInitialWorkflowState(initialState);
    this.listeners = new Set();
  }

  getState(): Readonly<WorkflowState> {
    return Object.freeze({ ...this._state, history: [...this._state.history] });
  }

  getCurrentState(): T {
    return this._state.currentState as T;
  }

  canTransition(toState: T): boolean {
    const allowedNext = this.transitions[this._state.currentState];
    if (!allowedNext) return false;
    return allowedNext.includes(toState);
  }

  transition(toState: T): TransitionResult {
    const fromState = this._state.currentState;

    if (!this.canTransition(toState)) {
      return {
        success: false,
        fromState,
        toState,
        reason: `[WorkflowFSM] Transition from '${fromState}' to '${toState}' is not permitted. ` +
          `Allowed transitions: [${(this.transitions[fromState] ?? []).join(', ') || 'none'}].`,
      };
    }

    const now = Date.now();
    const updatedGoalState: GoalState = {
      ...this._state.goalState,
      currentState: toState,
    };

    this._state = {
      ...this._state,
      currentState: toState,
      previousState: fromState,
      goalState: updatedGoalState,
      history: [...this._state.history, toState],
      isComplete: this._isTerminalState(toState),
      lastTransitionAt: now,
    };

    this.notify();

    return { success: true, fromState, toState };
  }

  reset(): void {
    this._state = buildInitialWorkflowState(this._initialState);
    this.notify();
  }

  subscribe(listener: (state: WorkflowState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const snapshot = this.getState();
    for (const listener of this.listeners) {
      try {
        listener(snapshot);
      } catch (err) {
        console.error('[WorkflowFSM] Subscriber threw an error:', err);
      }
    }
  }

  private _isTerminalState(state: string): boolean {
    const next = this.transitions[state];
    return !next || next.length === 0;
  }
}

export function createFSMFromDefinition<T extends string>(
  def: WorkflowDefinition,
): WorkflowFSM<T> {
  const transitions: FSMTransitionMap = {};
  def.states.forEach((s) => {
    transitions[s] = [];
  });
  def.transitions.forEach((t) => {
    if (transitions[t.from]) {
      transitions[t.from].push(t.to);
    }
  });

  return new WorkflowFSM<T>(transitions, def.initialState as T);
}

export function createFSM<T extends string = string>(
  transitions: FSMTransitionMap,
  initialState: T,
): WorkflowFSM<T> {
  return new WorkflowFSM<T>(transitions, initialState);
}

