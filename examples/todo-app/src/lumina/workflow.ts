import { defineWorkflow } from '@lumina/workflow';

export const todoWorkflow = defineWorkflow({
  id: 'todo-workflow-v1',
  name: 'Todo App Validation',
  version: '1.0.0',
  states: ['login', 'todo-list', 'create-todo'] as const,
  transitions: [
    ['login', 'todo-list'],
    ['todo-list', 'create-todo'],
    ['create-todo', 'todo-list'],
  ],
  initialState: 'login',
  statePolicies: {
    'create-todo': {
      capabilities: ['fill-input', 'click'],
      riskLevel: 'low',
    },
  },
});

export type TodoState = typeof todoWorkflow.states[number];
