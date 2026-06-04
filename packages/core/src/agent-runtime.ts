// packages/core/src/agent-runtime.ts
// AgentRuntime — the central coordinator for Lumina's E2E agent loop (Observe-Plan-Act-Reobserve)

import { GoalStateStore, WorkflowFSM, createFSMFromDefinition, SecurityContextStore } from '@lumina/memory';
import { SIRPipeline, HybridStrategy } from '@lumina/retrieval';
import { ToolRegistry } from '@lumina/tools';
import { DOMScanAdapter, DOMExecutionAdapter } from '@lumina/adapters';
import { PolicyEngine } from '@lumina/security';
import { Planner } from './planner.js';
import { LLMOrchestrator } from './llm-orchestrator.js';
import { EventBus } from './event-bus.js';

import type {
  WorkflowDefinition,
  GoalState,
  WorkflowStateId,
  SecurityContext,
  SIRResult,
  RuntimeAction,
  InteractiveNode
} from '@lumina/contracts';
import type { ILLMAdapter, PlanResult } from './index.js';

export interface RuntimeConfig {
  workflowDefinition: WorkflowDefinition;
  llmAdapter: ILLMAdapter;
  securityContext: SecurityContext;
  rootElement?: unknown; // E.g., document.body or container element
}

export type AgentStatus = 'idle' | 'scanning' | 'planning' | 'paused-for-approval' | 'executing' | 'completed' | 'failed';

export interface RuntimeState {
  currentState: WorkflowStateId;
  goalState: GoalState;
  status: AgentStatus;
  lastSIRResult: SIRResult | null;
  pendingApproval: RuntimeAction | null;
  error: Error | null;
}

export class AgentRuntime {
  public readonly goalStore: GoalStateStore;
  public readonly fsm: WorkflowFSM;
  public readonly securityStore: SecurityContextStore;
  public readonly scanAdapter: DOMScanAdapter;
  public readonly executionAdapter: DOMExecutionAdapter;
  public readonly toolRegistry: ToolRegistry;
  public readonly policyEngine: PolicyEngine;
  public readonly planner: Planner;
  public readonly sirPipeline: SIRPipeline;
  public readonly eventBus: EventBus;
  
  private status: AgentStatus = 'idle';
  private lastSIRResult: SIRResult | null = null;
  private pendingApproval: RuntimeAction | null = null;
  private error: Error | null = null;
  private rootElement: unknown;

  private listeners = new Set<(state: RuntimeState) => void>();

  constructor(private readonly config: RuntimeConfig) {
    this.rootElement = config.rootElement;
    this.goalStore = new GoalStateStore(config.workflowDefinition.initialState);
    this.fsm = createFSMFromDefinition(config.workflowDefinition);
    this.securityStore = new SecurityContextStore(config.securityContext);
    
    this.scanAdapter = new DOMScanAdapter();
    this.executionAdapter = new DOMExecutionAdapter();
    this.toolRegistry = ToolRegistry.createDefault();
    this.policyEngine = new PolicyEngine(config.workflowDefinition);
    this.eventBus = new EventBus();
    
    this.planner = new Planner({ adapter: config.llmAdapter });
    this.sirPipeline = new SIRPipeline(undefined, this.scanAdapter, HybridStrategy.createDefault());

    this.fsm.subscribe(() => {
      this.eventBus.emit('state-transition', {
        fromState: '', // Simple placeholder as history/FSM doesn't track diff directly
        toState: this.fsm.getState().currentState
      });
      this.notify();
    });
  }

  getState(): RuntimeState {
    return {
      currentState: this.fsm.getState().currentState,
      goalState: this.goalStore.getState(),
      status: this.status,
      lastSIRResult: this.lastSIRResult,
      pendingApproval: this.pendingApproval,
      error: this.error,
    };
  }

