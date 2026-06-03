import { describe, it, expect } from 'vitest';
import { crmWorkflow } from '../../../examples/crm/src/lumina/workflow';
import { WorkflowValidator } from '@lumina/workflow';
import { createFSMFromDefinition } from '@lumina/memory';

describe('CRM E2E Workflow Verification', () => {
  it('CRM workflow definition must be architecturally valid', () => {
    const validation = WorkflowValidator.validate(crmWorkflow);
    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  it('FSM created from CRM workflow must transition through standard sales pipeline E2E', () => {
    // 1. Initialize FSM from definition
    const fsm = createFSMFromDefinition<typeof crmWorkflow.states[number]>(crmWorkflow);
    expect(fsm.getCurrentState()).toBe('lead');
    expect(fsm.getState().isComplete).toBe(false);

    // 2. Transition lead -> contact
    expect(fsm.canTransition('contact')).toBe(true);
    let result = fsm.transition('contact');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('contact');

    // 3. Transition contact -> proposal
    expect(fsm.canTransition('proposal')).toBe(true);
    result = fsm.transition('proposal');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('proposal');

    // 4. Transition proposal -> deal
    expect(fsm.canTransition('deal')).toBe(true);
    result = fsm.transition('deal');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('deal');

    // 5. Transition deal -> closed (Terminal State)
    expect(fsm.canTransition('closed')).toBe(true);
    result = fsm.transition('closed');
    expect(result.success).toBe(true);
    expect(fsm.getCurrentState()).toBe('closed');
    expect(fsm.getState().isComplete).toBe(true); // closed has no outgoing transitions
  });

  it('FSM must enforce transition validation rules and block invalid transitions', () => {
    const fsm = createFSMFromDefinition<typeof crmWorkflow.states[number]>(crmWorkflow);
    expect(fsm.getCurrentState()).toBe('lead');

    // Attempting skip: lead -> proposal (not defined)
    expect(fsm.canTransition('proposal')).toBe(false);
    const result = fsm.transition('proposal');
    expect(result.success).toBe(false);
    expect(result.reason).toContain("Transition from 'lead' to 'proposal' is not permitted.");
    expect(fsm.getCurrentState()).toBe('lead'); // State remains unchanged
  });
});
