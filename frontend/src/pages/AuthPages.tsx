import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';
import { NoIndex } from '../components/NoIndex';
import { useToast } from '../toast';
import { PasswordInput } from '../components/PasswordInput';

export function RegisterPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.register(username.trim(), password);
      setSession(res.token, res.user.username);
      toast.success('Account created', 'Welcome! Start building your portfolio.');
      navigate('/builder');
    } catch (err) {
      toast.error('Registration failed', err instanceof Error ? err.message : 'Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card">
      <NoIndex />
      <p className="auth-kicker">Adawwa</p>
      <h1>Create account</h1>
      <p className="muted">Username and password only — free to start.</p>
      <form onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required minLength={3} />
        </label>
        <label>
          Password
          <PasswordInput
            value={password}
            onChange={setPassword}
            required
            minLength={8}
            autoComplete="new-password"
          />
        </label>
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>
      <p className="muted">
        Already have an account? <Link to="/login">Log in</Link>
      </p>
    </main>
  );
}

export function LoginPage() {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api.login(username.trim(), password);
      setSession(res.token, res.user.username);
      toast.success('Welcome back', `Signed in as ${res.user.username}.`);
      navigate('/builder');
    } catch (err) {
      toast.error('Login failed', err instanceof Error ? err.message : 'Check your credentials.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-card">
      <NoIndex />
      <p className="auth-kicker">Adawwa</p>
      <h1>Log in</h1>
      <p className="muted">Welcome back — continue editing your page.</p>
      <form onSubmit={onSubmit}>
        <label>
          Username
          <input value={username} onChange={(e) => setUsername(e.target.value)} required />
        </label>
        <label>
          Password
          <PasswordInput
            value={password}
            onChange={setPassword}
            required
            autoComplete="current-password"
          />
        </label>
        <button className="btn btn-primary" disabled={busy} type="submit">
          {busy ? 'Signing in…' : 'Log in'}
        </button>
      </form>
      <p className="muted">
        New here? <Link to="/register">Register</Link>
      </p>
    </main>
  );
}
