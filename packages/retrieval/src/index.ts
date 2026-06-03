// packages/retrieval/src/index.ts
// Barrel export for @lumina/retrieval
// Semantic Interaction Retrieval (SIR) pipeline — Stage 1, 2, and 3.

// ─── Stage 1: DOM Scouter ─────────────────────────────────────────────────────
export { LuminaScouter, resetLuminaCounter } from './scouter.js';

// ─── Node Registry ────────────────────────────────────────────────────────────
export { NodeRegistry, globalRegistry } from './node-registry.js';

// ─── Stage 2: Intent Matcher & Pluggable Strategies ──────────────────────────
export { IntentMatcher } from './intent-matcher.js';
export type { RankingStrategy, RankedNode, RankingOptions } from './ranking/ranking-strategy.interface.js';
export { BM25Strategy } from './ranking/bm25.strategy.js';
export { FuseStrategy } from './ranking/fuse.strategy.js';
export { HybridStrategy } from './ranking/hybrid.strategy.js';
export { EmbeddingStrategy } from './ranking/embedding.strategy.js';

// ─── Stage 3: Interaction Graph ───────────────────────────────────────────────
export { InteractionGraph } from './interaction-graph.js';
export type { GraphEdge } from './interaction-graph.js';

// ─── SIR Pipeline Orchestrator ────────────────────────────────────────────────
export { SIRPipeline, createSIRPipeline } from './sir-pipeline.js';
export type { SIROptions } from './sir-pipeline.js';
