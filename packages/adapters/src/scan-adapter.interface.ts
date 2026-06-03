import type { ScoutResult, SemanticType } from '@lumina/contracts';

/**
 * ScanAdapter — reads interactive nodes from the current view.
 * Used by Scouter/SIRPipeline. Framework-agnostic.
 */
export interface ScanAdapter {
  /** Discover all interactive nodes in the view */
  scan(root?: unknown): Promise<ScoutResult>;
  /** Stamp stable lumina ID onto a node */
  stampId(node: unknown, luminaId: string): void;
  /** Check if a node is visible to the user */
  isVisible(node: unknown): boolean;
  /** Extract human-readable label */
  extractLabel(node: unknown): string;
  /** Extract semantic type from node attributes */
  extractSemanticType(node: unknown): SemanticType | undefined;
}
