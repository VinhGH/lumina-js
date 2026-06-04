// apps/learn-proof-runtime/src/components/LuminaPanel.tsx
// The Lumina.js AI panel — shows intent input, SIR candidates, action proposals
// This is the core demonstration of the Lumina.js runtime

import React, { useState, useRef } from 'react';
import type { NodeFingerprint } from '@lumina/contracts';
import type { AppPage } from '../store/app-store.js';
import type { AppState } from '../store/app-store.js';

interface LuminaPipelineStep {
  id: string;
  label: string;
  description: string;
}

const PIPELINE_STEPS: LuminaPipelineStep[] = [
  { id: 'scouter', label: 'Scouter', description: 'DOM Tree Shaking' },
  { id: 'intent', label: 'Intent Match', description: 'BM25 + Fuse.js' },
  { id: 'graph', label: 'Graph Rank', description: 'Topology Boost' },
  { id: 'planner', label: 'Planner', description: 'LLM Proposal' },
  { id: 'security', label: 'Security', description: 'Policy Engine' },
];

interface MockSIRResult {
  candidates: Array<{
    luminaId: string;
    tag: string;
    label: string;
    capability: string;
    score: number;
    state?: string;
  }>;
  stagesMs: { scouter: number; intentMatch: number; graphRank: number };
}

interface MockPlanResult {
  actionType: string;
  targetNodeId: string;
  reasoning: string;
  confidence: number;
  approved: boolean;
  riskLevel: string;
}

// Mock SIR results based on current page
function getMockSIRResult(intent: string, page: AppPage): MockSIRResult {
  const lowerIntent = intent.toLowerCase();

  if (page === 'login') {
    if (lowerIntent.includes('email') || lowerIntent.includes('enter')) {
      return {
        candidates: [
          { luminaId: 'lumina-0', tag: 'input', label: 'Email address', capability: 'fill-input', score: 0.97, state: 'login' },
          { luminaId: 'lumina-1', tag: 'input', label: 'Password', capability: 'fill-input', score: 0.72, state: 'login' },
          { luminaId: 'lumina-2', tag: 'button', label: 'Sign In', capability: 'click', score: 0.45, state: 'login' },
        ],
        stagesMs: { scouter: 12, intentMatch: 28, graphRank: 5 },
      };
    }
    if (lowerIntent.includes('sign in') || lowerIntent.includes('login') || lowerIntent.includes('submit')) {
      return {
        candidates: [
          { luminaId: 'lumina-2', tag: 'button', label: 'Sign In', capability: 'click', score: 0.95, state: 'login' },
          { luminaId: 'lumina-0', tag: 'input', label: 'Email address', capability: 'fill-input', score: 0.55, state: 'login' },
          { luminaId: 'lumina-1', tag: 'input', label: 'Password', capability: 'fill-input', score: 0.42, state: 'login' },
        ],
        stagesMs: { scouter: 11, intentMatch: 24, graphRank: 6 },
      };
    }
  }

  if (page === 'courses') {
    return {
      candidates: [
        { luminaId: 'lumina-10', tag: 'button', label: 'Introduction to Blockchain', capability: 'click', score: 0.91, state: 'course-select' },
        { luminaId: 'lumina-11', tag: 'button', label: 'Zero Knowledge Proofs', capability: 'click', score: 0.78, state: 'course-select' },
        { luminaId: 'lumina-12', tag: 'button', label: 'Advanced Smart Contracts', capability: 'click', score: 0.65, state: 'course-select' },
        { luminaId: 'lumina-13', tag: 'input', label: 'Search courses', capability: 'fill-input', score: 0.32 },
      ],
      stagesMs: { scouter: 18, intentMatch: 35, graphRank: 8 },
    };
  }

  if (page === 'exercise') {
    if (lowerIntent.includes('submit') || lowerIntent.includes('proof')) {
      return {
        candidates: [
          { luminaId: 'lumina-51', tag: 'button', label: 'Submit Proof', capability: 'submit-proof', score: 0.97, state: 'submit-proof' },
          { luminaId: 'lumina-50', tag: 'textarea', label: 'Your proof', capability: 'fill-input', score: 0.82, state: 'submit-proof' },
        ],
        stagesMs: { scouter: 14, intentMatch: 22, graphRank: 4 },
      };
    }
    return {
      candidates: [
        { luminaId: 'lumina-50', tag: 'textarea', label: 'Your proof (write your solution here)', capability: 'fill-input', score: 0.94, state: 'submit-proof' },
        { luminaId: 'lumina-51', tag: 'button', label: 'Submit Proof', capability: 'submit-proof', score: 0.88, state: 'submit-proof' },
        { luminaId: 'lumina-52', tag: 'button', label: 'Save Draft', capability: 'click', score: 0.25 },
      ],
      stagesMs: { scouter: 16, intentMatch: 29, graphRank: 7 },
    };
  }

  // Default
  return {
    candidates: [
      { luminaId: 'lumina-0', tag: 'button', label: 'Primary Action', capability: 'click', score: 0.85 },
      { luminaId: 'lumina-1', tag: 'input', label: 'Input Field', capability: 'fill-input', score: 0.62 },
    ],
    stagesMs: { scouter: 15, intentMatch: 30, graphRank: 6 },
  };
}

