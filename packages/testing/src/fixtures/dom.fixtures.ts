import type { InteractiveNode, ScoutResult } from '@lumina/contracts';

/** Simulates a Learn Proof login page DOM scan result */
export const loginPageFixture: ScoutResult = {
  timestamp: Date.now(),
  totalDomNodes: 247,
  interactiveNodes: 8,
  nodes: [
    {
      luminaId: 'lumina-0',
      tag: 'input',
      label: 'Email address',
      role: 'textbox',
      attributes: { type: 'email', name: 'email' },
      capability: 'fill-input',
      state: 'login',
      finalScore: 0.95,
    },
    {
      luminaId: 'lumina-1',
      tag: 'input',
      label: 'Password',
      role: 'textbox',
      attributes: { type: 'password', name: 'password' },
      capability: 'fill-input',
      state: 'login',
      finalScore: 0.92,
    },
    {
      luminaId: 'lumina-2',
      tag: 'button',
      label: 'Sign In',
      role: 'button',
      attributes: { type: 'submit' },
      capability: 'click',
      state: 'login',
      finalScore: 0.88,
    },
    {
      luminaId: 'lumina-3',
      tag: 'a',
      label: 'Forgot password?',
      role: 'link',
      attributes: { href: '/forgot-password' },
      capability: 'navigate-page',
      state: 'login',
      finalScore: 0.3,
    },
    {
      luminaId: 'lumina-4',
      tag: 'button',
      label: 'Sign in with Google',
      role: 'button',
      attributes: {},
      capability: 'click',
      state: 'login',
      finalScore: 0.25,
    },
  ],
};

/** Simulates a Learn Proof course list page */
export const courseListFixture: ScoutResult = {
  timestamp: Date.now(),
  totalDomNodes: 1247,
  interactiveNodes: 24,
  nodes: [
    {
      luminaId: 'lumina-10',
      tag: 'button',
      label: 'Introduction to Blockchain',
      role: 'button',
      attributes: { 'data-course-id': 'blockchain-101' },
      capability: 'click',
      state: 'course-select',
      finalScore: 0.91,
    },
    {
      luminaId: 'lumina-11',
      tag: 'button',
      label: 'Advanced Smart Contracts',
      role: 'button',
      attributes: { 'data-course-id': 'smart-contracts-adv' },
      capability: 'click',
      state: 'course-select',
      finalScore: 0.85,
    },
    {
      luminaId: 'lumina-12',
      tag: 'button',
      label: 'Zero Knowledge Proofs',
      role: 'button',
      attributes: { 'data-course-id': 'zkp-101' },
      capability: 'click',
      state: 'course-select',
      finalScore: 0.80,
    },
    {
      luminaId: 'lumina-13',
      tag: 'input',
      label: 'Search courses',
      role: 'textbox',
      attributes: { type: 'search', placeholder: 'Search courses...' },
      capability: 'fill-input',
      finalScore: 0.40,
    },
  ],
};

/** Simulates the exercise submission page */
export const exerciseSubmitFixture: ScoutResult = {
  timestamp: Date.now(),
  totalDomNodes: 892,
  interactiveNodes: 12,
  nodes: [
    {
      luminaId: 'lumina-50',
      tag: 'textarea',
      label: 'Your proof (write your solution here)',
      role: 'textbox',
      attributes: { name: 'proof', rows: '10' },
      capability: 'fill-input',
      state: 'submit-proof',
      finalScore: 0.97,
    },
    {
      luminaId: 'lumina-51',
      tag: 'button',
      label: 'Submit Proof',
      role: 'button',
      attributes: { type: 'submit', 'data-lumina-state': 'submit-proof' },
      capability: 'submit-proof',
      state: 'submit-proof',
      finalScore: 0.95,
    },
    {
      luminaId: 'lumina-52',
      tag: 'button',
      label: 'Save Draft',
      role: 'button',
      attributes: { type: 'button' },
      capability: 'click',
      state: 'submit-proof',
      finalScore: 0.30,
    },
  ],
};

/** All fixtures by page */
export const domFixtures = {
  login: loginPageFixture,
  courseList: courseListFixture,
  exercise: exerciseSubmitFixture,
};

