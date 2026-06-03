import type { ExecutionAdapter } from '../execution-adapter.interface.js';

/** PlaywrightExecutionAdapter — for E2E testing with Playwright */
export class PlaywrightExecutionAdapter implements ExecutionAdapter {
  constructor(private readonly page: unknown) {}

  async click(luminaId: string): Promise<void> {
    throw new Error('[PlaywrightExecutionAdapter] Phase 2 — not yet implemented');
  }

  async fill(luminaId: string, value: string): Promise<void> {
    throw new Error('[PlaywrightExecutionAdapter] Phase 2 — not yet implemented');
  }

  async navigate(path: string): Promise<void> {
    throw new Error('[PlaywrightExecutionAdapter] Phase 2 — not yet implemented');
  }

  async submit(luminaId: string): Promise<void> {
    throw new Error('[PlaywrightExecutionAdapter] Phase 2 — not yet implemented');
  }

  async read(luminaId: string): Promise<string> {
    throw new Error('[PlaywrightExecutionAdapter] Phase 2 — not yet implemented');
  }

  async exists(luminaId: string): Promise<boolean> {
    throw new Error('[PlaywrightExecutionAdapter] Phase 2 — not yet implemented');
  }
}
