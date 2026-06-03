import { defineWorkflow } from '@lumina/workflow';

export const learnProofWorkflow = defineWorkflow({
  id: 'learn-proof-v1',
  name: 'Learn Proof',
  version: '1.0.0',
  states: [
    'login', 'course-select', 'lesson-select',
    'read-material', 'open-exercise', 'submit-proof',
    'verification', 'result'
  ] as const,
  transitions: [
    ['login', 'course-select'],
    ['course-select', 'lesson-select'],
    ['lesson-select', 'read-material'],
    ['read-material', 'open-exercise'],
    ['open-exercise', 'submit-proof'],
    ['submit-proof', 'verification'],
    ['verification', 'result'],
    ['result', 'login'],
  ],
  initialState: 'login',
  statePolicies: {
    'submit-proof': {
      capabilities: ['submit-proof'],
      riskLevel: 'high',
      requiresHumanApproval: true,
    },
    'verification': {
      capabilities: ['read-dom'],
      riskLevel: 'low',
    },
  },
});

export type LearnProofState = typeof learnProofWorkflow.states[number];
