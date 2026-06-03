import type { Capability, RuntimeAction } from '@lumina/contracts';
import type { LuminaTool, ExecutionContext, ToolResult } from '../tool.interface.js';

export class FillInputTool implements LuminaTool {
  readonly name = 'fill-input';
  readonly capability: Capability = 'fill-input';

  async execute(action: RuntimeAction, context: ExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    if (!action.targetNodeId) {
      return { success: false, actionId: action.actionId, durationMs: 0, error: 'No targetNodeId' };
    }
    const val = typeof action.payload === 'string' ? action.payload : String(action.payload ?? '');

    try {
      if (!context.dryRun) {
        await context.adapter.fill(action.targetNodeId, val);
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
