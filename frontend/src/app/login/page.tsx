'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api';
import { saveAuth, getToken } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode]               = useState<'login' | 'register'>('login');
  const [username, setUsername]       = useState('');
  const [password, setPassword]       = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  useEffect(() => {
    if (getToken()) router.replace('/');
  }, [router]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = mode === 'login'
        ? await api.login(username, password)
        : await api.register(username, password, displayName);
      saveAuth(result.token, result.user);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Помилка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-header">
          <div className="login-hazard">☢</div>
          <h1 className="login-title">S.T.A.L.K.E.R. 2</h1>
          <div className="login-subtitle">КОЛЕКЦІЙНІ КАРТИ · ATB · 2026</div>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab${mode === 'login' ? ' active' : ''}`}
            onClick={() => { setMode('login'); setError(''); }}
          >Вхід</button>
          <button
            type="button"
            className={`login-tab${mode === 'register' ? ' active' : ''}`}
            onClick={() => { setMode('register'); setError(''); }}
          >Реєстрація</button>
        </div>

        <form onSubmit={submit} className="login-form">
          <label className="login-label">Нікнейм</label>
          <input
            className="login-input"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="stalker_id"
            maxLength={30}
            autoComplete="username"
            required
          />

          {mode === 'register' && (
            <>
              <label className="login-label">Відображуване ім&apos;я</label>
              <input
                className="login-input"
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Мисливець"
                maxLength={40}
                required
              />
            </>
          )}

          <label className="login-label">Пароль</label>
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            maxLength={100}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            required
          />

          {error && <div className="login-error">{error}</div>}

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? '…' : mode === 'login' ? 'УВІЙТИ' : 'ЗАРЕЄСТРУВАТИСЬ'}
          </button>
        </form>
      </div>
    </div>
  );
}
