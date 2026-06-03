import type { Capability, RuntimeAction } from '@lumina/contracts';
import type { LuminaTool, ExecutionContext, ToolResult } from '../tool.interface.js';

export class SubmitProofTool implements LuminaTool {
  readonly name = 'submit-proof';
  readonly capability: Capability = 'submit-proof';

  async execute(action: RuntimeAction, context: ExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    if (!action.targetNodeId) {
      return { success: false, actionId: action.actionId, durationMs: 0, error: 'No targetNodeId' };
    }

    try {
      if (!context.dryRun) {
        await context.adapter.submit(action.targetNodeId);
      }
      return { success: true, actionId: action.actionId, durationMs: Date.now() - start };
    } catch (err: any) {
      return {
        success: false,
        actionId: action.actionId,
        durationMs: Date.now() - start,
        error: err.message || String(err),
      };
    }
  }
}
