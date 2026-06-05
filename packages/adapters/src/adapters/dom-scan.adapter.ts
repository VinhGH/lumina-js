import type { Capability, ScoutResult, SemanticType, InteractiveNode } from '@lumina/contracts';
import type { ScanAdapter } from '../scan-adapter.interface.js';

let _luminaCounter = 0;

export function resetLuminaCounter(): void {
  _luminaCounter = 0;
}

export class DOMScanAdapter implements ScanAdapter {
  private static readonly INTERACTIVE_SELECTORS = [
    'button',
    'a',
    'input',
    'select',
    'textarea',
    '[role="button"]',
    '[role="link"]',
    '[role="textbox"]',
    '[contenteditable="true"]',
    '[data-lumina-state]',
  ] as const;

  async scan(root?: unknown): Promise<ScoutResult> {
    const startAt = Date.now();
    const rootEl = (root as Element) ?? (typeof document !== 'undefined' ? document.body : null);
    
    if (!rootEl) {
      throw new Error('[DOMScanAdapter] No DOM available. Pass a root element.');
    }

    const interactiveSelector = DOMScanAdapter.INTERACTIVE_SELECTORS.join(', ');
    const candidates = Array.from(rootEl.querySelectorAll(interactiveSelector));
    const totalDomNodes = this.countDomNodes(rootEl);
    const nodes: InteractiveNode[] = [];

    for (const el of candidates) {
      if (!this.isVisible(el)) {
        continue;
      }
      if (el.closest('aside')) {
        continue;
      }

      const luminaId = `lumina-${++_luminaCounter}`;
      this.stampId(el, luminaId);

      const tag = el.tagName.toLowerCase();
      const label = this.extractLabel(el);
      const role = this.inferRole(el);
      const capability = this.inferCapability(el);
      const attributes = this.getEssentialAttributes(el);
      const state = el.getAttribute('data-lumina-state') ?? undefined;
      const semanticType = this.extractSemanticType(el);

      const node: InteractiveNode = {
        luminaId,
        tag,
        label,
        role,
        attributes,
        capability,
        state,
        semanticType,
      };

      nodes.push(node);
    }

    return {
      nodes,
      timestamp: startAt,
      totalDomNodes,
      interactiveNodes: nodes.length,
    };
  }

  stampId(node: unknown, luminaId: string): void {
    const el = node as any;
    el.setAttribute('data-lumina-id', luminaId);
    el.__lumina_id = luminaId;
  }

  isVisible(node: unknown): boolean {
    const el = node as Element;
    if (typeof window === 'undefined') {
      return true;
    }

    const style = window.getComputedStyle(el);
    if (style.display === 'none') return false;
    if (style.visibility === 'hidden') return false;
    if (style.opacity === '0') return false;

    const rect = el.getBoundingClientRect();
    if (rect.width <= 0) return false;

    return true;
  }

  extractLabel(node: unknown): string {
    const el = node as Element;
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel?.trim()) return ariaLabel.trim();

    const labelledById = el.getAttribute('aria-labelledby');
    if (labelledById && typeof document !== 'undefined') {
      const labelEl = document.getElementById(labelledById);
      if (labelEl?.textContent?.trim()) {
        return labelEl.textContent.trim();
      }
    }

    const placeholder = el.getAttribute('placeholder');
    if (placeholder?.trim()) return placeholder.trim();

    const alt = el.getAttribute('alt');
    if (alt?.trim()) return alt.trim();

    const title = el.getAttribute('title');
    if (title?.trim()) return title.trim();

    const value = el.getAttribute('value');
    if (value?.trim()) return value.trim();

    const text = (el as HTMLElement).innerText?.trim();
    if (text) return text.slice(0, 120);

    return el.tagName.toLowerCase();
  }

  extractSemanticType(node: unknown): SemanticType | undefined {
    const el = node as Element;
    const semantic = el.getAttribute('data-lumina-semantic');
    return semantic ? (semantic as SemanticType) : undefined;
  }

  private countDomNodes(root: Element): number {
    let count = 0;
    const stack: Element[] = [root];
    while (stack.length > 0) {
      const el = stack.pop()!;
      count++;
      for (const child of Array.from(el.children)) {
        stack.push(child);
      }
    }
    return count;
  }

  private inferRole(el: Element): string {
    const explicitRole = el.getAttribute('role');
    if (explicitRole?.trim()) return explicitRole.trim();

    const tag = el.tagName.toLowerCase();
    const typeAttr = el.getAttribute('type')?.toLowerCase() ?? '';

    switch (tag) {
      case 'button': return 'button';
      case 'a': return 'link';
      case 'input': {
        if (typeAttr === 'checkbox') return 'checkbox';
        if (typeAttr === 'radio') return 'radio';
        if (typeAttr === 'submit' || typeAttr === 'button') return 'button';
        return 'textbox';
      }
      case 'select': return 'combobox';
      case 'textarea': return 'textbox';
      default:
        if (el.getAttribute('contenteditable') === 'true') return 'textbox';
        return 'generic';
    }
  }

  private inferCapability(el: Element): Capability {
    const tag = el.tagName.toLowerCase();
    const role = el.getAttribute('role')?.toLowerCase() ?? '';
    const isContentEditable = el.getAttribute('contenteditable') === 'true';

    if (tag === 'input' || tag === 'textarea' || tag === 'select' || isContentEditable) {
      return 'fill-input';
    }

    if (tag === 'button' || role === 'button') {
      const label = this.extractLabel(el).toLowerCase();
      if (label.includes('submit') || label.includes('proof')) {
        return 'submit-proof';
      }
      return 'click';
    }

    if (tag === 'a' || role === 'link') {
      return 'navigate-page';
    }

    if (el.hasAttribute('data-lumina-state')) {
      return 'click';
    }

    return 'read-dom';
  }

  private getEssentialAttributes(el: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    const allowList = [
      'type',
      'name',
      'href',
      'role',
      'aria-label',
      'aria-labelledby',
      'aria-disabled',
      'aria-expanded',
      'aria-haspopup',
      'aria-selected',
      'aria-checked',
      'placeholder',
      'disabled',
      'readonly',
      'required',
      'tabindex',
      'data-lumina-state',
      'data-lumina-semantic',
      'data-lumina-id',
      'alt',
      'title',
      'value',
      'for',
      'inputmode',
      'autocomplete',
    ];

    for (const attr of allowList) {
      const val = el.getAttribute(attr);
      if (val !== null) {
        attrs[attr] = val;
      }
    }

    return attrs;
  }
}
