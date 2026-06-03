import type { WorkflowDefinition, WorkflowStateId } from '@lumina/contracts';

export class WorkflowGraph {
  private readonly adjacencyList = new Map<WorkflowStateId, Set<WorkflowStateId>>();

  constructor(private readonly def: WorkflowDefinition) {
    def.states.forEach((s) => {
      this.adjacencyList.set(s, new Set());
    });

    def.transitions.forEach((t) => {
      const fromNeighbors = this.adjacencyList.get(t.from);
      if (fromNeighbors) {
        fromNeighbors.add(t.to);
      }
    });
  }

  getNextStates(stateId: WorkflowStateId): WorkflowStateId[] {
    const neighbors = this.adjacencyList.get(stateId);
    return neighbors ? Array.from(neighbors) : [];
  }

  isValidTransition(from: WorkflowStateId, to: WorkflowStateId): boolean {
    const neighbors = this.adjacencyList.get(from);
    return neighbors ? neighbors.has(to) : false;
  }

  toTransitionMap(): Record<WorkflowStateId, WorkflowStateId[]> {
    const map: Record<WorkflowStateId, WorkflowStateId[]> = {};
    for (const [state, neighbors] of this.adjacencyList.entries()) {
      map[state] = Array.from(neighbors);
    }
    return map;
  }

  getDefinition(): WorkflowDefinition {
    return this.def;
  }
}
