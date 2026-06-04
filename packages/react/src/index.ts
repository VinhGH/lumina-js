// packages/react/src/index.ts
// Barrel export for @lumina/react SDK

// ─── Context ─────────────────────────────────────────────────────────────────
export { LuminaContext } from './context/lumina-context.js';
export type {
  LuminaRuntimeState,
  LuminaRuntimeActions,
  LuminaContextValue,
} from './context/lumina-context.js';
export { LuminaProvider } from './context/lumina-provider.js';
export type { LuminaProviderProps } from './context/lumina-provider.js';

// ─── Hooks ───────────────────────────────────────────────────────────────────
export { useLumina } from './hooks/useLumina.js';
export { useWorkflow } from './hooks/useWorkflow.js';
export type { UseWorkflowReturn } from './hooks/useWorkflow.js';
export { useIntent } from './hooks/useIntent.js';
export type { UseIntentReturn } from './hooks/useIntent.js';
