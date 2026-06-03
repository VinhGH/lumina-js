import { z } from 'zod';
import { CapabilitySchema } from './action.schema.js';

export const WorkflowStateIdSchema = z.string();

export const SemanticTypeSchema = z.string();

export const NodeFingerprintSchema = z.object({
  luminaId: z.string().min(1),
  tag: z.string().min(1),
  label: z.string(),
  role: z.string(),
  capability: CapabilitySchema,
  state: WorkflowStateIdSchema.optional(),
  semanticType: SemanticTypeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  score: z.number().min(0).max(1).optional(),
});

export const InteractiveNodeSchema = z.object({
  luminaId: z.string().min(1),
  tag: z.string().min(1),
  label: z.string(),
  role: z.string(),
  attributes: z.record(z.string()),
  capability: CapabilitySchema.optional(),
  state: WorkflowStateIdSchema.optional(),
  semanticType: SemanticTypeSchema.optional(),
  metadata: z.record(z.unknown()).optional(),
  matchScore: z.number().optional(),
  topologyScore: z.number().optional(),
  finalScore: z.number().optional(),
});

export const ScoutResultSchema = z.object({
  nodes: z.array(InteractiveNodeSchema),
  timestamp: z.number().int().positive(),
  totalDomNodes: z.number().int().nonnegative(),
  interactiveNodes: z.number().int().nonnegative(),
});

export const SIRResultSchema = z.object({
  topNodes: z.array(NodeFingerprintSchema).max(5),
  intent: z.string(),
  timestamp: z.number().int().positive(),
  stagesMs: z.object({
    scouter: z.number().nonnegative(),
    intentMatch: z.number().nonnegative(),
    graphRank: z.number().nonnegative(),
  }),
});

export type NodeFingerprintInput = z.input<typeof NodeFingerprintSchema>;
export type SIRResultInput = z.input<typeof SIRResultSchema>;

