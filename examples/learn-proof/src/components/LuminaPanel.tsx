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

interface LuminaPanelProps {
  currentPage: AppPage;
}

export function LuminaPanel({ currentPage }: LuminaPanelProps) {
  const [intent, setIntent] = useState('');
  const [isRunning, setIsRunning] = useState(false);
  const [activeStep, setActiveStep] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());
  const [sirResult, setSIRResult] = useState<MockSIRResult | null>(null);
  const [planResult, setPlanResult] = useState<MockPlanResult | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runPipeline = async () => {
    if (!intent.trim() || isRunning) return;

    setIsRunning(true);
    setSIRResult(null);
    setPlanResult(null);
    setCompletedSteps(new Set());

    const steps = ['scouter', 'intent', 'graph', 'planner', 'security'];

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i]!;
      setActiveStep(step);
      await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));

      // After graph step, show SIR results
      if (step === 'graph') {
        const result = getMockSIRResult(intent, currentPage);
        setSIRResult(result);
      }

      // After security step, show plan result
      if (step === 'security' && sirResult !== null) {
        // sirResult might not be updated yet due to closure, recompute
        const result = getMockSIRResult(intent, currentPage);
        const topCandidate = result.candidates[0];
        if (topCandidate) {
          setPlanResult(getMockPlanResult(intent, topCandidate));
        }
      }

      setCompletedSteps((prev) => new Set([...prev, step]));
    }

    // Final: compute plan from fresh SIR result
    const finalSIR = getMockSIRResult(intent, currentPage);
    setSIRResult(finalSIR);
    const topCandidate = finalSIR.candidates[0];
    if (topCandidate) {
      setPlanResult(getMockPlanResult(intent, topCandidate));
    }

    setActiveStep(null);
    setIsRunning(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      runPipeline();
    }
  };

  const totalMs = sirResult
    ? sirResult.stagesMs.scouter + sirResult.stagesMs.intentMatch + sirResult.stagesMs.graphRank
    : null;

  return (
    <aside className="lumina-panel">
      <div className="lumina-panel-header">
        <div className="lumina-panel-title">
          <div className="lumina-status-dot" />
          Lumina.js Runtime
        </div>
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
              <><span className="spinner" style={{ width: 14, height: 14 }} /> Running Pipeline…</>
            ) : (
              <>⚡ Run SIR Pipeline</>
            )}
          </button>
        </div>

        {/* Pipeline Steps */}
        <div className="lumina-pipeline">
          <div className="lumina-candidate-title">Pipeline</div>
          {PIPELINE_STEPS.map((step) => {
            const isDone = completedSteps.has(step.id);
            const isActive = activeStep === step.id;
            return (
              <div
                key={step.id}
                className={`lumina-pipeline-step ${isActive ? 'active' : ''} ${isDone ? 'done' : ''}`}
              >
                <div className="lumina-pipeline-icon">
                  {isDone ? '✓' : isActive ? '◉' : '○'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{step.label}</div>
                  <div style={{ fontSize: '0.72rem', opacity: 0.7 }}>{step.description}</div>
                </div>
                {isDone && step.id === 'graph' && sirResult && (
                  <span
                    className="badge badge-lumina"
                    style={{ marginLeft: 'auto', fontSize: '0.7rem' }}
                  >
                    {totalMs}ms
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* SIR Results */}
        {sirResult && (
          <div className="lumina-candidates animate-fade-in">
            <div className="lumina-candidate-title">
              SIR Top {sirResult.candidates.length} Candidates
            </div>
            {sirResult.candidates.map((node, idx) => (
              <div key={node.luminaId} className="lumina-candidate-node">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="lumina-candidate-label">{node.label}</span>
                  <span className="lumina-candidate-rank">#{idx + 1} · {(node.score * 100).toFixed(0)}%</span>
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
                </div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>
                  {node.luminaId}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Action Proposal */}
        {planResult && (
          <div className="lumina-action-proposal animate-fade-in">
            <div className="lumina-action-title">
              🤖 LLM Proposal → Security Check
            </div>
            <div className="lumina-action-code">
              {`actionType: "${planResult.actionType}"\ntargetId: "${planResult.targetNodeId}"\nrisk: "${planResult.riskLevel}"\nconfidence: ${(planResult.confidence * 100).toFixed(0)}%`}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginTop: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
              <span className={`badge ${
                planResult.riskLevel === 'low' ? 'badge-success'
                : planResult.riskLevel === 'medium' ? 'badge-warning'
                : 'badge-error'
              }`}>
                {planResult.riskLevel} risk
              </span>
              <span className={`badge ${planResult.approved ? 'badge-success' : 'badge-warning'}`}>
                {planResult.approved ? '✓ Auto-Approved' : '⚠ Needs Confirmation'}
              </span>
            </div>
            <div className="lumina-action-reasoning">
              {planResult.reasoning}
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
