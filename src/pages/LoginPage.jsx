import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Activity, User, Lock, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { user, login, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) navigate('/', { replace: true });
  }, [user, navigate]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!username || !password) return setError('Please enter your username and password.');
    setSubmitting(true);
    setError('');
    try {
      await login(username.trim(), password);
      navigate('/', { replace: true });
    } catch (err) {
      if (['auth/user-not-found','auth/wrong-password','auth/invalid-credential'].includes(err.code)) {
        setError('Invalid username or password. Please try again.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('Too many failed attempts. Please try again later.');
      } else {
        setError('Login failed. Please check your credentials.');
      }
    }
    setSubmitting(false);
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', position: 'relative', overflow: 'hidden'
    }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%,-50%)',
        width: 600, height: 600, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,106,247,0.08) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div className="card fade-in" style={{ width: '100%', maxWidth: 420, padding: '48px 40px', position: 'relative' }}>
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 32 }}>
          <div style={{
            width: 56, height: 56, background: 'var(--accent)', borderRadius: 14,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px var(--accent-glow)'
          }}>
            <Activity size={26} color="#fff" />
          </div>
        </div>

        <h1 style={{ fontFamily: 'Syne, sans-serif', fontWeight: 800, fontSize: 26, marginBottom: 6, textAlign: 'center' }}>
          Welcome back
        </h1>
        <p style={{ color: 'var(--text2)', fontSize: 14, marginBottom: 36, textAlign: 'center' }}>
          Sign in to Team Activity Tracker
        </p>

        <form onSubmit={handleSubmit}>
          {/* Username */}
          <div style={{ marginBottom: 16 }}>
            <label className="label">Username</label>
            <div style={{ position: 'relative' }}>
              <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input className="input" type="text" placeholder="e.g. john"
                value={username} onChange={e => setUsername(e.target.value)}
                style={{ paddingLeft: 36 }} autoComplete="username" autoFocus
                autoCapitalize="none" spellCheck={false} />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: 24 }}>
            <label className="label">Password</label>
            <div style={{ position: 'relative' }}>
              <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)', pointerEvents: 'none' }} />
              <input className="input" type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password" value={password}
                onChange={e => setPassword(e.target.value)}
                style={{ paddingLeft: 36, paddingRight: 40 }} autoComplete="current-password" />
              <button type="button" onClick={() => setShowPassword(v => !v)}
                style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4 }}>
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              marginBottom: 20, padding: '10px 14px', borderRadius: 8, fontSize: 13,
              background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)',
              color: 'var(--danger)'
            }}>{error}</div>
          )}

          <button type="submit" className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: 15 }}
            disabled={submitting || loading}>
            {submitting ? <><div className="spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>

        <div style={{ marginTop: 32, padding: '16px', borderRadius: 10, background: 'var(--surface2)', border: '1px solid var(--border)' }}>
          <p style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.7 }}>
            🔒 Access is by invitation only.<br />
            Contact your admin to get an account.
          </p>
        </div>
      </div>
    </div>
  );
}
