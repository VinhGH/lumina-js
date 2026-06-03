import { describe, it, expectTypeOf } from 'vitest';
import { crmWorkflow } from '../../../examples/crm/src/lumina/workflow';
import { createFSMFromDefinition } from '@lumina/memory';

describe('TypeScript Compilation & Type-Safety Tests', () => {
  it('FSM transition parameter and currentState types must be compile-time safe', () => {
    const fsm = createFSMFromDefinition<typeof crmWorkflow.states[number]>(crmWorkflow);

    // Verify currentState type matches CRM states list exactly
    expectTypeOf(fsm.getCurrentState()).toEqualTypeOf<'lead' | 'contact' | 'proposal' | 'deal' | 'closed'>();

    // Verify transition parameter must match CRM states list exactly
    expectTypeOf(fsm.transition).parameter(0).toEqualTypeOf<'lead' | 'contact' | 'proposal' | 'deal' | 'closed'>();

    // Verify canTransition parameter must match CRM states list exactly
    expectTypeOf(fsm.canTransition).parameter(0).toEqualTypeOf<'lead' | 'contact' | 'proposal' | 'deal' | 'closed'>();
  });
});
