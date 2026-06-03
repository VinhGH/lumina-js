import type { GoalState, WorkflowStateId } from '@lumina/contracts';

export class GoalStateStore {
  private state: GoalState;

  constructor(initialState: WorkflowStateId = 'idle') {
    this.state = {
      currentState: initialState,
      context: {},
    };
  }

  getState(): Readonly<GoalState> {
    return Object.freeze({
      ...this.state,
      context: this.state.context ? { ...this.state.context } : {},
    });
  }

  setState(state: WorkflowStateId): void {
    this.state = { ...this.state, currentState: state };
  }

  setUserIntent(intent: string): void {
    if (!intent.trim()) {
      throw new Error('[GoalStateStore] userIntent must not be empty.');
    }
    this.state = { ...this.state, userIntent: intent };
  }

  setContext(key: string, value: unknown): void {
    const currentContext = this.state.context || {};
    this.state = {
      ...this.state,
      context: {
        ...currentContext,
        [key]: value,
      },
    };
  }

  mergeContext(patch: Record<string, unknown>): void {
    const currentContext = this.state.context || {};
    this.state = {
      ...this.state,
      context: {
        ...currentContext,
        ...patch,
      },
    };
  }

  getContext(): Readonly<Record<string, unknown>> {
    return Object.freeze(this.state.context ? { ...this.state.context } : {});
  }

  reset(initialState: WorkflowStateId = 'idle'): void {
    this.state = {
      currentState: initialState,
      context: {},
    };
  }

  isAtState(state: WorkflowStateId): boolean {
    return this.state.currentState === state;
  }
}

export function createGoalStateStore(initialState?: WorkflowStateId): GoalStateStore {
  return new GoalStateStore(initialState);
}

