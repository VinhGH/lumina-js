// packages/retrieval/src/interaction-graph.ts
// Stage 3: Graph Ranking — Canonical workflow topology + Adaptive usage frequency.
// Applies logarithmic boost to candidates based on observed transitions.

import type { InteractiveNode, WorkflowDefinition } from '@lumina/contracts';

/**
 * A directed edge in the interaction graph.
 * `weight` reflects the normalized edge strength (0–1).
 */
export type GraphEdge = {
  from: string;
  to: string;
  weight: number;
};

/**
 * InteractionGraph — Stage 3 of the SIR pipeline.
 *
 * Maintains two complementary data structures:
 *
 * 1. **Canonical Graph** — built from `WorkflowDefinition.edges`, gives a
 *    structural prior on which transitions are expected.
 *
 * 2. **Adaptive Graph** — built from observed runtime transitions recorded via
 *    `recordTransition()`, reflects actual user behaviour.
 *
 * The `rank()` method applies a logarithmic topology boost to candidate nodes:
 * ```
 * finalScore = algorithmicScore × (1 + min(log10(count + 1) × 0.1, 0.3))
 * ```
 * where `count` is the total incoming + outgoing transition count for the node.
 */
export class InteractionGraph {
  /** Canonical edges derived from WorkflowDefinition */
  private readonly canonicalEdges: GraphEdge[] = [];

  /**
   * Adaptive transition counter: luminaId → count of times this node was
   * involved in a recorded transition (as source or destination).
   */
  private readonly transitionCounts = new Map<string, number>();

  /**
   * @param workflowDef - Optional workflow definition used to prime the
   *   canonical graph. When provided, edges provide a structural prior.
   */
  constructor(workflowDef?: WorkflowDefinition) {
    if (workflowDef) {
      this.buildCanonicalGraph(workflowDef);
    }
  }

  /**
   * Records an observed runtime transition between two DOM nodes.
   *
   * Both the `from` and `to` nodes receive an increment in their transition
   * count, which is used by `rank()` to compute the topology boost.
   *
   * @param fromLuminaId - The lumina ID of the source node.
   * @param toLuminaId - The lumina ID of the destination node.
   */
  recordTransition(fromLuminaId: string, toLuminaId: string): void {
    this.incrementCount(fromLuminaId);
    this.incrementCount(toLuminaId);

    // Also record in adaptive edges for potential future graph-query use
    this.canonicalEdges.push({
      from: fromLuminaId,
      to: toLuminaId,
      weight: 1,
    });
  }

  /**
   * Applies logarithmic topology boost to a list of candidate InteractiveNodes.
   *
   * Formula:
   * ```
   * finalScore = algorithmicScore × (1 + min(log10(count + 1) × 0.1, 0.3))
   * ```
   * - `algorithmicScore` = node.matchScore ?? node.finalScore ?? 0
   * - `count` = total transitions involving this node (from + to)
   * - The boost is capped at +30% to prevent over-amplification
   *
   * Nodes with no recorded transitions receive a boost of 0 (multiplier = 1.0).
   *
   * @param candidates - Nodes to re-rank, typically from IntentMatcher output.
   * @returns The same nodes with `topologyScore` and `finalScore` set, sorted
   *   by `finalScore` descending.
   */
  rank(candidates: InteractiveNode[]): InteractiveNode[] {
    const ranked = candidates.map((node) => {
      const algorithmicScore = node.matchScore ?? node.finalScore ?? 0;
      const count = this.getTransitionCount(node.luminaId);

      // log10(count + 1) gives 0 when count=0, ~0.301 when count=1, etc.
      const boost = Math.min(Math.log10(count + 1) * 0.1, 0.3);
      const topologyScore = boost;
      const finalScore = algorithmicScore * (1 + boost);

      return {
        ...node,
        topologyScore,
        finalScore,
      };
    });

    // Sort descending by finalScore
    ranked.sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0));

    return ranked;
  }

  /**
   * Returns the total number of recorded transitions involving a given node
   * (both as source and as destination).
   *
   * @param luminaId - The node to query.
   * @returns Transition count, or 0 if none recorded.
   */
  getTransitionCount(luminaId: string): number {
    return this.transitionCounts.get(luminaId) ?? 0;
  }

  /**
   * Returns all edges currently stored in the graph (canonical + adaptive).
   * Useful for debugging and visualization.
   */
  getEdges(): ReadonlyArray<GraphEdge> {
    return this.canonicalEdges;
  }

  // ─── Private helpers ─────────────────────────────────────────────────────────

  /**
   * Builds canonical edges from a WorkflowDefinition.
   * Each workflow edge [fromId, toId] is recorded as a graph edge with
   * a unit weight. These are structural priors, not usage counts.
   */
  private buildCanonicalGraph(workflowDef: WorkflowDefinition): void {
    if (workflowDef.transitions) {
      for (const t of workflowDef.transitions) {
        this.canonicalEdges.push({ from: t.from, to: t.to, weight: 1 });
      }
    }
  }

  /** Increments the transition count for a node. */
  private incrementCount(luminaId: string): void {
    const current = this.transitionCounts.get(luminaId) ?? 0;
    this.transitionCounts.set(luminaId, current + 1);
  }
}
