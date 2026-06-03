import { describe, it, expect } from 'vitest';
import type { ExecutionAdapter } from '@lumina/adapters';
import type { RuntimeAction } from '@lumina/contracts';
import { ClickTool, FillInputTool, NavigateTool, ToolRegistry } from '@lumina/tools';
import { mockSecurityContext } from './fixtures/workflow.fixtures.js';

class FakeExecutionAdapter implements ExecutionAdapter {
  calls: Array<{ method: string; args: any[] }> = [];

  async click(luminaId: string): Promise<void> {
    this.calls.push({ method: 'click', args: [luminaId] });
  }

  async fill(luminaId: string, value: string): Promise<void> {
    this.calls.push({ method: 'fill', args: [luminaId, value] });
  }

  async navigate(path: string): Promise<void> {
    this.calls.push({ method: 'navigate', args: [path] });
  }

  async submit(luminaId: string): Promise<void> {
    this.calls.push({ method: 'submit', args: [luminaId] });
  }

  async read(luminaId: string): Promise<string> {
    this.calls.push({ method: 'read', args: [luminaId] });
    return 'mocked-text';
  }

  async exists(luminaId: string): Promise<boolean> {
    this.calls.push({ method: 'exists', args: [luminaId] });
    return true;
  }
}

describe('Tool Runtime Contract Verification', () => {
  it('ClickTool must interact with the DOM ONLY through the ExecutionAdapter', async () => {
    const adapter = new FakeExecutionAdapter();
    const tool = new ClickTool();
    const action: RuntimeAction = {
      actionId: 'action-1',
      type: 'click',
      targetNodeId: 'btn-submit',
      capability: 'click',
      timestamp: Date.now(),
    };

    const context = {
      security: mockSecurityContext,
      adapter,
    };

    const result = await tool.execute(action, context);
    expect(result.success).toBe(true);

    // Verify DOM interaction redirected to adapter
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0]).toEqual({
      method: 'click',
      args: ['btn-submit'],
    });
  });

  it('FillInputTool must interact with the DOM ONLY through the ExecutionAdapter', async () => {
    const adapter = new FakeExecutionAdapter();
    const tool = new FillInputTool();
    const action: RuntimeAction = {
      actionId: 'action-2',
      type: 'fill-input',
      targetNodeId: 'input-email',
      payload: 'test@lumina.ai',
      capability: 'fill-input',
      timestamp: Date.now(),
    };

    const context = {
      security: mockSecurityContext,
      adapter,
    };

    const result = await tool.execute(action, context);
    expect(result.success).toBe(true);

    // Verify DOM interaction redirected to adapter
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0]).toEqual({
      method: 'fill',
      args: ['input-email', 'test@lumina.ai'],
    });
  });

  it('NavigateTool must interact with the DOM ONLY through the ExecutionAdapter', async () => {
    const adapter = new FakeExecutionAdapter();
    const tool = new NavigateTool();
    const action: RuntimeAction = {
      actionId: 'action-3',
      type: 'navigate',
      targetNodeId: 'window',
      payload: '/dashboard',
      capability: 'navigate-page',
      timestamp: Date.now(),
    };

    const context = {
      security: mockSecurityContext,
      adapter,
    };

    const result = await tool.execute(action, context);
    expect(result.success).toBe(true);

    // Verify DOM interaction redirected to adapter
    expect(adapter.calls).toHaveLength(1);
    expect(adapter.calls[0]).toEqual({
      method: 'navigate',
      args: ['/dashboard'],
    });
  });
});
