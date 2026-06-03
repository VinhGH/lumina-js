import type { Capability } from './action.js';
import type { WorkflowStateId } from './workflow.js';

export type SemanticType =
  | 'submit-button'
  | 'cancel-button'
  | 'navigation-link'
  | 'search-input'
  | 'primary-input'
  | 'action-button'
  | 'toggle'
  | 'content-display'
  | (string & {});

export type NodeFingerprint = {
  luminaId: string;
  tag: string;
  label: string;
  role: string;
  capability: Capability;
  state?: WorkflowStateId;
  semanticType?: SemanticType;
  metadata?: Record<string, unknown>;
  score?: number;
};

export type InteractiveNode = {
  luminaId: string;
  tag: string;
  label: string;
  role: string;
  attributes: Record<string, string>;
  capability?: Capability;
  state?: WorkflowStateId;
  semanticType?: SemanticType;
  metadata?: Record<string, unknown>;
  matchScore?: number;
  topologyScore?: number;
  finalScore?: number;
};

export type ScoutResult = {
  nodes: InteractiveNode[];
  timestamp: number;
  totalDomNodes: number;
  interactiveNodes: number;
};

export type SIRResult = {
  topNodes: NodeFingerprint[];
  intent: string;
  timestamp: number;
  stagesMs: {
    scouter: number;
    intentMatch: number;
    graphRank: number;
  };
};

