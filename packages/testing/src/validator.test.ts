import { describe, it, expect } from 'vitest';
import { WorkflowValidator } from '@lumina/workflow';
import type { WorkflowDefinition } from '@lumina/contracts';

describe('WorkflowValidator', () => {
  it('passes for a valid workflow definition', () => {
    const validWorkflow: WorkflowDefinition = {
      id: 'valid-v1',
      name: 'Valid Workflow',
      version: '1.0.0',
      states: ['idle', 'running', 'completed'],
      transitions: [
        { from: 'idle', to: 'running' },
        { from: 'running', to: 'completed' },
      ],
      initialState: 'idle',
    };

    const res = WorkflowValidator.validate(validWorkflow);
    expect(res.valid).toBe(true);
    expect(res.errors).toHaveLength(0);
  });

  it('fails when workflow ID or name is missing', () => {
    const invalidWorkflow = {
      version: '1.0.0',
      states: ['idle'],
      transitions: [],
      initialState: 'idle',
    } as unknown as WorkflowDefinition;

    const res = WorkflowValidator.validate(invalidWorkflow);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Workflow ID is required.');
    expect(res.errors).toContain('Workflow name is required.');
  });

  it('fails when states are empty', () => {
    const invalidWorkflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      states: [],
      transitions: [],
      initialState: 'idle',
    };

    const res = WorkflowValidator.validate(invalidWorkflow);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Workflow states cannot be empty.');
  });

  it('fails when initialState is not in states list', () => {
    const invalidWorkflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      states: ['idle', 'running'],
      transitions: [],
      initialState: 'completed',
    };

    const res = WorkflowValidator.validate(invalidWorkflow);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Initial state 'completed' is not in the states list.");
  });

  it('fails when transitions refer to invalid states', () => {
    const invalidWorkflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      states: ['idle', 'running'],
      transitions: [
        { from: 'idle', to: 'completed' }, // completed is invalid
        { from: 'paused', to: 'running' }, // paused is invalid
      ],
      initialState: 'idle',
    };

    const res = WorkflowValidator.validate(invalidWorkflow);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain("Transition [index 0] references invalid target state 'completed'.");
    expect(res.errors).toContain("Transition [index 1] references invalid source state 'paused'.");
  });

  it('fails when duplicate states exist', () => {
    const invalidWorkflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      states: ['idle', 'running', 'idle', 'running'],
      transitions: [],
      initialState: 'idle',
    };

    const res = WorkflowValidator.validate(invalidWorkflow);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Workflow contains duplicate states: [idle, running].');
  });

  it('fails when unreachable (orphan) states exist', () => {
    const invalidWorkflow: WorkflowDefinition = {
      id: 'test',
      name: 'Test',
      version: '1.0.0',
      states: ['idle', 'running', 'completed', 'orphan-1', 'orphan-2'],
      transitions: [
        { from: 'idle', to: 'running' },
        { from: 'running', to: 'completed' },
        // orphan-1 and orphan-2 are not transition targets from idle or reachable states
        { from: 'orphan-1', to: 'orphan-2' },
      ],
      initialState: 'idle',
    };

    const res = WorkflowValidator.validate(invalidWorkflow);
    expect(res.valid).toBe(false);
    expect(res.errors).toContain('Workflow contains unreachable (orphan) states: [orphan-1, orphan-2].');
  });
});
