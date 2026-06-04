// packages/core/src/adapters/rule-based.adapter.ts
// Rule-based LLM Adapter — deterministic, offline-friendly rule matcher for tests & CI/CD

import type { NodeFingerprint } from '@lumina/contracts';
import type { ILLMAdapter, LLMRequest, LLMResponse } from './types.js';

export class RuleBasedLLMAdapter implements ILLMAdapter {
  readonly name = 'rule-based';

  async complete(request: LLMRequest): Promise<LLMResponse> {
    const intent = request.intent.toLowerCase();
    const candidates = request.candidates;
    const currentState = request.currentState;

    if (candidates.length === 0) {
      return {
        actionType: 'read-dom',
        targetNodeId: '',
        reasoning: 'No candidates available to plan from.',
        confidence: 1.0,
      };
    }

    // 1. Logic for 'login' state
    if (currentState === 'login' || intent.includes('login') || intent.includes('sign in') || intent.includes('đăng nhập')) {
      const emailInput = candidates.find(
        (c) => c.semanticType === 'primary-input' || c.label.toLowerCase().includes('email')
      );
      const passwordInput = candidates.find(
        (c) => c.label.toLowerCase().includes('password')
      );
      const submitBtn = candidates.find(
        (c) => c.semanticType === 'submit-button' || c.label.toLowerCase().includes('sign in')
      );

      if (intent.includes('email') || intent.includes('nhập email') || intent.includes('username') || intent.includes('student')) {
        if (emailInput) {
          return {
            actionType: 'fill-input',
            targetNodeId: emailInput.luminaId,
            payload: 'student@learnproof.dev',
            reasoning: 'Rules: Selected primary email input based on intent.',
            confidence: 0.98,
          };
        }
      }
      if (intent.includes('password') || intent.includes('mật khẩu')) {
        if (passwordInput) {
          return {
            actionType: 'fill-input',
            targetNodeId: passwordInput.luminaId,
            payload: 'password123',
            reasoning: 'Rules: Selected password input based on intent.',
            confidence: 0.95,
          };
        }
      }
      if (intent.includes('sign in') || intent.includes('login') || intent.includes('click') || intent.includes('nút')) {
        if (submitBtn) {
          return {
            actionType: 'click',
            targetNodeId: submitBtn.luminaId,
            reasoning: 'Rules: Selected sign in button to submit authentication credentials.',
            confidence: 0.99,
          };
        }
      }
    }

    // 2. Logic for 'course-select' state
    if (currentState === 'course-select' || intent.includes('course') || intent.includes('khóa học') || intent.includes('chọn')) {
      const targetCourse = candidates.find((c) => {
        const label = c.label.toLowerCase();
        return (
          label.includes('blockchain') ||
          label.includes('zero knowledge') ||
          label.includes('zkp') ||
          label.includes('smart contract') ||
          label.includes('defi')
        );
      });

      if (targetCourse) {
        return {
          actionType: 'click',
          targetNodeId: targetCourse.luminaId,
          reasoning: `Rules: Click course matching intent keyword.`,
          confidence: 0.95,
        };
      }
    }

    // 3. Logic for 'lesson-select' state
    if (currentState === 'lesson-select' || intent.includes('lesson') || intent.includes('bài học')) {
      const targetLesson = candidates.find((c) => {
        const label = c.label.toLowerCase();
        return (
          label.includes('what is') ||
          label.includes('cryptographic') ||
          label.includes('exercise') ||
          label.includes('merkle') ||
          label.includes('consensus')
        );
      });

      if (targetLesson) {
        return {
          actionType: 'click',
          targetNodeId: targetLesson.luminaId,
          reasoning: `Rules: Click lesson matching intent.`,
          confidence: 0.95,
        };
      }
    }

    // 4. Logic for 'submit-proof' state
    if (currentState === 'submit-proof' || intent.includes('proof') || intent.includes('minh chứng') || intent.includes('nộp')) {
      const proofTextarea = candidates.find(
        (c) => c.semanticType === 'primary-input' || c.tag === 'textarea'
      );
      const submitProofBtn = candidates.find(
        (c) => c.semanticType === 'submit-button' || c.label.toLowerCase().includes('submit')
      );
      const cancelBtn = candidates.find(
        (c) => c.semanticType === 'cancel-button' || c.label.toLowerCase().includes('cancel')
      );

      if (intent.includes('write') || intent.includes('fill') || intent.includes('nhập') || intent.includes('viết')) {
        if (proofTextarea) {
          return {
            actionType: 'fill-input',
            targetNodeId: proofTextarea.luminaId,
            payload: 'GIVEN: input "lumina-js-2026"\nAPPLY: SHA-256 compression function\nPROVE: H(input) = "a3f8b7..."\nBECAUSE: SHA-256 output is deterministic.',
            reasoning: 'Rules: Filling proof solution template.',
            confidence: 0.96,
          };
        }
      }
      if (intent.includes('submit') || intent.includes('click') || intent.includes('nộp')) {
        if (submitProofBtn) {
          return {
            actionType: 'submit-proof',
            targetNodeId: submitProofBtn.luminaId,
            reasoning: 'Rules: Click submit proof button (high-risk action triggers security policies).',
            confidence: 0.98,
          };
        }
      }
      if (intent.includes('cancel') || intent.includes('hủy')) {
        if (cancelBtn) {
          return {
            actionType: 'click',
            targetNodeId: cancelBtn.luminaId,
            reasoning: 'Rules: Click cancel submit button.',
            confidence: 0.92,
          };
        }
      }
    }

    // 5. Fallback: Select the candidate with highest search relevance score
    const bestCandidate = candidates.reduce((prev, current) =>
      (prev.score ?? 0) > (current.score ?? 0) ? prev : current
    );

    return {
      actionType: bestCandidate.capability === 'fill-input' ? 'fill-input'
        : bestCandidate.capability === 'submit-proof' ? 'submit-proof'
        : bestCandidate.capability === 'navigate-page' ? 'navigate'
        : 'click',
      targetNodeId: bestCandidate.luminaId,
      reasoning: `Rules Fallback: Selected highest ranked candidate "${bestCandidate.label}".`,
      confidence: bestCandidate.score ?? 0.5,
    };
  }
}
