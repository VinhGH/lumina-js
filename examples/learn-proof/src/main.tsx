import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.js';
import './index.css';
import { LuminaProvider } from '@lumina/react';
import { AgentRuntime, RuleBasedLLMAdapter } from '@lumina/core';
import { learnProofWorkflow } from './lumina/workflow.js';

const runtime = new AgentRuntime({
  workflowDefinition: learnProofWorkflow,
  llmAdapter: new RuleBasedLLMAdapter(),
  securityContext: {
    userId: 'student-42',
    role: 'student',
    capabilities: ['fill-input', 'click', 'navigate-page', 'submit-proof', 'read-dom'],
    sessionExpiration: Date.now() + 3600 * 1000,
    sessionId: 'session-xyz',
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('[LearnProof] #root element not found');

createRoot(root).render(
  <React.StrictMode>
    <LuminaProvider runtime={runtime}>
      <App />
    </LuminaProvider>
  </React.StrictMode>
);
