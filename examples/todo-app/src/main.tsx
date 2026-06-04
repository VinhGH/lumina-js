import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';
import { LuminaProvider } from '@lumina/react';
import { AgentRuntime } from '@lumina/core';
import type { ILLMAdapter, LLMRequest, LLMResponse } from '@lumina/core';
import { todoWorkflow } from './lumina/workflow';

// Custom LLM Adapter for Todo App (zero core modifications!)
class TodoLLMAdapter implements ILLMAdapter {
  readonly name = 'todo-rules';

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const intent = request.intent.toLowerCase();
    const candidates = request.candidates;
    const currentState = request.currentState;

    console.log('[TodoLLMAdapter] complete called. intent:', intent, 'state:', currentState, 'candidates:', candidates);

    if (candidates.length === 0) {
      return {
        actionType: 'read-dom',
        targetNodeId: '',
        reasoning: 'No candidates available.',
        confidence: 1.0,
      };
    }

    // 1. Login State
    if (currentState === 'login') {
      const emailInput = candidates.find((c) => c.tag === 'input' && c.label.toLowerCase().includes('email'));
      const passwordInput = candidates.find((c) => c.tag === 'input' && c.label.toLowerCase().includes('password'));
      const submitBtn = candidates.find((c) => c.tag === 'button' && (c.label.toLowerCase().includes('sign in') || c.label.toLowerCase().includes('login')));

      const emailVal = (document.getElementById('todo-email') as HTMLInputElement)?.value || '';
      const passwordVal = (document.getElementById('todo-password') as HTMLInputElement)?.value || '';

      if (intent.includes('email') || intent.includes('login') || intent.includes('đăng nhập') || intent.includes('dang nhap') || intent.includes('sign in') || intent.includes('submit')) {
        if (!emailVal && emailInput) {
          return {
            actionType: 'fill-input',
            targetNodeId: emailInput.luminaId,
            payload: 'todo-tester@lumina.dev',
            reasoning: 'Fill login email address.',
            confidence: 0.99,
          };
        }
        if (emailVal && !passwordVal && passwordInput) {
          return {
            actionType: 'fill-input',
            targetNodeId: passwordInput.luminaId,
            payload: 'todo-pass-123',
            reasoning: 'Fill login password.',
            confidence: 0.99,
          };
        }
        if (emailVal && passwordVal && submitBtn) {
          return {
            actionType: 'click',
            targetNodeId: submitBtn.luminaId,
            reasoning: 'Click login button to submit credentials.',
            confidence: 0.99,
          };
        }
      }
    }

    // 2. Todo List State
    if (currentState === 'todo-list') {
      const createBtn = candidates.find((c) => (c.tag === 'a' || c.tag === 'button') && (c.label.toLowerCase().includes('create todo') || c.label.toLowerCase().includes('add new')));
      const deleteBtns = candidates.filter((c) => c.tag === 'button' && (c.label.toLowerCase().includes('delete') || c.label.toLowerCase().includes('remove')));

      if ((intent.includes('create') || intent.includes('add') || intent.includes('tạo') || intent.includes('tao') || intent.includes('new') || intent.includes('công việc') || intent.includes('cong viec')) && createBtn) {
        return {
          actionType: 'click',
          targetNodeId: createBtn.luminaId,
          reasoning: 'Click create new todo task button.',
          confidence: 0.99,
        };
      }

      if (intent.includes('delete') || intent.includes('remove') || intent.includes('xóa') || intent.includes('xoa')) {
        if (deleteBtns.length > 0) {
          return {
            actionType: 'click',
            targetNodeId: deleteBtns[0]!.luminaId,
            reasoning: 'Click delete button for the first task.',
            confidence: 0.95,
          };
        }
      }
    }

    // 3. Create Todo State
    if (currentState === 'create-todo') {
      const taskInput = candidates.find((c) => c.tag === 'input' && (c.label.toLowerCase().includes('task') || c.label.toLowerCase().includes('title')));
      const submitBtn = candidates.find((c) => c.tag === 'button' && (c.label.toLowerCase().includes('submit') || c.label.toLowerCase().includes('add') || c.label.toLowerCase().includes('save') || c.label.toLowerCase().includes('lưu')));

      const taskVal = (document.getElementById('todo-desc-input') as HTMLInputElement)?.value || '';

      if (intent.includes('write') || intent.includes('fill') || intent.includes('title') || intent.includes('nhập') || intent.includes('nhap') || intent.includes('tạo') || intent.includes('tao') || intent.includes('new') || intent.includes('create') || intent.includes('lưu') || intent.includes('luu')) {
        if (!taskVal && taskInput) {
          return {
            actionType: 'fill-input',
            targetNodeId: taskInput.luminaId,
            payload: 'Complete Week 2 Framework E2E E2E validation',
            reasoning: 'Fill in todo task title.',
            confidence: 0.98,
          };
        }
        if (taskVal && submitBtn) {
          return {
            actionType: 'click',
            targetNodeId: submitBtn.luminaId,
            reasoning: 'Click save button to submit task.',
            confidence: 0.99,
          };
        }
      }
    }

    // Fallback
    const bestCandidate = candidates.reduce((prev, current) =>
      (prev.score ?? 0) > (current.score ?? 0) ? prev : current
    );

    return {
      actionType: bestCandidate.capability === 'fill-input' ? 'fill-input'
        : bestCandidate.capability === 'navigate-page' ? 'navigate'
        : 'click',
      targetNodeId: bestCandidate.luminaId,
      reasoning: `Fallback: Selected candidate "${bestCandidate.label}".`,
      confidence: bestCandidate.score ?? 0.5,
    };
  }
}

const runtime = new AgentRuntime({
  workflowDefinition: todoWorkflow,
  llmAdapter: new TodoLLMAdapter(),
  securityContext: {
    userId: 'dev-1',
    role: 'developer',
    capabilities: ['fill-input', 'click', 'navigate-page', 'read-dom'],
    sessionExpiration: Date.now() + 3600 * 1000,
    sessionId: 'session-dev-abc',
  },
});

const root = document.getElementById('root');
if (!root) throw new Error('[TodoApp] #root element not found');

createRoot(root).render(
  <React.StrictMode>
    <BrowserRouter>
      <LuminaProvider runtime={runtime}>
        <App />
      </LuminaProvider>
    </BrowserRouter>
  </React.StrictMode>
);
