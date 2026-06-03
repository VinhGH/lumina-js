import type { WorkflowDefinition, WorkflowTransition, StatePolicy, WorkflowStateId } from '@lumina/contracts';

type TupleTransition<T extends string> = readonly [T, T];
type ObjectTransition<T extends string> = { from: T; to: T; condition?: string };

export interface WorkflowInput<T extends string> {
  id: string;
  name: string;
  version?: string;
  states: readonly T[];
  transitions: ReadonlyArray<TupleTransition<T> | ObjectTransition<T>>;
  initialState: T;
  statePolicies?: Partial<Record<T, StatePolicy>>;
  metadata?: Record<string, unknown>;
}

export interface TypedWorkflowDefinition<T extends string> extends Omit<WorkflowDefinition, 'states' | 'initialState'> {
  readonly states: readonly T[];
  readonly initialState: T;
}

/**
 * defineWorkflow<T>() — type-safe workflow DSL.
 * TypeScript infers T from states array. All transitions and statePolicies
 * are compile-time validated against the declared states.
 */
export function defineWorkflow<T extends string>(
  input: WorkflowInput<T>,
): TypedWorkflowDefinition<T> {
  const transitions: WorkflowTransition[] = input.transitions.map((t) => {
    if (Array.isArray(t)) {
      return { from: t[0], to: t[1] };
    }
    const obj = t as ObjectTransition<T>;
    return {
      from: obj.from,
      to: obj.to,
      condition: obj.condition,
    };
  });

  return {
    id: input.id,
    name: input.name,
    version: input.version || '1.0.0',
    states: input.states as unknown as WorkflowStateId[],
    transitions,
    initialState: input.initialState,
    statePolicies: input.statePolicies as Record<WorkflowStateId, StatePolicy> | undefined,
    metadata: input.metadata,
  } as unknown as TypedWorkflowDefinition<T>;
}
