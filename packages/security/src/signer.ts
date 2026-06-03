// packages/security/src/signer.ts
// Strategy Pattern: ISigner interface with LocalSigner and BackendSigner implementations.
// Principle: LLM NEVER HAS AUTHORITY — the token is the cryptographic proof of authorization.

import { createHmac } from 'node:crypto';
import type { RuntimeAction, SecurityContext, SecurityToken, RiskLevel } from '@lumina/contracts';

// ─── HMAC Payload ────────────────────────────────────────────────────────────

/**
 * The canonical payload that is serialized and HMAC-signed.
 *
 * Only the fields that uniquely identify an authorized action are included.
 * This prevents the LLM from influencing the signed payload by injecting
 * extra fields into the RuntimeAction.
 */
interface HmacPayload {
  actionId: string;
  sessionId: string;
  riskLevel: RiskLevel;
  expiration: number;
}

/**
 * Computes an HMAC-SHA256 signature over the canonical payload.
 *
 * The payload is serialized with `JSON.stringify` using a stable key order
 * (matching the HmacPayload interface declaration order) so the signature
 * is deterministic across environments.
 *
 * @param payload - The canonical token payload to sign.
 * @param secret - The HMAC secret key.
 * @returns A hex-encoded HMAC-SHA256 digest.
 */
function computeHmac(payload: HmacPayload, secret: string): string {
  // Stable serialization: explicitly enumerate keys to avoid ordering issues
  const canonical = JSON.stringify({
    actionId: payload.actionId,
    sessionId: payload.sessionId,
    riskLevel: payload.riskLevel,
    expiration: payload.expiration,
  });
  return createHmac('sha256', secret).update(canonical).digest('hex');
}

// ─── Token Expiration ─────────────────────────────────────────────────────────

/** Token validity window in milliseconds (30 seconds). */
const TOKEN_TTL_MS = 30_000;

// ─── Interface ───────────────────────────────────────────────────────────────

/**
 * ISigner — the signing strategy interface.
 *
 * Implementations are responsible for producing a cryptographically signed
 * `SecurityToken` that the `TokenVerifier` can later validate.
 *
 * The strategy pattern allows the runtime to swap between a local HMAC signer
 * (for development / trusted environments) and a backend signer (for
 * production, where the HMAC secret never leaves the server).
 */
export interface ISigner {
  /**
   * Signs the given action and produces a time-limited `SecurityToken`.
   *
   * @param action - The proposed `RuntimeAction` to authorize.
   * @param context - The current session's `SecurityContext`.
   * @returns A `Promise` that resolves to a signed `SecurityToken`.
   */
  sign(action: RuntimeAction, context: SecurityContext): Promise<SecurityToken>;
}

// ─── LocalSigner ─────────────────────────────────────────────────────────────

/**
 * LocalSigner — signs tokens in-process using HMAC-SHA256 and a shared secret.
 *
 * @remarks
 * Use this signer only in trusted environments where the secret can be safely
 * stored (e.g., server-side Node.js, integration tests). Do NOT use this in
 * browser environments where the secret would be exposed.
 *
 * The HMAC is computed over `{ actionId, sessionId, riskLevel, expiration }`.
 * Tokens expire after 30 seconds to limit the window of replay attacks.
 *
 * @example
 * ```ts
 * const signer = new LocalSigner(process.env.LUMINA_SECRET!);
 * const token = await signer.sign(action, context);
 * ```
 */
export class LocalSigner implements ISigner {
  /**
   * @param secret - The HMAC-SHA256 shared secret. Must be kept confidential.
   *                 Minimum recommended length: 32 bytes of random entropy.
   */
  constructor(private readonly secret: string) {
    if (!secret || secret.trim().length === 0) {
      throw new Error('LocalSigner: secret must be a non-empty string.');
    }
  }

  /**
   * Signs the action locally using HMAC-SHA256.
   *
   * @param action - The `RuntimeAction` to be authorized.
   * @param context - The session `SecurityContext` providing `sessionId`.
   * @returns A `SecurityToken` signed with the configured secret.
   */
  async sign(action: RuntimeAction, context: SecurityContext): Promise<SecurityToken> {
    // Derive risk level from the action's declared capability.
    // NOTE: The PolicyEngine has already evaluated this action before signing;
    // the riskLevel here is re-derived for the token payload so the verifier
    // can reconstruct the payload without needing PolicyEngine state.
    const riskLevel = deriveRiskLevelFromCapability(action.capability);
    const expiration = Date.now() + TOKEN_TTL_MS;

    const payload: HmacPayload = {
      actionId: action.actionId,
      sessionId: context.sessionId,
      riskLevel,
      expiration,
    };

    const signature = computeHmac(payload, this.secret);

    return {
      actionId: payload.actionId,
      sessionId: payload.sessionId,
      riskLevel: payload.riskLevel,
      expiration: payload.expiration,
      signature,
    };
  }
}

