import { defineWorkflow } from '@lumina/workflow';

export const ecommerceWorkflow = defineWorkflow({
  id: 'ecommerce-checkout-v1',
  name: 'Ecommerce Checkout',
  version: '1.0.0',
  states: ['cart', 'shipping', 'payment', 'confirmation'] as const,
  transitions: [
    ['cart', 'shipping'],
    ['shipping', 'payment'],
    ['payment', 'confirmation'],
  ],
  initialState: 'cart',
  statePolicies: {
    payment: {
      capabilities: ['submit-proof'],
      riskLevel: 'critical',
      requiresHumanApproval: true,
    },
  },
});

export type EcommerceState = typeof ecommerceWorkflow.states[number];
