import type { ExecutionAdapter } from '../execution-adapter.interface.js';

export class DOMExecutionAdapter implements ExecutionAdapter {
  private getElement(luminaId: string): Element {
    // 1. Try property and attribute search first across all elements
    const all = document.querySelectorAll('*');
    for (const el of Array.from(all)) {
      if ((el as any).__lumina_id === luminaId || el.getAttribute('data-lumina-id') === luminaId) {
        return el;
      }
    }

    // 2. Try data-lumina-semantic as fallback
    const semanticEl = document.querySelector(`[data-lumina-semantic="${luminaId}"]`);
    if (semanticEl) return semanticEl;

    throw new Error(`[DOMExecutionAdapter] Node not found: ${luminaId}`);
  }

  async click(luminaId: string): Promise<void> {
    (this.getElement(luminaId) as HTMLElement).click();
  }

  async fill(luminaId: string, value: string): Promise<void> {
    const el = this.getElement(luminaId) as HTMLInputElement | HTMLTextAreaElement;

    // React tracks input value via its own internal fiber.
    // Setting el.value directly bypasses React's onChange handler.
    // We must use the native input value setter to properly trigger React's
    // synthetic event system and update useState.
    const prototype = el.tagName === 'TEXTAREA'
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;

    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      prototype,
      'value'
    )?.set;

    if (nativeInputValueSetter) {
      nativeInputValueSetter.call(el, value);
    } else {
      el.value = value;
    }

    // Dispatch both input and change events — React listens to both
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
    const el =
      document.querySelector(`[data-lumina-id="${luminaId}"]`) ??
      document.querySelector(`[data-lumina-semantic="${luminaId}"]`);
    return el !== null;
  }
}

export const defaultExecutionAdapter = new DOMExecutionAdapter();
