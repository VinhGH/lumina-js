// packages/security/src/token-verifier.ts
// Verifies SecurityToken HMAC signatures and expiration.
// Principle: SECURITY ERRORS MUST BE DENIED — an invalid or expired token is always rejected.

import crypto from 'node:crypto';
import type { SecurityToken } from '@lumina/contracts';

// ─── Internal helpers ─────────────────────────────────────────────────────────

/**
 * Recomputes the HMAC-SHA256 signature for the given `SecurityToken` payload.
 *
 * The canonical payload is serialized with explicit key ordering to match
 * the serialization produced by `LocalSigner.sign()`. Any deviation in key
 * order would produce a different digest and cause verification to fail.
 *
 * @param token - The token whose payload is to be re-signed.
 * @param secret - The HMAC-SHA256 shared secret.
 * @returns A hex-encoded HMAC-SHA256 digest.
 */
function recomputeSignature(token: SecurityToken, secret: string): string {
  const canonical = JSON.stringify({
    actionId: token.actionId,
    sessionId: token.sessionId,
    riskLevel: token.riskLevel,
    expiration: token.expiration,
  });
  
  if (crypto && typeof crypto.createHmac === 'function') {
    return crypto.createHmac('sha256', secret).update(canonical).digest('hex');
  }

  // Fallback for browser environments (LocalSigner should not be used in browser prod)
  let hash = 0;
  const str = canonical + secret;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'mock-sig-' + Math.abs(hash).toString(16);
}

/**
 * Performs a constant-time string comparison to prevent timing-based
 * signature oracle attacks.
 *
 * Both strings are converted to `Buffer` before comparison. If the buffers
 * differ in length (which always indicates a mismatch), `false` is returned
 * immediately without leaking length information via timing.
 *
 * @param a - The first hex string (e.g., received signature).
 * @param b - The second hex string (e.g., recomputed signature).
 * @returns `true` if both strings are identical, `false` otherwise.
 */
function timingSafeStringEqual(a: string, b: string): boolean {
  if (crypto && typeof crypto.timingSafeEqual === 'function') {
    try {
      const bufA = Buffer.from(a, 'hex');
      const bufB = Buffer.from(b, 'hex');
      // timingSafeEqual throws if buffers have different lengths
      if (bufA.length !== bufB.length) return false;
      return crypto.timingSafeEqual(bufA, bufB);
    } catch {
      return false;
    }
  }

  // Fallback for browser environments
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// ─── TokenVerifier ────────────────────────────────────────────────────────────

/**
 * The result of a token verification attempt.
 */
export interface VerificationResult {
  /** Whether the token is valid, unexpired, and cryptographically sound. */
  valid: boolean;
  /** Human-readable reason for rejection. Only present when `valid` is `false`. */
  reason?: string;
}

/**
 * TokenVerifier — validates `SecurityToken` instances before action execution.
 *
 * Performs two independent checks in sequence:
 *
 * 1. **Expiration check**: Rejects tokens where `expiration <= Date.now()`.
 *    Expired tokens cannot be renewed — the action must be re-authorized.
 *
 * 2. **Signature check**: Recomputes the HMAC-SHA256 over the canonical token
 *    payload and compares it to `token.signature` using a constant-time
 *    comparison to prevent timing oracle attacks.
 *
 * @remarks
 * The `TokenVerifier` is intentionally stateless — it does not cache
 * verification results or track used tokens (replay prevention is the
 * responsibility of the session/executor layer).
 *
 * @example
 * ```ts
 * const verifier = new TokenVerifier(process.env.LUMINA_SECRET!);
 * const result = verifier.verify(token);
 * if (!result.valid) throw new Error(`Token rejected: ${result.reason}`);
 * ```
 */
export class TokenVerifier {
  /**
   * @param secret - The HMAC-SHA256 shared secret.
   *                 Must match the secret used by `LocalSigner` or the backend.
   */
  constructor(private readonly secret: string) {
    if (!secret || secret.trim().length === 0) {
      throw new Error('TokenVerifier: secret must be a non-empty string.');
    }
  }

  /**
   * Verifies a `SecurityToken` for authenticity and freshness.
   *
   * The method never throws — all error conditions are reported via the
   * returned `VerificationResult` so callers can handle them declaratively.
   *
   * @param token - The `SecurityToken` to verify.
   * @returns A `VerificationResult` indicating success or the reason for failure.
   */
  verify(token: SecurityToken): VerificationResult {
    // ── Guard: basic structural sanity ───────────────────────────────────
    if (!token || typeof token !== 'object') {
      return { valid: false, reason: 'Token is null or not an object.' };
    }

    if (
      typeof token.actionId !== 'string' ||
      typeof token.sessionId !== 'string' ||
      typeof token.riskLevel !== 'string' ||
      typeof token.expiration !== 'number' ||
      typeof token.signature !== 'string'
    ) {
      return {
        valid: false,
        reason: 'Token is missing required fields or has incorrect field types.',
      };
    }

    // ── Check 1: Expiration ───────────────────────────────────────────────
    const now = Date.now();
    if (token.expiration <= now) {
      const expiredAgo = Math.round((now - token.expiration) / 1000);
      return {
        valid: false,
        reason: `Token for action '${token.actionId}' expired ${expiredAgo}s ago. Re-authorization required.`,
      };
    }

    // ── Check 2: Signature (constant-time comparison) ────────────────────
    const expected = recomputeSignature(token, this.secret);
    if (!timingSafeStringEqual(token.signature, expected)) {
      return {
        valid: false,
        reason: `Token signature for action '${token.actionId}' is invalid. The token may have been tampered with.`,
      };
    }

    return { valid: true };
  }
}
