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

    const unsub1 = runtime.eventBus.on('loop-started', (payload: any) => {
      const { intent } = payload;
      setLogs([{ time: formatTime(), event: `Intent received: "${intent}"`, status: 'ok' }]);
    });

    const unsub2 = runtime.eventBus.on('scan-complete', (result: any) => {
      const durationMs = Math.round(result.stagesMs.scouter + result.stagesMs.intentMatch + result.stagesMs.graphRank);
      setLogs((prev: any) => [
        ...prev,
        { time: formatTime(), event: `SIR Pipeline: Scan complete (${durationMs}ms)`, status: 'ok' }
      ]);
    });

    const unsub3 = runtime.eventBus.on('plan-created', (action: any) => {
      setLogs((prev: any) => [
        ...prev,
        { time: formatTime(), event: `Planner: ${action.type} proposed (confidence: ${((action.confidence || 0) * 100).toFixed(0)}%)`, status: 'ok' }
      ]);
    });

    const unsub4 = runtime.eventBus.on('approval-required', (payload: any) => {
      const { decision } = payload;
      setLogs((prev: any) => [
        ...prev,
        { time: formatTime(), event: `PolicyEngine: Approval required (risk: ${decision.riskLevel})`, status: 'warn' }
      ]);
    });

    const unsub5 = runtime.eventBus.on('action-executed', (payload: any) => {
      const { action } = payload;
      setLogs((prev: any) => [
        ...prev,
        { time: formatTime(), event: `Action executed: ${action.type}`, status: 'ok' }
      ]);
    });

    const unsub6 = runtime.eventBus.on('state-transition', (payload: any) => {
      const { toState } = payload;
      setLogs((prev: any) => [
        ...prev,
        { time: formatTime(), event: `FSM transition: -> ${toState}`, status: 'ok' }
      ]);
    });

    const unsub7 = runtime.eventBus.on('error', (err: any) => {
      setLogs((prev: any) => [
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
        {lastSIRResult && lastSIRResult.topNodes.length > 0 && (
          <div className="lumina-candidates animate-fade-in">
            <div className="lumina-candidate-title">
              SIR Candidates ({Math.round(lastSIRResult.stagesMs.scouter + lastSIRResult.stagesMs.intentMatch + lastSIRResult.stagesMs.graphRank)}ms)
            </div>
            {lastSIRResult.topNodes.map((node, idx) => (
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
