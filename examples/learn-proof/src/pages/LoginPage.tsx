// apps/learn-proof-runtime/src/pages/LoginPage.tsx

import React, { useState } from 'react';

interface LoginPageProps {
  onLogin: (email: string) => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState('student@learnproof.dev');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setIsLoading(true);
    setError('');
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    onLogin(email);
  };

  return (
    <div className="auth-layout">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎓</div>
          <div className="auth-logo-text">
            <h1>Learn Proof</h1>
            <p>Blockchain Learning Platform</p>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-md)',
            padding: 'var(--spacing-sm) var(--spacing-md)',
            color: 'var(--color-error)',
            fontSize: '0.875rem',
            marginBottom: 'var(--spacing-lg)',
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-lg)' }}>
          <div className="form-group">
            <label htmlFor="login-email" className="form-label">Email address</label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="you@learnproof.dev"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-label="Email address"
              data-lumina-state="login"
              data-lumina-semantic="primary-input"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password" className="form-label">Password</label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-label="Password"
              data-lumina-state="login"
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <a
              href="#"
              id="forgot-password-link"
              style={{ fontSize: '0.85rem', color: 'var(--color-brand-secondary)', textDecoration: 'none' }}
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </a>
          </div>

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary btn-lg btn-full"
            disabled={isLoading}
            aria-label="Sign In"
            data-lumina-state="login"
            data-lumina-semantic="submit-button"
          >
            {isLoading ? (
              <><span className="spinner" /> Signing in…</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        <hr className="divider" style={{ margin: 'var(--spacing-xl) 0' }} />

        <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
          <div style={{ marginBottom: 'var(--spacing-sm)', fontFamily: 'var(--font-mono)', color: 'var(--color-lumina-primary)' }}>
            Powered by Lumina.js Runtime
          </div>
          <div>AI-assisted workflow navigation with Zero-Trust security</div>
        </div>
      </div>
    </div>
  );
}
