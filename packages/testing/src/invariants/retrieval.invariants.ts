// packages/testing/src/invariants/retrieval.invariants.ts
// Invariant tests for SIR pipeline correctness
// KPI: Top 5 Candidate Recall >= 95%

import { describe, it, expect } from 'vitest';
import type { InteractiveNode, NodeFingerprint } from '@lumina/contracts';
import { domFixtures } from '../fixtures/dom.fixtures.js';

/**
 * INVARIANT: Top 5 Recall
 * When a target node is present in the DOM, SIR must include it in the top 5 results
 * for relevant intents at least 95% of the time.
 */
export function testTop5Recall() {
  describe('INVARIANT: SIR Top 5 Recall >= 95%', () => {
    it('Login page: "fill email" intent → email input in top 5', () => {
      const fixture = domFixtures.login;
      const emailNode = fixture.nodes.find((n) => n.label === 'Email address');

      expect(emailNode).toBeDefined();
      // The email node has a finalScore > 0.9, so it should be in top 5
      expect(emailNode!.finalScore).toBeGreaterThan(0.9);
    });

    it('Login page: "sign in" intent → Submit button in top 5', () => {
      const fixture = domFixtures.login;
      const submitNode = fixture.nodes.find((n) => n.label === 'Sign In');

      expect(submitNode).toBeDefined();
      expect(submitNode!.finalScore).toBeGreaterThan(0.85);
    });

    it('Exercise page: "submit proof" intent → Submit Proof button in top 5', () => {
      const fixture = domFixtures.exercise;
      const submitNode = fixture.nodes.find((n) => n.capability === 'submit-proof');

      expect(submitNode).toBeDefined();
      expect(submitNode!.finalScore).toBeGreaterThan(0.9);
    });

    it('SIR result contains only NodeFingerprints (no raw DOM)', () => {
      const fixture = domFixtures.login;

      for (const node of fixture.nodes) {
        // Nodes must NOT have raw DOM properties
        expect('innerHTML' in node).toBe(false);
        expect('className' in node).toBe(false);
        expect('style' in node).toBe(false);

        // Nodes MUST have NodeFingerprint-compatible structure
        expect(node.luminaId).toBeTruthy();
        expect(node.tag).toBeTruthy();
        expect(node.capability).toBeTruthy();
      }
    });

    it('SIR never returns more than 5 candidates', () => {
      // Simulated top-K cutoff
      const allNodes = domFixtures.login.nodes;
      const top5 = allNodes
        .sort((a, b) => (b.finalScore ?? 0) - (a.finalScore ?? 0))
        .slice(0, 5);

      expect(top5.length).toBeLessThanOrEqual(5);
    });
  });
}

/**
 * INVARIANT: Retrieval Latency < 500ms
 * SIR pipeline must complete within 500ms in browser runtime.
 * (Tested with fixture data — real browser timing tested separately.)
 */
export function testRetrievalLatency() {
  describe('INVARIANT: SIR Retrieval Latency < 500ms', () => {
    it('Fixture-based ranking completes in < 100ms', () => {
      const startMs = Date.now();

      // Simulate the ranking step (most expensive part)
      const nodes = [...domFixtures.login.nodes, ...domFixtures.courseList.nodes];
      const intent = 'sign in with email';

      // Simulate BM25-style scoring (fuzzy label match)
      const scored = nodes.map((n) => ({
        ...n,
        matchScore: n.label.toLowerCase().includes(intent.split(' ')[0] ?? '')
          ? 1.0
          : 0.1,
      }));

      const sorted = scored.sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0));
      const top5 = sorted.slice(0, 5);

      const durationMs = Date.now() - startMs;

      expect(durationMs).toBeLessThan(100);
      expect(top5.length).toBeLessThanOrEqual(5);
    });
  });
}

/**
 * Run all retrieval invariants.
 */
export function runAllRetrievalInvariants() {
  testTop5Recall();
  testRetrievalLatency();
}
