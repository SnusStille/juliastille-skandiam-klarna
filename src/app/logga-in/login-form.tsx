'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, Loader2, LockKeyhole } from 'lucide-react';

export function LoginForm({ next }: { next?: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError(null);

    if (!password.trim()) {
      setError('Fyll i lösenordet.');
      return;
    }

    setBusy(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error ?? 'Kunde inte logga in.');
        setBusy(false);
        return;
      }

      const target = next && next.startsWith('/') ? next : '/';
      router.replace(target);
      router.refresh();
    } catch {
      setError('Kunde inte nå servern. Kontrollera din anslutning.');
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-7 space-y-4" noValidate>
      <div>
        <label htmlFor="password" className="label">
          Lösenord
        </label>
        <div className="relative">
          <LockKeyhole className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (error) setError(null);
            }}
            placeholder="••••••••"
            aria-invalid={Boolean(error)}
            className="field pl-10 pr-11"
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            aria-label={show ? 'Dölj lösenord' : 'Visa lösenord'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1.5 text-faint transition hover:text-ink"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-clay">
          {error}
        </p>
      )}

      <button type="submit" disabled={busy} className="btn-primary w-full">
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Loggar in…
          </>
        ) : (
          <>
            Logga in
            <ArrowRight className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
