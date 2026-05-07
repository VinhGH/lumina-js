// packages/scouter/src/index.ts

export interface InteractiveElement {
  id: string;
  tag: string;
  label: string;
  role: string;
  attributes: Record<string, string>;
}

export class LuminaScouter {
  // Những thành phần mà AI quan tâm
  private selectors = [
    "button",
    "a",
    "input",
    "select",
    "textarea",
    '[role="button"]',
    '[contenteditable="true"]',
  ].join(",");

  /**
   * Quét toàn bộ trang và trả về danh sách các phần tử có thể tương tác
   */
  public scan(): InteractiveElement[] {
    const elements = document.querySelectorAll(this.selectors);
    const results: InteractiveElement[] = [];

    elements.forEach((el, index) => {
      // Chỉ lấy những phần tử đang hiển thị trên màn hình
      if (this.isVisible(el)) {
        results.push({
          id: `lumina-${index}`,
          tag: el.tagName.toLowerCase(),
          label: this.extractLabel(el),
          role: el.getAttribute("role") || "generic",
          attributes: this.getEssentialAttributes(el),
        });

        // Đánh dấu trực tiếp lên DOM để AI dễ tìm sau này
        el.setAttribute("data-lumina-id", `lumina-${index}`);
      }
    });

    return results;
  }

  private isVisible(el: Element): boolean {
    const style = window.getComputedStyle(el);
    return (
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      style.opacity !== "0"
    );
  }

  private extractLabel(el: Element): string {
    return (
      el.getAttribute("aria-label") ||
      el.getAttribute("placeholder") ||
      (el as HTMLElement).innerText?.trim() ||
      "unlabeled"
    );
  }

  private getEssentialAttributes(el: Element): Record<string, string> {
    const attrs: Record<string, string> = {};
    if (el.hasAttribute("href")) attrs.href = el.getAttribute("href")!;
    if (el.hasAttribute("type")) attrs.type = el.getAttribute("type")!;
    return attrs;
  }
}
