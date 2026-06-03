import type { InteractiveNode, WorkflowStateId } from '@lumina/contracts';

export type RankedNode = InteractiveNode & { score: number };

export interface RankingOptions {
  topK?: number;
  workflowState?: WorkflowStateId;
}

/**
 * RankingStrategy — pluggable ranking algorithm for SIR pipeline.
 */
export interface RankingStrategy {
  readonly name: string;
  rank(nodes: InteractiveNode[], intent: string, options?: RankingOptions): RankedNode[];
}
