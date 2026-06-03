import type { ExecutionAdapter } from '../execution-adapter.interface.js';

export class DOMExecutionAdapter implements ExecutionAdapter {
  private getElement(luminaId: string): Element {
    const el = document.querySelector(`[data-lumina-id="${luminaId}"]`);
    if (!el) throw new Error(`[DOMExecutionAdapter] Node not found: ${luminaId}`);
    return el;
  }

  async click(luminaId: string): Promise<void> {
    (this.getElement(luminaId) as HTMLElement).click();
  }

  async fill(luminaId: string, value: string): Promise<void> {
    const el = this.getElement(luminaId) as HTMLInputElement;
    el.value = value;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  async navigate(path: string): Promise<void> {
    window.location.href = path;
  }

  async submit(luminaId: string): Promise<void> {
    const el = this.getElement(luminaId);
    const form = el.closest('form');
    if (form) {
      form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
      form.submit();
    } else {
      (el as HTMLElement).click();
    }
  }

  async read(luminaId: string): Promise<string> {
    return (this.getElement(luminaId) as HTMLElement).textContent ?? '';
  }

  async exists(luminaId: string): Promise<boolean> {
    const el = document.querySelector(`[data-lumina-id="${luminaId}"]`);
    return el !== null;
  }
}

export const defaultExecutionAdapter = new DOMExecutionAdapter();
