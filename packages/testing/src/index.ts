// packages/testing/src/index.ts
// Barrel export for @lumina/testing

// ─── Fixtures ────────────────────────────────────────────────────────────────
export {
  loginPageFixture,
  courseListFixture,
  exerciseSubmitFixture,
  domFixtures,
} from './fixtures/dom.fixtures.js';

export {
  learnProofWorkflowFixture,
  mockSecurityContext,
  adminSecurityContext,
  loginGoalFixture,
  submitProofGoalFixture,
} from './fixtures/workflow.fixtures.js';

// ─── Invariants ──────────────────────────────────────────────────────────────
export {
  testLLMNeverHasAuthority,
  testLLMNeverTouchesRawDOM,
  testPromptInjectionResistance,
  runAllSecurityInvariants,
} from './invariants/security.invariants.js';

export {
  testTop5Recall,
  testRetrievalLatency,
  runAllRetrievalInvariants,
} from './invariants/retrieval.invariants.js';
