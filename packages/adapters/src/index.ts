export type { ScanAdapter } from './scan-adapter.interface.js';
export type { ExecutionAdapter } from './execution-adapter.interface.js';

export {
  DOMScanAdapter,
  resetLuminaCounter,
} from './adapters/dom-scan.adapter.js';

export {
  DOMExecutionAdapter,
  defaultExecutionAdapter,
} from './adapters/dom-execution.adapter.js';

export {
  PlaywrightExecutionAdapter,
} from './adapters/playwright.adapter.js';