  subscribe(listener: (state: RuntimeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const state = this.getState();
    this.listeners.forEach((l) => l(state));
  }

  private setStatus(status: AgentStatus) {
    this.status = status;
    this.notify();
  }

  private setError(err: Error | null) {
    this.error = err;
    if (err) {
      this.eventBus.emit('error', err);
    }
    this.notify();
  }

  reset() {
    this.fsm.reset();
    this.goalStore.reset();
    this.lastSIRResult = null;
    this.pendingApproval = null;
    this.error = null;
    this.status = 'idle';
    this.eventBus.clear();
    this.notify();
  }

  /**
   * Run the Agentic Loop: Observe -> Plan -> Act -> Observe
   */
  async runAgentLoop(intent: string, maxSteps = 5): Promise<void> {
    this.setError(null);
    this.goalStore.setUserIntent(intent);
    this.eventBus.emit('loop-started', { intent });
    
    let steps = 0;
    try {
      while (steps < maxSteps) {
        steps++;
        
        // 1. Observe (Scan the DOM state)
        this.setStatus('scanning');
        const sirResult = await this.sirPipeline.run(intent, {
          topK: 5,
          workflowDef: this.config.workflowDefinition,
          root: (this.rootElement as Element) ?? document.body,
        });
        this.lastSIRResult = sirResult;
        this.eventBus.emit('scan-complete', sirResult);

        // 2. FSM state transition based on actual observation
        this.synchronizeFSMFromObservation(sirResult.topNodes);

        // Check if target goal is completed (e.g. FSM is Complete)
        if (this.fsm.getState().isComplete) {
          this.setStatus('completed');
          this.eventBus.emit('loop-finished', { status: 'completed' });
          return;
        }

        if (sirResult.topNodes.length === 0) {
          this.setStatus('idle');
          this.eventBus.emit('loop-finished', { status: 'idle' });
          return;
        }

        // 3. Plan (Evaluate candidates)
        this.setStatus('planning');
        const planResult = await this.planner.plan({
          intent,
          sirResult,
          currentState: this.fsm.getState().currentState,
          goalState: this.goalStore.getState(),
        });
        const action = planResult.action;
        this.eventBus.emit('plan-created', action);

        // 4. Policy Check
        const decision = this.policyEngine.evaluate(action, this.securityStore.getContext());
        if (!decision.approved) {
          throw new Error(`Action denied by Security Policy: ${decision.reason}`);
        }

        if (decision.requiresHumanApproval) {
          this.pendingApproval = action;
          this.setStatus('paused-for-approval');
          this.eventBus.emit('approval-required', { action, decision });
          return; // Pause the agent loop and wait for manual user confirmation
        }

        // 5. Execute Action
        await this.executeAction(action);
      }
      
      this.setStatus('idle');
      this.eventBus.emit('loop-finished', { status: 'idle' });
    } catch (err) {
      this.setStatus('failed');
      this.setError(err instanceof Error ? err : new Error(String(err)));
      this.eventBus.emit('loop-finished', { status: 'failed' });
    }
  }

  /**
   * Action Execution Logic
   */
  private async executeAction(action: RuntimeAction) {
    this.setStatus('executing');
    try {
      const toolContext = {
        security: this.securityStore.getContext(),
        workflowState: this.fsm.getState(),
        adapter: this.executionAdapter,
      };

      const result = await this.toolRegistry.execute(action, toolContext);
      this.eventBus.emit('action-executed', { action, result });
      
      // Post-execution: scan DOM again to sync FSM state
      const nextScan = await this.scanAdapter.scan((this.rootElement as Element) ?? document.body);
      this.synchronizeFSMFromObservation(nextScan.nodes);
    } catch (err) {
      this.setStatus('failed');
      this.setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  }

  /**
   * FSM Transition driven by DOM Observation
   */
  private synchronizeFSMFromObservation(candidates: Array<{ state?: WorkflowStateId }>) {
    // Look for data-lumina-state in visible elements
    const observedStates = candidates
      .map((c) => c.state)
      .filter((s): s is WorkflowStateId => !!s);
      
    if (observedStates.length > 0) {
      const targetState = observedStates[0];
      if (this.fsm.getState().currentState !== targetState && this.fsm.canTransition(targetState)) {
        this.fsm.transition(targetState);
      }
    }
  }

  /**
   * User manually approves a pending action (Human-in-the-loop)
   */
  async approvePendingAction(): Promise<void> {
    if (!this.pendingApproval) return;
    const actionToRun = this.pendingApproval;
    this.pendingApproval = null;
    
    await this.executeAction(actionToRun);
    
    // Resume agent loop to continue subsequent actions
    const intent = this.goalStore.getState().userIntent ?? '';
    if (intent) {
      await this.runAgentLoop(intent);
    }
  }

  rejectPendingAction() {
    this.pendingApproval = null;
    this.setStatus('idle');
  }
}
