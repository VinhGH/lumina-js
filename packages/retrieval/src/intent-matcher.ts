import type { InteractiveNode } from '@lumina/contracts';
import { HybridStrategy } from './ranking/hybrid.strategy.js';

export class IntentMatcher {
  private readonly strategy: HybridStrategy;

  constructor(private readonly nodes: InteractiveNode[]) {
    this.strategy = HybridStrategy.createDefault();
  }

  search(intent: string, topK: number = 5): InteractiveNode[] {
    const results = this.strategy.rank(this.nodes, intent, { topK });
    return results.slice(0, topK).map((res) => {
      const node = { ...res } as any;
      delete node.score;
      return {
        ...node,
        matchScore: res.score,
      } as InteractiveNode;
    });
  }
}

