'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Check,
  CircleAlert,
  Database,
  Loader2,
  LogOut,
  Moon,
  Sparkles,
  Sun,
} from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { Field, SectionTitle, useToast } from '@/components/ui';
import { useTheme } from '@/components/theme';
import { apiPatch } from '@/lib/client';
import type { Profile } from '@/lib/types';
import { cn } from '@/lib/utils';

function StatusRow({
  ok,
  title,
  okText,
  offText,
  icon,
}: {
  ok: boolean;
  title: string;
  okText: string;
  offText: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3.5 py-3.5 first:pt-0 last:pb-0">
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          ok ? 'bg-forest/12 text-forest' : 'bg-brass/12 text-brass',
        )}
      >
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 text-sm font-medium text-ink">
          {title}
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
              ok ? 'bg-forest/12 text-forest' : 'bg-brass/12 text-brass',
            )}
          >
            {ok ? <Check className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
            {ok ? 'Aktiv' : 'Ej kopplad'}
          </span>
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted">
          {ok ? okText : offText}
        </p>
      </div>
    </div>
  );
}

export function InstallningarView({
  profile,
  supabaseReady,
  claudeReady,
  model,
}: {
  profile: Profile;
  supabaseReady: boolean;
  claudeReady: boolean;
  model: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const { theme, setTheme } = useTheme();

  const [form, setForm] = useState({
    name: profile.name,
    title: profile.title,
    agency: profile.agency,
    email: profile.email,
    phone: profile.phone,
    bio: profile.bio,
    commission_rate: String(profile.commission_rate),
    goal_sales: String(profile.goal_sales),
    goal_revenue: String(profile.goal_revenue),
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  async function save() {
    setBusy(true);
    setError(null);
    try {
      await apiPatch('/api/profile', {
        name: form.name.trim(),
        title: form.title.trim(),
        agency: form.agency.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
        commission_rate: Number(form.commission_rate) || 0,
        goal_sales: Number(form.goal_sales) || 0,
        goal_revenue: Number(form.goal_revenue) || 0,
      });
      push('Profilen är sparad.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara profilen.');
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/logga-in');
      router.refresh();
    } catch {
      setLoggingOut(false);
      push('Kunde inte logga ut.', 'error');
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Konto"
        title="Inställningar"
        description="Din profil, utseende och kopplingar till Supabase och Claude."
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_1fr]">
        <section className="card card-pad">
          <SectionTitle>Profil</SectionTitle>
          {error && (
            <p role="alert" className="mb-4 rounded-md border border-clay/30 bg-clay/8 px-3.5 py-2.5 text-sm text-clay">
              {error}
            </p>
          )}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Namn">
              <input
                className="field"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </Field>
            <Field label="Titel">
              <input
                className="field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </Field>
            <Field label="Byrå">
              <input
                className="field"
                value={form.agency}
                onChange={(e) => setForm({ ...form, agency: e.target.value })}
              />
            </Field>
            <Field label="E-post">
              <input
                type="email"
                className="field"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </Field>
            <Field label="Telefon">
              <input
                className="field"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </Field>
            <Field label="Provision (%)">
              <input
                type="number"
                step="0.1"
                min="0"
                className="field"
                value={form.commission_rate}
                onChange={(e) =>
                  setForm({ ...form, commission_rate: e.target.value })
                }
              />
            </Field>
            <Field label="Mål: sålda objekt / år">
              <input
                type="number"
                min="0"
                className="field"
                value={form.goal_sales}
                onChange={(e) => setForm({ ...form, goal_sales: e.target.value })}
              />
            </Field>
            <Field label="Mål: arvode / år (kr)">
              <input
                type="number"
                min="0"
                className="field"
                value={form.goal_revenue}
                onChange={(e) =>
                  setForm({ ...form, goal_revenue: e.target.value })
                }
              />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Presentation" hint="Används i mallar och av assistenten">
              <textarea
                className="field min-h-[120px]"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </Field>
          </div>
          <div className="mt-5 flex justify-end border-t border-line pt-4">
            <button className="btn-primary" onClick={save} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Spara profil
            </button>
          </div>
        </section>

        <div className="space-y-4">
          <section className="card card-pad">
            <SectionTitle>Utseende</SectionTitle>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border px-4 py-5 text-sm font-medium transition',
                  theme === 'light'
                    ? 'border-brass bg-brass/8 text-ink'
                    : 'border-line text-muted hover:text-ink',
                )}
              >
                <Sun className="h-4.5 w-4.5" />
                Ljust
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  'flex flex-col items-center gap-2 rounded-lg border px-4 py-5 text-sm font-medium transition',
                  theme === 'dark'
                    ? 'border-brass bg-brass/8 text-ink'
                    : 'border-line text-muted hover:text-ink',
                )}
              >
                <Moon className="h-4.5 w-4.5" />
                Mörkt
              </button>
            </div>
          </section>

          <section className="card card-pad">
            <SectionTitle>Kopplingar</SectionTitle>
            <div className="divide-y divide-line">
              <StatusRow
                ok={supabaseReady}
                icon={<Database className="h-4 w-4" />}
                title="Supabase"
                okText="Appen läser och skriver mot din Supabase-databas."
                offText="Appen kör på demodata. Fyll i NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY och SUPABASE_SERVICE_ROLE_KEY i .env.local och kör supabase/migration.sql."
              />
              <StatusRow
                ok={claudeReady}
                icon={<Sparkles className="h-4 w-4" />}
                title="Claude"
                okText={`Assistenten svarar med modellen ${model}.`}
                offText="Lägg till ANTHROPIC_API_KEY i .env.local och i Vercel för att aktivera Stille AI."
              />
            </div>
          </section>

          <section className="card card-pad">
            <SectionTitle>Session</SectionTitle>
            <p className="mb-4 text-xs leading-relaxed text-muted">
              Du är inloggad som {profile.name}. Sessionen gäller i 30 dagar.
            </p>
            <button
              className="btn-ghost w-full text-clay"
              onClick={logout}
              disabled={loggingOut}
            >
              {loggingOut ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <LogOut className="h-4 w-4" />
              )}
              Logga ut
            </button>
          </section>

          <p className="px-1 text-center text-[11px] text-faint">
            Developed by Stilledev
          </p>
        </div>
      </div>
    </>
  );
}
