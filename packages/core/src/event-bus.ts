import type { SIRResult, RuntimeAction, PolicyDecision } from '@lumina/contracts';

export type RuntimeEventMap = {
  'loop-started': { intent: string };
  'loop-finished': { status: string };
  'scan-complete': SIRResult;
  'plan-created': RuntimeAction;
  'approval-required': { action: RuntimeAction; decision: PolicyDecision };
  'action-executed': { action: RuntimeAction; result: any };
  'state-transition': { fromState: string; toState: string };
  'error': Error;
};

export type RuntimeEventKey = keyof RuntimeEventMap;
export type RuntimeEventListener<K extends RuntimeEventKey> = (payload: RuntimeEventMap[K]) => void;

export class EventBus {
  private readonly listeners = new Map<RuntimeEventKey, Set<RuntimeEventListener<any>>>();

  on<K extends RuntimeEventKey>(event: K, listener: RuntimeEventListener<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return () => this.off(event, listener);
  }

  off<K extends RuntimeEventKey>(event: K, listener: RuntimeEventListener<K>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(listener);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    }
  }

  emit<K extends RuntimeEventKey>(event: K, payload: RuntimeEventMap[K]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(payload);
        } catch (err) {
          console.error(`[EventBus] Error in listener for event "${event}":`, err);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}