// ─── BackendSigner ────────────────────────────────────────────────────────────

/**
 * BackendSigner — delegates token signing to a trusted backend service.
 *
 * @remarks
 * In production, the HMAC secret should never exist in the browser or in an
 * untrusted Node.js environment. `BackendSigner` POSTs the action and context
 * to a backend endpoint (`POST /api/lumina/sign`) and returns the
 * server-issued `SecurityToken`.
 *
 * The backend is solely responsible for:
 * - Re-validating the action against its own policy rules.
 * - Computing the HMAC with the server-side secret.
 * - Returning a signed `SecurityToken`.
 *
 * @example
 * ```ts
 * const signer = new BackendSigner('https://api.myapp.com');
 * const token = await signer.sign(action, context);
 * ```
 */
export class BackendSigner implements ISigner {
  /**
   * @param backendUrl - The base URL of the backend (no trailing slash).
   *                     Example: `'https://api.myapp.com'`
   */
  constructor(private readonly backendUrl: string) {
    if (!backendUrl || backendUrl.trim().length === 0) {
      throw new Error('BackendSigner: backendUrl must be a non-empty string.');
    }
  }

  /**
   * Signs the action by sending it to the backend signing endpoint.
   *
   * The request body is `{ action, context }` serialized as JSON.
   * The backend is expected to respond with a `SecurityToken` JSON object.
   *
   * @param action - The `RuntimeAction` to be authorized.
   * @param context - The session `SecurityContext`.
   * @returns A `Promise` resolving to the backend-issued `SecurityToken`.
   * @throws If the network request fails or the backend returns a non-2xx status.
   */
  async sign(action: RuntimeAction, context: SecurityContext): Promise<SecurityToken> {
    const url = `${this.backendUrl}/api/lumina/sign`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Prevent CSRF attacks by requiring an explicit Content-Type.
          // Additional auth headers (e.g., Bearer token) should be added
          // by a middleware layer wrapping this signer.
        },
        body: JSON.stringify({ action, context }),
      });
    } catch (networkError) {
      throw new Error(
        `BackendSigner: network error while contacting '${url}'. ` +
        `Cause: ${networkError instanceof Error ? networkError.message : String(networkError)}`,
      );
    }

    if (!response.ok) {
      let errorBody = '<no body>';
      try {
        errorBody = await response.text();
      } catch {
        // Ignore body read errors — the HTTP status is sufficient for diagnostics.
      }
      throw new Error(
        `BackendSigner: signing endpoint returned HTTP ${response.status} ` +
        `(${response.statusText}) for action '${action.actionId}'. Body: ${errorBody}`,
      );
    }

    let token: unknown;
    try {
      token = await response.json();
    } catch (parseError) {
      throw new Error(
        `BackendSigner: failed to parse SecurityToken JSON from '${url}'. ` +
        `Cause: ${parseError instanceof Error ? parseError.message : String(parseError)}`,
      );
    }

    // Minimal structural validation — full Zod validation can be applied by
    // the caller if desired (the SecurityTokenSchema is exported from contracts).
    assertIsSecurityToken(token);
    return token;
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Derives a `RiskLevel` from the action's declared `Capability`.
 *
 * This is a lightweight heuristic used when we need a risk level for token
 * payload construction without running a full PolicyEngine evaluation.
 * It intentionally mirrors the RISK_PROFILES in policy-engine.ts.
 */
function deriveRiskLevelFromCapability(capability: string): RiskLevel {
  switch (capability) {
    case 'submit-proof':
      return 'high';
    case 'mint-certificate':
      return 'critical';
    case 'navigate-page':
      return 'medium';
    case 'fill-input':
    case 'click':
    case 'read-dom':
    case 'read-result':
      return 'low';
    default:
      return 'critical'; // unknown capability → critical by default
  }
}

/**
 * Type guard that asserts the given value has the shape of a `SecurityToken`.
 * Throws a descriptive error if the token is malformed.
 */
function assertIsSecurityToken(value: unknown): asserts value is SecurityToken {
  if (
    typeof value !== 'object' ||
    value === null ||
    typeof (value as Record<string, unknown>)['actionId'] !== 'string' ||
    typeof (value as Record<string, unknown>)['sessionId'] !== 'string' ||
    typeof (value as Record<string, unknown>)['riskLevel'] !== 'string' ||
    typeof (value as Record<string, unknown>)['expiration'] !== 'number' ||
    typeof (value as Record<string, unknown>)['signature'] !== 'string'
  ) {
    throw new Error(
      `BackendSigner: backend returned an invalid SecurityToken structure: ${JSON.stringify(value)}`,
    );
  }
}

// Re-export RiskLevel helper for external use
export type { RiskLevel };
export { computeHmac, TOKEN_TTL_MS };
