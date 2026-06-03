import Fuse from 'fuse.js';
import type { InteractiveNode } from '@lumina/contracts';
import type { RankingStrategy, RankedNode, RankingOptions } from './ranking-strategy.interface.js';

export class FuseStrategy implements RankingStrategy {
  readonly name = 'fuse';

  rank(nodes: InteractiveNode[], intent: string, options?: RankingOptions): RankedNode[] {
    if (!intent.trim()) return [];

    const fuse = new Fuse(nodes, {
      keys: [
        { name: 'label', weight: 0.7 },
        { name: 'role', weight: 0.2 },
        { name: 'state', weight: 0.1 },
      ],
      threshold: 0.4,
      includeScore: true,
      shouldSort: true,
      ignoreLocation: true,
      minMatchCharLength: 2,
    });

    const fuseResults = fuse.search(intent);

    return fuseResults
      .map((res) => {
        // Invert score: 0 (perfect match) -> 1 (perfect score), 1 (no match) -> 0 (no score)
        const score = 1 - (res.score ?? 1);
        return {
          ...res.item,
          score,
        };
      })
      .sort((a, b) => b.score - a.score);
  }
}
