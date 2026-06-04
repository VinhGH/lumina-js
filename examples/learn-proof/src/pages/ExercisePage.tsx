// apps/learn-proof-runtime/src/pages/ExercisePage.tsx

import React, { useState } from 'react';
import type { Course, Lesson } from '../store/app-store';

interface ExercisePageProps {
  lesson: Lesson;
  course: Course;
  onSubmit: () => void;
  onBack: () => void;
}

export function ExercisePage({ lesson, course, onSubmit, onBack }: ExercisePageProps) {
  const [proof, setProof] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmitClick = () => {
    if (!proof.trim()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setIsSubmitting(true);
    setShowConfirm(false);
    await new Promise((r) => setTimeout(r, 1500));
    onSubmit();
  };

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-xl)' }}>
        <button className="btn btn-secondary btn-sm" onClick={onBack} id="back-to-lessons">
          ← Back
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 4 }}>
            <span className="badge badge-brand">Exercise</span>
            <span className="badge badge-warning">High Risk Action</span>
          </div>
          <h2 style={{ fontSize: '1.2rem' }}>{lesson.title}</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{course.title}</p>
        </div>
      </div>

      {/* Security Notice */}
      <div style={{
        background: 'rgba(245,158,11,0.06)',
        border: '1px solid rgba(245,158,11,0.2)',
        borderRadius: 'var(--radius-md)',
        padding: 'var(--spacing-md)',
        marginBottom: 'var(--spacing-xl)',
        display: 'flex',
        gap: 'var(--spacing-md)',
        fontSize: '0.85rem',
      }}>
        <span style={{ fontSize: '1.25rem' }}>🔐</span>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--color-warning)', marginBottom: 4 }}>
            Lumina.js Zero-Trust Notice
          </div>
          <div style={{ color: 'var(--color-text-secondary)' }}>
            Submitting a proof is a <strong style={{ color: 'var(--color-warning)' }}>high-risk action</strong>. 
            The Lumina.js Security Engine will require your explicit confirmation before execution. 
            This action will be HMAC-signed and logged to the audit trail.
          </div>
        </div>
      </div>

      <div className="exercise-layout">
        {/* Problem Description */}
        <div className="exercise-panel">
          <div className="exercise-description">
            <h3>📋 Problem Statement</h3>
            <p style={{ marginBottom: 'var(--spacing-md)' }}>
              Implement a cryptographic hash function verifier. Given a hash and plaintext input, 
              write a proof demonstrating how SHA-256 produces a deterministic output.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  Input
                </div>
                <div className="code-block">
                  {`plaintext: "lumina-js-2026"\nhash: "a3f8b7..."`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  Expected Output Format
                </div>
                <div className="code-block">
                  {`GIVEN: input "lumina-js-2026"\nAPPLY: SHA-256 compression function\nPROVE: H(input) = "a3f8b7..."\nBECAUSE: [your reasoning]`}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 4 }}>
                  Key Concepts
                </div>
                <ul style={{ paddingLeft: 'var(--spacing-lg)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <li>Deterministic output — same input always produces same hash</li>
                  <li>Avalanche effect — 1-bit change in input → completely different hash</li>
                  <li>One-way function — cannot reverse hash to find input</li>
                  <li>Fixed output length — always 256 bits regardless of input</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Proof Editor */}
        <div className="exercise-panel">
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div className="card-header" style={{ marginBottom: 0 }}>
              <div>
                <div className="card-title">Your Proof</div>
                <div className="card-subtitle">Write your formal proof below</div>
              </div>
              <span className={`badge ${proof.length > 50 ? 'badge-success' : 'badge-warning'}`}>
                {proof.length} chars
              </span>
            </div>

            <textarea
              id="proof-textarea"
              className="form-input form-textarea"
              style={{ flex: 1, minHeight: 300 }}
              placeholder={"GIVEN: input \"lumina-js-2026\"\nAPPLY: SHA-256...\nPROVE: ...\nBECAUSE: ..."}
              value={proof}
              onChange={(e) => setProof(e.target.value)}
              aria-label="Your proof (write your solution here)"
              data-lumina-state="submit-proof"
              data-lumina-semantic="primary-input"
              name="proof"
            />

            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                id="save-draft-btn"
                className="btn btn-secondary"
                onClick={() => alert('Draft saved!')}
                data-lumina-state="submit-proof"
                data-lumina-semantic="action-button"
              >
                💾 Save Draft
              </button>
              <button
                id="submit-proof-btn"
                className="btn btn-primary ml-auto"
                onClick={handleSubmitClick}
                disabled={!proof.trim() || isSubmitting}
                aria-label="Submit Proof"
                data-lumina-state="submit-proof"
                data-lumina-semantic="submit-button"
                style={{ minWidth: 140 }}
              >
                {isSubmitting ? (
                  <><span className="spinner" /> Submitting…</>
                ) : (
                  '🔐 Submit Proof'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          animation: 'fade-in 0.2s ease',
        }}>
          <div style={{
            background: 'var(--color-bg-card)',
            border: '1px solid rgba(245,158,11,0.3)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--spacing-2xl)',
            maxWidth: 480,
            width: '90%',
            boxShadow: '0 0 60px rgba(245,158,11,0.15)',
          }}>
            <div style={{ fontSize: '2rem', marginBottom: 'var(--spacing-lg)', textAlign: 'center' }}>🔐</div>
            <h3 style={{ textAlign: 'center', marginBottom: 'var(--spacing-sm)' }}>
              Security Confirmation Required
            </h3>
            <p style={{ textAlign: 'center', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-xl)', fontSize: '0.9rem' }}>
              Lumina.js Security Engine detected a <strong style={{ color: 'var(--color-warning)' }}>high-risk action</strong>: 
              <code style={{ fontFamily: 'var(--font-mono)', background: 'var(--color-bg-input)', padding: '2px 6px', borderRadius: 4 }}> submit-proof</code>.
              <br /><br />
              Your explicit confirmation is required before this action executes.
            </p>
            <div className="lumina-action-code" style={{ marginBottom: 'var(--spacing-lg)', fontSize: '0.78rem' }}>
              {`actionType: "submit-proof"\ncapability: "submit-proof"\nriskLevel: "high"\nrequiresHumanApproval: true\nsignature: HMAC-SHA256(...)`}
            </div>
            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
              <button
                id="cancel-submit-btn"
                className="btn btn-secondary btn-full"
                onClick={() => setShowConfirm(false)}
                data-lumina-state="submit-proof"
                data-lumina-semantic="cancel-button"
              >
                Cancel
              </button>
              <button
                id="confirm-submit-btn"
                className="btn btn-primary btn-full"
                onClick={handleConfirm}
                data-lumina-state="submit-proof"
                data-lumina-semantic="submit-button"
              >
                ✓ Confirm & Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
