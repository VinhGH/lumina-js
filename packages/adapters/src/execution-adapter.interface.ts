/**
 * ExecutionAdapter — executes actions on the UI layer.
 * Tools ONLY call this — they never touch DOM/window directly.
 *
 * This is the boundary between Lumina logic and UI framework.
 */
export interface ExecutionAdapter {
  /** Click a node by its luminaId */
  click(luminaId: string): Promise<void>;
  /** Fill an input node with a value */
  fill(luminaId: string, value: string): Promise<void>;
  /** Navigate to a path or URL */
  navigate(path: string): Promise<void>;
  /** Submit a form containing the given node */
  submit(luminaId: string): Promise<void>;
  /** Get text content from a node */
  read(luminaId: string): Promise<string>;
  /** Check if a node exists and is visible */
  exists(luminaId: string): Promise<boolean>;
}
