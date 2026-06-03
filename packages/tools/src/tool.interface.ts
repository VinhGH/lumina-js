import type { Capability, RuntimeAction, WorkflowState, SecurityContext } from '@lumina/contracts';
import type { ExecutionAdapter } from '@lumina/adapters';

export type ToolResult = {
  success: boolean;
  actionId: string;
  durationMs: number;
  error?: string;
  output?: unknown;
};

export type ExecutionContext = {
  security: SecurityContext;
  workflowState?: WorkflowState;
  adapter: ExecutionAdapter;
  dryRun?: boolean;
};

export interface LuminaTool {
  readonly name: string;
  readonly capability: Capability;
  validate?(action: RuntimeAction): { valid: boolean; reason?: string };
  execute(action: RuntimeAction, context: ExecutionContext): Promise<ToolResult>;
}
