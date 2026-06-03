import type {
  NodeFingerprint,
  InteractiveNode,
  SIRResult,
  WorkflowDefinition,
} from '@lumina/contracts';
import { type ScanAdapter, DOMScanAdapter, resetLuminaCounter } from '@lumina/adapters';
import type { RankingStrategy } from './ranking/ranking-strategy.interface.js';
import { HybridStrategy } from './ranking/hybrid.strategy.js';
import { NodeRegistry } from './node-registry.js';
import { InteractionGraph } from './interaction-graph.js';

export interface SIROptions {
  topK?: number;
  workflowDef?: WorkflowDefinition;
  root?: unknown;
  clearRegistryBeforeScan?: boolean;
  scanAdapter?: ScanAdapter;
  rankingStrategy?: RankingStrategy;
}

export class SIRPipeline {
  private readonly registry: NodeRegistry;

  constructor(
    private readonly graph?: InteractionGraph,
    private readonly scanAdapter: ScanAdapter = new DOMScanAdapter(),
    private readonly rankingStrategy: RankingStrategy = HybridStrategy.createDefault(),
  ) {
    this.registry = new NodeRegistry();
  }

  async run(intent: string, options: SIROptions = {}): Promise<SIRResult> {
    const {
      topK = 5,
      workflowDef,
      root,
      clearRegistryBeforeScan = true,
      scanAdapter: activeScanAdapter = this.scanAdapter,
      rankingStrategy: activeRankingStrategy = this.rankingStrategy,
    } = options;

    const overallStart = performance.now();

    // ─── Stage 1: Scouter ────────────────────────────────────────────────────
    if (clearRegistryBeforeScan) {
      this.registry.clear();
      resetLuminaCounter();
    }

    const scouterStart = performance.now();
    const scoutResult = await activeScanAdapter.scan(root);
    const scouterMs = performance.now() - scouterStart;

    this.registry.register(scoutResult.nodes);

    // ─── Stage 2: Intent Matching ─────────────────────────────────────────────
    const intentStart = performance.now();
    const allNodes = this.registry.getAll();
    const matchCandidates = activeRankingStrategy.rank(allNodes, intent, {
      topK: Math.min(topK * 3, allNodes.length),
    });

    const matchCandidatesWithScore = matchCandidates.map((c) => ({
      ...c,
      matchScore: c.score,
    }));
    const intentMs = performance.now() - intentStart;

    // ─── Stage 3: Graph Ranking ──────────────────────────────────────────────
    const graphStart = performance.now();
    const activeGraph =
      this.graph ??
      (workflowDef ? new InteractionGraph(workflowDef) : new InteractionGraph());

    const rankedNodes = activeGraph.rank(matchCandidatesWithScore);
    const graphMs = performance.now() - graphStart;

    // ─── Produce fingerprints (LLM-safe output) ───────────────────────────────
    const topNodes = rankedNodes
      .slice(0, topK)
      .map((node, index) => this.toFingerprint(node, index + 1));

    return {
      topNodes,
      intent,
      timestamp: Date.now(),
      stagesMs: {
        scouter: Math.round(scouterMs * 100) / 100,
        intentMatch: Math.round(intentMs * 100) / 100,
        graphRank: Math.round(graphMs * 100) / 100,
      },
    };
  }

  private toFingerprint(node: InteractiveNode, rank: number): NodeFingerprint {
    const rawScore = node.finalScore ?? node.matchScore ?? 0;
    const score = Math.max(0, Math.min(1, rawScore));

    return {
      luminaId: node.luminaId,
      tag: node.tag,
      label: node.label,
      role: node.role,
      capability: node.capability ?? 'read-dom',
      state: node.state,
      semanticType: node.semanticType,
      metadata: node.metadata,
      score,
    };
  }
}

export function createSIRPipeline(options?: {
  workflowDef?: WorkflowDefinition;
  scanAdapter?: ScanAdapter;
  rankingStrategy?: RankingStrategy;
}): SIRPipeline {
  const graph = options?.workflowDef
    ? new InteractionGraph(options.workflowDef)
    : new InteractionGraph();

  return new SIRPipeline(graph, options?.scanAdapter, options?.rankingStrategy);
}

