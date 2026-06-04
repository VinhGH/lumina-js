// apps/learn-proof-runtime/src/pages/ResultPage.tsx

import React from 'react';
import type { Lesson } from '../store/app-store';

interface ResultPageProps {
  lesson: Lesson | null;
  onRestart: () => void;
}

export function ResultPage({ lesson, onRestart }: ResultPageProps) {
  const passed = true; // Mock: always pass in demo

  return (
    <div className="animate-fade-in" style={{ maxWidth: 640, margin: '0 auto' }}>
      <div className="card result-card">
        {/* Result Icon */}
        <div className={`result-icon ${passed ? 'pass' : 'fail'}`}>
          {passed ? '🏆' : '❌'}
        </div>

        {/* Status */}
        <h2 style={{ marginBottom: 'var(--spacing-sm)', textAlign: 'center' }}>
          {passed ? (
            <span className="text-gradient">Proof Verified!</span>
          ) : (
            'Proof Rejected'
          )}
        </h2>
        <p style={{ textAlign: 'center', marginBottom: 'var(--spacing-xl)' }}>
          {passed
            ? 'Your proof has been verified on-chain. You\'ve earned a credential for this lesson.'
            : 'Your proof did not pass verification. Review the feedback and try again.'}
        </p>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}>
          {[
            { label: 'Score', value: '94%', color: 'var(--color-success)' },
            { label: 'Time', value: '4:32', color: 'var(--color-brand-secondary)' },
            { label: 'Rank', value: '#12', color: 'var(--color-lumina-primary)' },
          ].map(({ label, value, color }) => (
            <div key={label} style={{
              background: 'var(--color-bg-elevated)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--spacing-md)',
              textAlign: 'center',
            }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color }}>{value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Audit Trail */}
        <div style={{
          background: 'var(--color-bg-elevated)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--radius-md)',
          padding: 'var(--spacing-md)',
          marginBottom: 'var(--spacing-xl)',
        }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
            Lumina.js Audit Trail
          </div>
          {[
            { time: '04:32.001', event: 'Intent received: "Submit my proof"', status: 'ok' },
            { time: '04:32.045', event: 'SIR Pipeline: 3 candidates found (89ms)', status: 'ok' },
            { time: '04:32.046', event: 'Planner: submit-proof proposed (confidence: 97%)', status: 'ok' },
            { time: '04:32.047', event: 'PolicyEngine: HIGH risk — human approval required', status: 'warn' },
            { time: '04:33.241', event: 'Human confirmed action', status: 'ok' },
            { time: '04:33.242', event: 'SecurityToken issued (HMAC-SHA256)', status: 'ok' },
            { time: '04:33.310', event: 'Action executed: submit-proof', status: 'ok' },
            { time: '04:33.311', event: 'Audit log entry created', status: 'ok' },
          ].map((entry) => (
            <div key={entry.time} style={{
              display: 'flex',
              gap: 'var(--spacing-sm)',
              padding: '3px 0',
              fontSize: '0.78rem',
              fontFamily: 'var(--font-mono)',
              borderBottom: '1px solid var(--color-border)',
            }}>
              <span style={{ color: 'var(--color-text-muted)', flexShrink: 0 }}>{entry.time}</span>
              <span style={{ color: entry.status === 'warn' ? 'var(--color-warning)' : 'var(--color-text-secondary)' }}>
                {entry.status === 'ok' ? '✓' : '⚠'} {entry.event}
              </span>
            </div>
          ))}
        </div>

        {/* Certificate Badge */}
        {passed && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(167,139,250,0.1))',
            border: '1px solid var(--color-border-active)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-lg)',
            textAlign: 'center',
            marginBottom: 'var(--spacing-xl)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-sm)' }}>🎖️</div>
            <div style={{ fontWeight: 700, color: 'var(--color-brand-secondary)' }}>Credential Earned</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
              {lesson?.title ?? 'Exercise'} — Learn Proof Certificate
            </div>
            <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--color-text-muted)', marginTop: 'var(--spacing-sm)' }}>
              0x7a3f...d92c
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
          <button
            id="restart-btn"
            className="btn btn-secondary btn-full"
            onClick={onRestart}
            data-lumina-state="result"
            data-lumina-semantic="action-button"
          >
            ↩ Back to Courses
          </button>
        </div>
      </div>
    </div>
  );
}
