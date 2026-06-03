import type { WorkflowDefinition } from '@lumina/contracts';

export class WorkflowRegistry {
  private readonly workflows = new Map<string, WorkflowDefinition>();

  register(def: WorkflowDefinition): this {
    if (this.workflows.has(def.id)) {
      throw new Error(`Workflow with ID '${def.id}' is already registered.`);
    }
    this.workflows.set(def.id, def);
    return this;
  }

  get(id: string): WorkflowDefinition | undefined {
    return this.workflows.get(id);
  }

  has(id: string): boolean {
    return this.workflows.has(id);
  }

  unregister(id: string): void {
    this.workflows.delete(id);
  }

  clear(): void {
    this.workflows.clear();
  }

  getAll(): WorkflowDefinition[] {
    return Array.from(this.workflows.values());
  }
}

export const globalWorkflowRegistry = new WorkflowRegistry();
