import type { WorkflowDefinition, SecurityContext, GoalState } from '@lumina/contracts';

/** Canonical Learn Proof workflow definition */
export const learnProofWorkflowFixture: WorkflowDefinition = {
  id: 'learn-proof-v1',
  name: 'Learn Proof Workflow',
  version: '1.0.0',
  states: [
    'login',
    'course-select',
    'lesson-select',
    'read-material',
    'open-exercise',
    'submit-proof',
    'verification',
    'result',
  ],
  transitions: [
    { from: 'login', to: 'course-select' },
    { from: 'course-select', to: 'lesson-select' },
    { from: 'lesson-select', to: 'read-material' },
    { from: 'read-material', to: 'open-exercise' },
    { from: 'open-exercise', to: 'submit-proof' },
    { from: 'submit-proof', to: 'verification' },
    { from: 'verification', to: 'result' },
    { from: 'result', to: 'login' },
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
};

/** Mock security context for testing */
export const mockSecurityContext: SecurityContext = {
  userId: 'test-user-001',
  sessionId: 'test-session-abc123',
  role: 'student',
  capabilities: ['read-dom', 'fill-input', 'click', 'navigate-page', 'submit-proof'],
  sessionExpiration: Date.now() + 3_600_000, // 1 hour
};

/** Admin security context */
export const adminSecurityContext: SecurityContext = {
  userId: 'admin-001',
  sessionId: 'admin-session-xyz789',
  role: 'admin',
  capabilities: ['read-dom', 'fill-input', 'click', 'navigate-page', 'submit-proof', 'mint-certificate'],
  sessionExpiration: Date.now() + 7_200_000, // 2 hours
};

/** Mock goal state at login step */
export const loginGoalFixture: GoalState = {
  currentState: 'login',
  userIntent: 'Login to Learn Proof',
  context: {},
};

/** Mock goal state at submit-proof step */
export const submitProofGoalFixture: GoalState = {
  currentState: 'submit-proof',
  userIntent: 'Submit my proof for the hash function exercise',
  context: {
    courseId: 'blockchain-101',
    lessonId: 'lesson-03',
    assignmentId: 'assignment-5',
  },
};

