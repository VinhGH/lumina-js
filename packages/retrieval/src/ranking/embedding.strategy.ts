import type { InteractiveNode } from '@lumina/contracts';
import type { RankingStrategy, RankedNode, RankingOptions } from './ranking-strategy.interface.js';

/** EmbeddingStrategy — uses vector similarity for semantic retrieval */
export class EmbeddingStrategy implements RankingStrategy {
  readonly name = 'embedding';
  
  constructor(private readonly embedFn: (text: string) => Promise<number[]>) {}

  rank(nodes: InteractiveNode[], intent: string, options?: RankingOptions): RankedNode[] {
    throw new Error('[EmbeddingStrategy] Phase 2 — not yet implemented');
  }
}
