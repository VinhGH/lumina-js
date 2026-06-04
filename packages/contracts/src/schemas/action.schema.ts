// packages/contracts/src/schemas/action.schema.ts
// Zod validation schemas for Action types

import { z } from 'zod';

export const CapabilitySchema = z.enum([
  'read-dom',
  'fill-input',
  'click',
  'navigate-page',
  'submit-proof',
  'mint-certificate',
  'read-result',
]);

export const ActionTypeSchema = z.enum([
  'fill-input',
  'click',
  'navigate',
  'submit-proof',
  'read-dom',
]);

export const RuntimeActionSchema = z.object({
  actionId: z.string().min(1, 'actionId is required'),
  type: ActionTypeSchema,
  targetNodeId: z.string().min(1, 'targetNodeId is required'),
  payload: z.unknown().optional(),
  capability: CapabilitySchema,
  workflowState: z.string().optional(),
  timestamp: z.number().int().positive(),
  intent: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
});

export const ActionResultSchema = z.object({
  actionId: z.string().min(1),
  success: z.boolean(),
  error: z.string().optional(),
  timestamp: z.number().int().positive(),
});

export type RuntimeActionInput = z.input<typeof RuntimeActionSchema>;
export type ActionResultInput = z.input<typeof ActionResultSchema>;