function getMockPlanResult(intent: string, candidate: MockSIRResult['candidates'][0]): MockPlanResult {
  const isHighRisk = candidate.capability === 'submit-proof';
  return {
    actionType: candidate.capability === 'fill-input' ? 'fill-input'
      : candidate.capability === 'submit-proof' ? 'submit-proof'
      : candidate.capability === 'navigate-page' ? 'navigate'
      : 'click',
    targetNodeId: candidate.luminaId,
    reasoning: `Selected "${candidate.label}" (score: ${candidate.score.toFixed(2)}) for intent: "${intent}". Capability: ${candidate.capability}.`,
    confidence: candidate.score,
    approved: !isHighRisk,
    riskLevel: isHighRisk ? 'high' : candidate.capability === 'navigate-page' ? 'medium' : 'low',
  };
}

import React, { useState, useRef, useEffect } from 'react';
import type { AppPage } from '../store/app-store.js';
import { useLumina } from '@lumina/react';

interface LuminaPanelProps {
  currentPage: AppPage;
}

export function LuminaPanel({ currentPage }: LuminaPanelProps) {
  const {
    status,
    lastSIRResult,
    pendingApproval,
    error,
    submitIntent,
    confirmPendingAction,
    rejectPendingAction,
    runtime,
  } = useLumina();

  const [intent, setIntent] = useState('');
  const [logs, setLogs] = useState<Array<{ time: string; event: string; status: 'ok' | 'warn' | 'error' }>>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const formatTime = () => {
      const now = new Date();
      return `${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    };

    const unsub1 = runtime.eventBus.on('loop-started', ({ intent }) => {
      setLogs([{ time: formatTime(), event: `Intent received: "${intent}"`, status: 'ok' }]);
    });

    const unsub2 = runtime.eventBus.on('scan-complete', (result) => {
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), event: `SIR Pipeline: Scan complete (${result.durationMs}ms)`, status: 'ok' }
      ]);
    });

    const unsub3 = runtime.eventBus.on('plan-created', (action) => {
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), event: `Planner: ${action.type} proposed (confidence: ${(action.confidence * 100).toFixed(0)}%)`, status: 'ok' }
      ]);
    });

    const unsub4 = runtime.eventBus.on('approval-required', ({ decision }) => {
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), event: `PolicyEngine: Approval required (risk: ${decision.riskLevel})`, status: 'warn' }
      ]);
    });

    const unsub5 = runtime.eventBus.on('action-executed', ({ action }) => {
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), event: `Action executed: ${action.type}`, status: 'ok' }
      ]);
    });

    const unsub6 = runtime.eventBus.on('state-transition', ({ toState }) => {
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), event: `FSM transition: -> ${toState}`, status: 'ok' }
      ]);
    });

    const unsub7 = runtime.eventBus.on('error', (err) => {
      setLogs((prev) => [
        ...prev,
        { time: formatTime(), event: `Error: ${err.message}`, status: 'error' }
      ]);
    });

    return () => {
      unsub1();
      unsub2();
      unsub3();
      unsub4();
      unsub5();
      unsub6();
      unsub7();
    };
  }, [runtime]);

  const runPipeline = async () => {
    if (!intent.trim() || isRunning) return;
    await submitIntent(intent);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runPipeline();
    }
  };

  const isRunning = status === 'scanning' || status === 'planning' || status === 'executing';

  return (
    <aside className="lumina-panel">
      <div className="lumina-panel-header">
        <div className="lumina-panel-title">
          <div className={`lumina-status-dot ${isRunning ? 'running' : status === 'paused-for-approval' ? 'paused' : ''}`} />
          Lumina.js Agent Runtime
        </div>
        <span className="badge badge-lumina" style={{ fontSize: '0.7rem' }}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="lumina-panel-body">
        {/* Intent Input */}
        <div className="lumina-intent-input">
          <textarea
            ref={textareaRef}
            id="lumina-intent-input"
            className="lumina-intent-field"
            placeholder={'Type your intent...\n\nExamples:\n"Fill in my email"\n"Sign in"\n"Submit my proof"'}
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={4}
            disabled={isRunning}
          />
          <button
            id="lumina-run-btn"
            className="btn lumina-run-btn btn-full"
            onClick={runPipeline}
            disabled={isRunning || !intent.trim()}
          >
            {isRunning ? (
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Running Loop…</>
            ) : (
              <>⚡ Run Agent Loop</>
            )}
          </button>
        </div>

        {/* Live Logs */}
        {logs.length > 0 && (
          <div className="lumina-candidates animate-fade-in" style={{ maxHeight: 150, overflowY: 'auto' }}>
            <div className="lumina-candidate-title">Audit Trail Event Log</div>
            {logs.map((entry, idx) => (
              <div key={idx} style={{
                display: 'flex',
                gap: 8,
                padding: '2px 0',
                fontSize: '0.72rem',
                fontFamily: 'var(--font-mono)',
                borderBottom: '1px solid var(--color-border)',
              }}>
                <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{entry.time}</span>
                <span style={{
                  color: entry.status === 'error' ? 'var(--color-error)'
                    : entry.status === 'warn' ? 'var(--color-warning)'
                    : 'var(--color-text-secondary)'
                }}>
                  {entry.status === 'error' ? '❌' : entry.status === 'warn' ? '⚠' : '✓'} {entry.event}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* SIR Candidates */}
        {lastSIRResult && lastSIRResult.candidates.length > 0 && (
          <div className="lumina-candidates animate-fade-in">
            <div className="lumina-candidate-title">
              SIR Candidates ({lastSIRResult.durationMs}ms)
            </div>
            {lastSIRResult.candidates.map((node, idx) => (
              <div key={node.luminaId} className="lumina-candidate-node">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="lumina-candidate-label">{node.label}</span>
                  <span className="lumina-candidate-rank">#{idx + 1} · {((node.score || 0) * 100).toFixed(0)}%</span>
                </div>
                <div className="lumina-candidate-meta">
                  <span className="badge badge-info" style={{ fontSize: '0.7rem' }}>
                    {node.tag}
                  </span>
                  <span className="badge badge-brand" style={{ fontSize: '0.7rem' }}>
                    {node.capability}
                  </span>
                  {node.state && (
                    <span className="badge badge-lumina" style={{ fontSize: '0.7rem' }}>
                      {node.state}
                    </span>
                  )}
                  {node.semanticType && (
                    <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>
                      {node.semanticType}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {node.luminaId}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Approval Request / Active Action */}
        {pendingApproval && (
          <div className="lumina-action-proposal animate-fade-in" style={{ border: '1px solid var(--color-warning)' }}>
            <div className="lumina-action-title" style={{ color: 'var(--color-warning)' }}>
              🔐 Human Approval Required
            </div>
            <div className="lumina-action-code">
              {`actionType: "${pendingApproval.type}"\ntargetId: "${pendingApproval.targetNodeId}"\nconfidence: ${((pendingApproval.confidence || 0) * 100).toFixed(0)}%`}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)' }}>
              <button
                id="panel-reject-btn"
                className="btn btn-secondary btn-sm"
                onClick={rejectPendingAction}
                style={{ flex: 1 }}
              >
                Reject
              </button>
              <button
                id="panel-approve-btn"
                className="btn btn-primary btn-sm"
                onClick={confirmPendingAction}
                style={{ flex: 1 }}
              >
                Approve & Run
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="lumina-action-proposal animate-fade-in" style={{ border: '1px solid var(--color-error)' }}>
            <div className="lumina-action-title" style={{ color: 'var(--color-error)' }}>
              ❌ Loop Failure
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--color-error)', fontFamily: 'var(--font-mono)' }}>
              {error.message}
            </div>
          </div>
        )}

        {/* Principles reminder */}
        <div style={{
          marginTop: 'auto',
          padding: 'var(--spacing-md)',
          background: 'var(--color-bg-glass)',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--color-border)',
          fontSize: '0.72rem',
          color: 'var(--color-text-muted)',
          fontFamily: 'var(--font-mono)',
          lineHeight: 1.7,
        }}>
          <div style={{ color: 'var(--color-brand-secondary)', fontWeight: 700, marginBottom: 4 }}>
            Core Principles
          </div>
          LLM NEVER HAS AUTHORITY<br />
          LLM NEVER TOUCHES RAW DOM<br />
          WORKFLOW IS THE SOURCE OF TRUTH
        </div>
      </div>
    </aside>
  );
}
