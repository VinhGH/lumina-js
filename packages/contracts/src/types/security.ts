// packages/contracts/src/types/security.ts
// Zero-Trust security types for Lumina.js
// Principle: BUSINESS ERRORS CAN BE CORRECTED. SECURITY ERRORS MUST BE DENIED.

import type { Capability } from './action.js';

/**
 * Risk levels — assigned by PolicyEngine, determines approval flow.
 * low    → auto-approve
 * medium → log + approve
 * high   → require explicit user confirmation
 * critical → deny immediately
 */
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

/**
 * Backend-issued security token.
 * Signed with HMAC-SHA256. Must be verified before action execution.
 * Principle: LLM NEVER HAS AUTHORITY — token is the proof of authorization.
 */
export type SecurityToken = {
  /** Corresponds to RuntimeAction.actionId */
  actionId: string;

  /** Current user session */
  sessionId: string;

  /** Risk level assigned during policy evaluation */
  riskLevel: RiskLevel;

  /** Unix timestamp (ms) — token expires after this time */
  expiration: number;

  /** HMAC-SHA256 signature of the token payload */
  signature: string;
};

/**
 * Read-only security context — injected at session start.
 * Cannot be modified by LLM or Planner.
 */
export type SecurityContext = {
  userId: string;
  sessionId: string;
  role: string;

  /** Capabilities granted to this user in this session */
  capabilities: readonly Capability[];

  /** Unix timestamp (ms) — session expires after this time */
  sessionExpiration: number;
};

/**
 * Decision output from PolicyEngine.
 */
export type PolicyDecision = {
  approved: boolean;
  riskLevel: RiskLevel;
  reason: string;

  /** Whether this decision requires human confirmation */
  requiresHumanApproval: boolean;
};

/**
 * Audit log entry — append-only record of all security decisions.
 */
export type AuditEntry = {
  id: string;
  timestamp: number;
  actionId: string;
  sessionId: string;
  userId: string;
  decision: PolicyDecision;
  actionType: string;
  capability: Capability;
};
