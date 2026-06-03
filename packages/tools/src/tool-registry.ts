import type { Capability, RuntimeAction } from '@lumina/contracts';
import type { LuminaTool, ExecutionContext, ToolResult } from './tool.interface.js';
import { ClickTool } from './tools/click.tool.js';
import { FillInputTool } from './tools/fill-input.tool.js';
import { NavigateTool } from './tools/navigate.tool.js';
import { SubmitProofTool } from './tools/submit-proof.tool.js';

export class ToolRegistry {
  private readonly tools = new Map<Capability, LuminaTool>();

  register(tool: LuminaTool): this {
    this.tools.set(tool.capability, tool);
    return this;
  }

  unregister(capability: Capability): void {
    this.tools.delete(capability);
  }

  get(capability: Capability): LuminaTool | undefined {
    return this.tools.get(capability);
  }

  has(capability: Capability): boolean {
    return this.tools.has(capability);
  }

  getAll(): LuminaTool[] {
    return Array.from(this.tools.values());
  }

  async execute(
    action: RuntimeAction,
    context: ExecutionContext,
  ): Promise<ToolResult> {
    const tool = this.get(action.capability);
    if (!tool) {
      return {
        success: false,
        actionId: action.actionId,
        durationMs: 0,
        error: `No tool registered for capability: ${action.capability}`,
      };
    }

    if (tool.validate) {
      const validation = tool.validate(action);
      if (!validation.valid) {
        return {
          success: false,
          actionId: action.actionId,
          durationMs: 0,
          error: `Validation failed: ${validation.reason}`,
        };
      }
    }

    return tool.execute(action, context);
  }

  static createDefault(): ToolRegistry {
    const registry = new ToolRegistry();
    registry.register(new ClickTool());
    registry.register(new FillInputTool());
    registry.register(new NavigateTool());
    registry.register(new SubmitProofTool());
    return registry;
  }
}

export const globalToolRegistry = ToolRegistry.createDefault();
