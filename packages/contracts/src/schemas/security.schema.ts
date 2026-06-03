// packages/contracts/src/schemas/security.schema.ts
// Zod validation schemas for Security types

import { z } from 'zod';
import { CapabilitySchema } from './action.schema.js';

export const RiskLevelSchema = z.enum(['low', 'medium', 'high', 'critical']);

export const SecurityTokenSchema = z.object({
  actionId: z.string().min(1),
  sessionId: z.string().min(1),
  riskLevel: RiskLevelSchema,
  expiration: z.number().int().positive(),
  signature: z.string().min(1, 'signature is required'),
});

export const SecurityContextSchema = z.object({
  userId: z.string().min(1),
  sessionId: z.string().min(1),
  role: z.string().min(1),
  capabilities: z.array(CapabilitySchema).min(1),
  sessionExpiration: z.number().int().positive(),
});

export const PolicyDecisionSchema = z.object({
  approved: z.boolean(),
  riskLevel: RiskLevelSchema,
  reason: z.string(),
  requiresHumanApproval: z.boolean(),
});

export const AuditEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.number().int().positive(),
  actionId: z.string().min(1),
  sessionId: z.string().min(1),
  userId: z.string().min(1),
  decision: PolicyDecisionSchema,
  actionType: z.string(),
  capability: CapabilitySchema,
});

export type SecurityTokenInput = z.input<typeof SecurityTokenSchema>;
export type SecurityContextInput = z.input<typeof SecurityContextSchema>;
