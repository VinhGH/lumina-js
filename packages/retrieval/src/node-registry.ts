import type { InteractiveNode, WorkflowStateId } from '@lumina/contracts';

export class NodeRegistry {
  private readonly index = new Map<string, InteractiveNode>();

  register(nodes: InteractiveNode[]): void {
    for (const node of nodes) {
      this.index.set(node.luminaId, node);
    }
  }

  get(luminaId: string): InteractiveNode | undefined {
    return this.index.get(luminaId);
  }

  getAll(): InteractiveNode[] {
    return Array.from(this.index.values());
  }

  findByWorkflowState(state: WorkflowStateId): InteractiveNode[] {
    const results: InteractiveNode[] = [];
    for (const node of this.index.values()) {
      if (node.state === state) {
        results.push(node);
      }
    }
    return results;
  }

  clear(): void {
    this.index.clear();
  }

  size(): number {
    return this.index.size;
  }
}

export const globalRegistry = new NodeRegistry();

