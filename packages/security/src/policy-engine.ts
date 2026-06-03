import type {
  RuntimeAction,
  SecurityContext,
  PolicyDecision,
  RiskLevel,
  WorkflowDefinition,
  StatePolicy,
} from '@lumina/contracts';
import { hasCapability } from './capability-registry.js';

interface RiskProfile {
  riskLevel: RiskLevel;
  requiresHumanApproval: boolean;
  reason: string;
}

const RISK_PROFILES: Record<string, RiskProfile> = {
  'submit-proof': {
    riskLevel: 'high',
    requiresHumanApproval: true,
    reason: 'Submitting proof is a high-risk irreversible action requiring human confirmation.',
  },
  'mint-certificate': {
    riskLevel: 'critical',
    requiresHumanApproval: true,
    reason: 'Minting a certificate is a critical privileged operation that is always denied automatically.',
  },
  'navigate': {
    riskLevel: 'medium',
    requiresHumanApproval: false,
    reason: 'Page navigation carries medium risk due to potential data exposure.',
  },
  'fill-input': {
    riskLevel: 'low',
    requiresHumanApproval: false,
    reason: 'Filling an input field is a low-risk reversible action.',
  },
  'click': {
    riskLevel: 'low',
    requiresHumanApproval: false,
    reason: 'Clicking an element is a low-risk action.',
  },
  'read-dom': {
    riskLevel: 'low',
    requiresHumanApproval: false,
    reason: 'Reading DOM metadata is a low-risk read-only action.',
  },
} as const;

const UNKNOWN_ACTION_PROFILE: RiskProfile = {
  riskLevel: 'critical',
  requiresHumanApproval: true,
  reason: 'Unknown action type — denied as a security precaution.',
};

function isAutoApproved(riskLevel: RiskLevel): boolean {
  return riskLevel === 'low' || riskLevel === 'medium';
}

export class PolicyEngine {
  constructor(private readonly workflowDef?: WorkflowDefinition) {}

  evaluate(action: RuntimeAction, context: SecurityContext): PolicyDecision {
    // Layer 1: Capability check
    if (!hasCapability(context, action.type)) {
      const required = action.capability;
      return {
        approved: false,
        riskLevel: 'critical',
        requiresHumanApproval: false,
        reason: `Security violation: session does not have capability '${required}' required for action '${action.type}'. Access denied.`,
      };
    }

    // Layer 2: Session expiration check
    if (Date.now() > context.sessionExpiration) {
      return {
        approved: false,
        riskLevel: 'critical',
        requiresHumanApproval: false,
        reason: 'Security violation: session has expired. Re-authentication required.',
      };
    }

    // Layer 3: Workflow State Policy check
    if (this.workflowDef && action.workflowState) {
      const policy = this.workflowDef.statePolicies?.[action.workflowState];
      if (policy) {
        return this.fromStatePolicy(policy, action, context);
      }
    }

    // Layer 4: Fallback to default risk by action type
    return this.defaultRiskByActionType(action, context);
  }

  private fromStatePolicy(
    policy: StatePolicy,
    action: RuntimeAction,
    context: SecurityContext,
  ): PolicyDecision {
    const hasRequired = policy.capabilities.includes(action.capability);
    if (!hasRequired) {
      return {
        approved: false,
        riskLevel: 'critical',
        requiresHumanApproval: false,
        reason: `Security violation: state policy does not allow capability '${action.capability}' for state '${action.workflowState}'.`,
      };
    }

    const riskLevel = policy.riskLevel ?? 'low';
    const requiresHumanApproval = policy.requiresHumanApproval ?? false;

    if (riskLevel === 'critical') {
      return {
        approved: false,
        riskLevel: 'critical',
        requiresHumanApproval: requiresHumanApproval,
        reason: `Action denied: state policy specifies critical risk for state '${action.workflowState}'.`,
      };
    }

    return {
      approved: riskLevel === 'low' || riskLevel === 'medium' || (riskLevel === 'high' && !requiresHumanApproval),
      riskLevel,
      requiresHumanApproval,
      reason: `Action evaluated against workflow state policy. Risk: ${riskLevel}.`,
    };
  }

  private defaultRiskByActionType(
    action: RuntimeAction,
    context: SecurityContext,
  ): PolicyDecision {
    const profile: RiskProfile = RISK_PROFILES[action.type] ?? UNKNOWN_ACTION_PROFILE;

    if (profile.riskLevel === 'critical') {
      return {
        approved: false,
        riskLevel: 'critical',
        requiresHumanApproval: profile.requiresHumanApproval,
        reason: profile.reason,
      };
    }

    if (profile.riskLevel === 'high') {
      return {
        approved: true,
        riskLevel: 'high',
        requiresHumanApproval: true,
        reason: profile.reason,
      };
    }

    return {
      approved: isAutoApproved(profile.riskLevel),
      riskLevel: profile.riskLevel,
      requiresHumanApproval: profile.requiresHumanApproval,
      reason: profile.reason,
    };
  }
}

