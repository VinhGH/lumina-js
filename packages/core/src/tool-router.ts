import type { RuntimeAction, ActionResult, SecurityContext, WorkflowState } from '@lumina/contracts';
import { type ExecutionAdapter, defaultExecutionAdapter } from '@lumina/adapters';
import { type ToolRegistry, globalToolRegistry } from '@lumina/tools';

/**
 * ToolRouter — delegates execution of pre-approved RuntimeActions
 * to specialized tools in the ToolRegistry using an ExecutionAdapter.
 */
export class ToolRouter {
  constructor(
    private readonly registry: ToolRegistry = globalToolRegistry,
    private readonly adapter: ExecutionAdapter = defaultExecutionAdapter,
  ) {}

  /**
   * Executes a proposed action within security and workflow context.
   */
  async execute(
    action: RuntimeAction,
    securityContext: SecurityContext,
    workflowState?: WorkflowState,
    dryRun?: boolean,
  ): Promise<ActionResult> {
    try {
      const toolResult = await this.registry.execute(action, {
        security: securityContext,
        workflowState,
        adapter: this.adapter,
        dryRun,
      });

      return {
        actionId: action.actionId,
        success: toolResult.success,
        error: toolResult.error,
        timestamp: Date.now(),
      };
    } catch (err: any) {
      return {
        actionId: action.actionId,
        success: false,
        error: `[ToolRouter] Execution failed: ${err.message || String(err)}`,
        timestamp: Date.now(),
      };
    }
  }
}

export function createToolRouter(
  registry?: ToolRegistry,
  adapter?: ExecutionAdapter,
): ToolRouter {
  return new ToolRouter(registry, adapter);
}

