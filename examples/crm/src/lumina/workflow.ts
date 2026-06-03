import { defineWorkflow } from '@lumina/workflow';

export const crmWorkflow = defineWorkflow({
  id: 'crm-sales-v1',
  name: 'CRM Sales',
  version: '1.0.0',
  states: ['lead', 'contact', 'proposal', 'deal', 'closed'] as const,
  transitions: [
    ['lead', 'contact'],
    ['contact', 'proposal'],
    ['proposal', 'deal'],
    ['deal', 'closed'],
  ],
  initialState: 'lead',
  statePolicies: {
    closed: {
      capabilities: ['click'],
      riskLevel: 'high',
      requiresHumanApproval: true,
    },
  },
});

export type CRMState = typeof crmWorkflow.states[number];
