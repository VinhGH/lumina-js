import MiniSearch from 'minisearch';
import type { InteractiveNode } from '@lumina/contracts';
import type { RankingStrategy, RankedNode, RankingOptions } from './ranking-strategy.interface.js';

interface SearchDocument {
  id: string;
  label: string;
  tag: string;
  role: string;
  state: string;
}

export class BM25Strategy implements RankingStrategy {
  readonly name = 'bm25';

  rank(nodes: InteractiveNode[], intent: string, options?: RankingOptions): RankedNode[] {
    if (!intent.trim()) return [];

    const ms = new MiniSearch<SearchDocument>({
      fields: ['label', 'tag', 'role', 'state'],
      idField: 'id',
      searchOptions: {
        boost: { label: 2 },
        fuzzy: 0.2,
        prefix: true,
      },
      tokenize: (text) =>
        text
          .toLowerCase()
          .split(/[\s\-_/|()[\],.]+/)
          .filter(Boolean),
      processTerm: (term) => term.toLowerCase(),
    });

    const docs: SearchDocument[] = nodes.map((node) => ({
      id: node.luminaId,
      label: node.label ?? '',
      tag: node.tag ?? '',
      role: node.role ?? '',
      state: node.state ?? '',
    }));

    ms.addAll(docs);

    const miniResults = ms.search(intent, {
      prefix: true,
      fuzzy: 0.2,
      boost: { label: 2 },
      combineWith: 'OR',
    });

    const maxMiniScore = miniResults.length > 0
      ? Math.max(...miniResults.map((r) => r.score))
      : 1;

    const nodeMap = new Map<string, InteractiveNode>();
    nodes.forEach((n) => nodeMap.set(n.luminaId, n));

    const ranked: RankedNode[] = miniResults
      .map((res) => {
        const node = nodeMap.get(res.id);
        if (!node) return null;
        return {
          ...node,
          score: res.score / (maxMiniScore || 1),
        };
      })
      .filter((n): n is RankedNode => n !== null);

    // Sắp xếp theo score giảm dần
    return ranked.sort((a, b) => b.score - a.score);
  }
}
