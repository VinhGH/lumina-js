import { describe, it, expect } from 'vitest';
import { todoWorkflow } from '../../../examples/todo-app/src/lumina/workflow';
import { WorkflowValidator } from '@lumina/workflow';
import { createFSMFromDefinition } from '@lumina/memory';

describe('Todo App Workflow Verification', () => {
  it('Todo workflow definition must be architecturally valid', () => {
    const validation = WorkflowValidator.validate(todoWorkflow);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('FSM created from Todo workflow must transition correctly', () => {
    const fsm = createFSMFromDefinition<typeof todoWorkflow.states[number]>(todoWorkflow);
    expect(fsm.getCurrentState()).toBe('login');
    expect(fsm.getState().isComplete).toBe(false);

    // 1. Transition login -> todo-list
    expect(fsm.canTransition('todo-list')).toBe(true);
    let result = fsm.transition('todo-list');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('todo-list');

    // 2. Transition todo-list -> create-todo
    expect(fsm.canTransition('create-todo')).toBe(true);
    result = fsm.transition('create-todo');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('create-todo');

    // 3. Transition create-todo -> todo-list
    expect(fsm.canTransition('todo-list')).toBe(true);
    result = fsm.transition('todo-list');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('todo-list');
  });

  it('FSM must enforce transition validation rules and block invalid transitions', () => {
    const fsm = createFSMFromDefinition<typeof todoWorkflow.states[number]>(todoWorkflow);
    expect(fsm.getCurrentState()).toBe('login');

    // Attempting skip: login -> create-todo (not defined)
    expect(fsm.canTransition('create-todo')).toBe(false);
    const result = fsm.transition('create-todo');
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Transition from 'login' to 'create-todo' is not permitted.");
    expect(fsm.getCurrentState()).toBe('login');
  });
});
