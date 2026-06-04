import React, { useState, useRef, useEffect } from 'react';
import { useLumina } from '@lumina/react';

interface LuminaPanelProps {
  currentPage: string;
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
    <aside className="lumina-panel" style={{
      width: 360,
      background: '#1e1e24',
      color: '#fff',
      padding: '20px',
      borderLeft: '1px solid #2d2d3a',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px',
      height: '100vh',
      boxSizing: 'border-box',
      overflowY: 'auto'
    }}>
      <div className="lumina-panel-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #2d2d3a', paddingBottom: 10 }}>
        <div className="lumina-panel-title" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 'bold', fontSize: '0.95rem' }}>
          <div className={`lumina-status-dot ${isRunning ? 'running' : status === 'paused-for-approval' ? 'paused' : ''}`} style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: isRunning ? '#10b981' : status === 'paused-for-approval' ? '#f59e0b' : '#6b7280'
          }} />
          Lumina.js Runtime
        </div>
        <span style={{ fontSize: '0.7rem', padding: '2px 6px', background: '#3b82f6', borderRadius: 4 }}>
          {status.toUpperCase()}
        </span>
      </div>

      <div className="lumina-panel-body" style={{ display: 'flex', flexDirection: 'column', gap: 15, flex: 1 }}>
        <div className="lumina-intent-input" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <textarea
            ref={textareaRef}
            className="lumina-intent-field"
            placeholder={'Type intent...\ne.g. "đăng nhập", "tạo công việc mới"' }
            value={intent}
            onChange={(e) => setIntent(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={3}
            disabled={isRunning}
            style={{
              width: '100%',
              background: '#0f0f13',
              color: '#fff',
              border: '1px solid #2d2d3a',
              borderRadius: 6,
              padding: 8,
              boxSizing: 'border-box',
              resize: 'none',
              fontSize: '0.85rem'
            }}
          />
          <button
            className="btn lumina-run-btn btn-full"
            onClick={runPipeline}
            disabled={isRunning || !intent.trim()}
            style={{
              width: '100%',
              background: '#3b82f6',
              color: '#fff',
              border: 'none',
              borderRadius: 6,
              padding: '8px 16px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '0.85rem'
            }}
          >
            {isRunning ? 'Running Loop...' : '⚡ Run Agent Loop'}
          </button>
        </div>

        {logs.length > 0 && (
          <div className="lumina-candidates" style={{ maxHeight: 150, overflowY: 'auto', background: '#0f0f13', padding: 8, borderRadius: 6, border: '1px solid #2d2d3a' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', marginBottom: 6, color: '#9ca3af' }}>Audit Trail Event Log</div>
            {logs.map((entry, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, padding: '2px 0', fontSize: '0.7rem', fontFamily: 'monospace', borderBottom: '1px solid #1f1f29' }}>
                <span style={{ color: '#6b7280' }}>{entry.time}</span>
                <span style={{ color: entry.status === 'error' ? '#ef4444' : entry.status === 'warn' ? '#f59e0b' : '#10b981' }}>
                  {entry.status === 'error' ? '❌' : entry.status === 'warn' ? '⚠' : '✓'} {entry.event}
                </span>
              </div>
            ))}
          </div>
        )}

        {lastSIRResult && lastSIRResult.topNodes.length > 0 && (
          <div className="lumina-candidates" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: '#9ca3af' }}>
              SIR Candidates ({Math.round(lastSIRResult.stagesMs.scouter + lastSIRResult.stagesMs.intentMatch + lastSIRResult.stagesMs.graphRank)}ms)
            </div>
            {lastSIRResult.topNodes.map((node, idx) => (
              <div key={node.luminaId} style={{ background: '#0f0f13', padding: 8, borderRadius: 6, border: '1px solid #2d2d3a', fontSize: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 'bold' }}>{node.label}</span>
                  <span style={{ color: '#3b82f6' }}>#{idx + 1} · {((node.score || 0) * 100).toFixed(0)}%</span>
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ background: '#1e293b', padding: '1px 4px', borderRadius: 3, fontSize: '0.65rem' }}>{node.tag}</span>
                  <span style={{ background: '#1e1b4b', padding: '1px 4px', borderRadius: 3, fontSize: '0.65rem' }}>{node.capability}</span>
                  {node.state && <span style={{ background: '#311042', padding: '1px 4px', borderRadius: 3, fontSize: '0.65rem' }}>{node.state}</span>}
                </div>
                <div style={{ color: '#6b7280', fontSize: '0.65rem', marginTop: 4, fontFamily: 'monospace' }}>{node.luminaId}</div>
              </div>
            ))}
          </div>
        )}

        {pendingApproval && (
          <div className="lumina-action-proposal" style={{ border: '1px solid #f59e0b', padding: 10, borderRadius: 6, background: 'rgba(245,158,11,0.05)' }}>
            <div style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: '0.8rem', marginBottom: 4 }}>🔐 Human Approval Required</div>
            <pre style={{ fontSize: '0.7rem', margin: 0, fontFamily: 'monospace', color: '#d1d5db' }}>
              {`actionType: "${pendingApproval.type}"\ntargetId: "${pendingApproval.targetNodeId}"\nconfidence: ${((pendingApproval.confidence || 0) * 100).toFixed(0)}%`}
            </pre>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={rejectPendingAction} style={{ flex: 1, padding: '4px 8px', background: '#374151', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: '0.75rem' }}>Reject</button>
              <button onClick={confirmPendingAction} style={{ flex: 1, padding: '4px 8px', background: '#f59e0b', border: 'none', borderRadius: 4, color: '#fff', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 'bold' }}>Approve</button>
            </div>
          </div>
        )}

        {error && (
          <div style={{ border: '1px solid #ef4444', padding: 10, borderRadius: 6, background: 'rgba(239,68,68,0.05)', fontSize: '0.75rem', color: '#ef4444' }}>
            <div style={{ fontWeight: 'bold' }}>❌ Loop Failure</div>
            <div style={{ fontFamily: 'monospace', marginTop: 4 }}>{error.message}</div>
          </div>
        )}
      </div>
    </aside>
  );
}
