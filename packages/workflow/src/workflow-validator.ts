import type { WorkflowDefinition } from '@lumina/contracts';

export class WorkflowValidator {
  static validate(def: WorkflowDefinition): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!def.id) errors.push('Workflow ID is required.');
    if (!def.name) errors.push('Workflow name is required.');
    if (!def.states || def.states.length === 0) {
      errors.push('Workflow states cannot be empty.');
    }

    const seen = new Set<string>();
    const duplicates: string[] = [];
    if (def.states) {
      def.states.forEach((s) => {
        if (seen.has(s)) {
          duplicates.push(s);
        } else {
          seen.add(s);
        }
      });
    }
    if (duplicates.length > 0) {
      errors.push(`Workflow contains duplicate states: [${duplicates.join(', ')}].`);
    }

    const stateSet = new Set(def.states);

    if (def.initialState && !stateSet.has(def.initialState)) {
      errors.push(`Initial state '${def.initialState}' is not in the states list.`);
    }

    if (def.transitions) {
      def.transitions.forEach((t, i) => {
        if (!stateSet.has(t.from)) {
          errors.push(`Transition [index ${i}] references invalid source state '${t.from}'.`);
        }
        if (!stateSet.has(t.to)) {
          errors.push(`Transition [index ${i}] references invalid target state '${t.to}'.`);
        }
      });
    }

    // Check for unreachable (orphan) states
    if (def.initialState && stateSet.has(def.initialState) && def.states && def.states.length > 0) {
      const visited = new Set<string>([def.initialState]);
      const queue = [def.initialState];
      const transitionMap: Record<string, string[]> = {};
      def.states.forEach((s) => {
        transitionMap[s] = [];
      });
      if (def.transitions) {
        def.transitions.forEach((t) => {
          if (transitionMap[t.from]) {
            transitionMap[t.from].push(t.to);
          }
        });
      }

      while (queue.length > 0) {
        const current = queue.shift()!;
        const nextStates = transitionMap[current] || [];
        for (const next of nextStates) {
          if (!visited.has(next)) {
            visited.add(next);
            queue.push(next);
          }
        }
      }

      const unreachable: string[] = [];
      def.states.forEach((s) => {
        if (!visited.has(s)) {
          unreachable.push(s);
        }
      });

      if (unreachable.length > 0) {
        errors.push(`Workflow contains unreachable (orphan) states: [${unreachable.join(', ')}].`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
