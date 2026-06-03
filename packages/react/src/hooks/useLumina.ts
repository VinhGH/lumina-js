// packages/react/src/hooks/useLumina.ts
// Primary hook — access the Lumina runtime

import { useLuminaContext } from '../context/lumina-context.js';
import type { LuminaContextValue } from '../context/lumina-context.js';

/**
 * `useLumina` — primary hook for accessing the Lumina.js runtime.
 *
 * @returns Full Lumina runtime state + actions
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { submitIntent, isProcessing, currentStep } = useLumina();
 *
 *   const handleVoiceCommand = async (text: string) => {
 *     await submitIntent(text);
 *   };
 * }
 * ```
 */
export function useLumina(): LuminaContextValue {
  return useLuminaContext();
}
