// packages/security/src/index.ts
// Public API surface of @lumina/security — Zero-Trust Security Engine

// ─── Capability Registry ──────────────────────────────────────────────────────
export {
  CAPABILITY_REGISTRY,
  getRequiredCapability,
  hasCapability,
} from './capability-registry.js';

// ─── Policy Engine ────────────────────────────────────────────────────────────
export { PolicyEngine } from './policy-engine.js';

// ─── Signers ──────────────────────────────────────────────────────────────────
export type { ISigner } from './signer.js';
export { LocalSigner, BackendSigner, TOKEN_TTL_MS } from './signer.js';

// ─── Token Verifier ───────────────────────────────────────────────────────────
export type { VerificationResult } from './token-verifier.js';
export { TokenVerifier } from './token-verifier.js';

// ─── Audit Logger ─────────────────────────────────────────────────────────────
export { AuditLogger, globalAuditLogger } from './audit-logger.js';
