import type { Capability, RuntimeAction } from '@lumina/contracts';
import type { LuminaTool, ExecutionContext, ToolResult } from '../tool.interface.js';

export class NavigateTool implements LuminaTool {
  readonly name = 'navigate';
  readonly capability: Capability = 'navigate-page';

  async execute(action: RuntimeAction, context: ExecutionContext): Promise<ToolResult> {
    const start = Date.now();
    const url = typeof action.payload === 'string' ? action.payload : '';
    if (!url) {
      return { success: false, actionId: action.actionId, durationMs: 0, error: 'No URL payload provided for navigation' };
    }

    try {
      if (!context.dryRun) {
        await context.adapter.navigate(url);
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
