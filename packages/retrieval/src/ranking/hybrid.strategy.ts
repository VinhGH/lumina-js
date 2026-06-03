import type { InteractiveNode } from '@lumina/contracts';
import type { RankingStrategy, RankedNode, RankingOptions } from './ranking-strategy.interface.js';
import { BM25Strategy } from './bm25.strategy.js';
import { FuseStrategy } from './fuse.strategy.js';

export class HybridStrategy implements RankingStrategy {
  readonly name = 'hybrid';

  constructor(
    private readonly bm25 = new BM25Strategy(),
    private readonly fuse = new FuseStrategy(),
    private readonly weights = { bm25: 0.6, fuse: 0.4 },
  ) {}

  rank(nodes: InteractiveNode[], intent: string, options?: RankingOptions): RankedNode[] {
    if (!intent.trim()) return [];

    const bm25Results = this.bm25.rank(nodes, intent, options);
    const fuseResults = this.fuse.rank(nodes, intent, options);

    const scoreMap = new Map<string, { node: InteractiveNode; bm25Score: number; fuseScore: number }>();

    // Khởi tạo map với các node
    nodes.forEach((node) => {
      scoreMap.set(node.luminaId, { node, bm25Score: 0, fuseScore: 0 }); // mặc định fuseScore = 0 vì đã invert (1 - score)
    });

    bm25Results.forEach((res) => {
      const data = scoreMap.get(res.luminaId);
      if (data) data.bm25Score = res.score;
    });

    fuseResults.forEach((res) => {
      const data = scoreMap.get(res.luminaId);
      if (data) data.fuseScore = res.score;
    });

    // Chỉ giữ lại những node có match từ ít nhất 1 bên
    const matchedNodes: RankedNode[] = [];
    const matchedIds = new Set<string>([
      ...bm25Results.map((r) => r.luminaId),
      ...fuseResults.map((r) => r.luminaId),
    ]);

    matchedIds.forEach((id) => {
      const data = scoreMap.get(id);
      if (data) {
        const combinedScore =
          this.weights.bm25 * data.bm25Score +
          this.weights.fuse * data.fuseScore;

        matchedNodes.push({
          ...data.node,
          score: Math.max(0, Math.min(1, combinedScore)),
        });
      }
    });

    return matchedNodes.sort((a, b) => b.score - a.score);
  }

  static createDefault(): HybridStrategy {
    return new HybridStrategy();
  }
}
