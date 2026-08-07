'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { ViewingTypeBadge } from '@/components/badges';
import { ConfirmDialog, EmptyState, Field, Modal, useToast } from '@/components/ui';
import { create, patch, remove } from '@/lib/client';
import {
  VIEWING_TYPE_LABEL,
  type Property,
  type Viewing,
  type ViewingType,
} from '@/lib/types';
import {
  cn,
  formatDate,
  formatTime,
  isSameDay,
  toInputDateTime,
} from '@/lib/utils';

const WEEKDAYS = ['Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör', 'Sön'];

function startOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

function defaultStart() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(17, 0, 0, 0);
  return toInputDateTime(d.toISOString());
}

function plusHour(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  d.setMinutes(d.getMinutes() + 45);
  return toInputDateTime(d.toISOString());
}

export function VisningarView({
  viewings,
  properties,
}: {
  viewings: Viewing[];
  properties: Property[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Viewing | null>(null);
  const [deleting, setDeleting] = useState<Viewing | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState({
    property_id: properties[0]?.id ?? '',
    title: '',
    start_at: defaultStart(),
    end_at: plusHour(defaultStart()),
    type: 'oppen' as ViewingType,
    notes: '',
    attendees: '',
  });

  const days = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        return d;
      }),
    [weekStart],
  );

  const sorted = useMemo(
    () =>
      [...viewings].sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
      ),
    [viewings],
  );

  const now = Date.now();
  const upcoming = sorted.filter(
    (v) => new Date(v.start_at).getTime() >= now - 3_600_000,
  );
  const past = sorted
    .filter((v) => new Date(v.start_at).getTime() < now - 3_600_000)
    .reverse();

  const totalAttendees = viewings.reduce((sum, v) => sum + v.attendees, 0);

  function openNew(date?: Date) {
    setEditing(null);
    const base = date ? new Date(date) : new Date(new Date().getTime() + 86_400_000);
    if (date) base.setHours(17, 0, 0, 0);
    const start = toInputDateTime(base.toISOString());
    setForm({
      property_id: properties[0]?.id ?? '',
      title: '',
      start_at: start,
      end_at: plusHour(start),
      type: 'oppen',
      notes: '',
      attendees: '',
    });
    setError(null);
    setOpen(true);
  }

  function openEdit(viewing: Viewing) {
    setEditing(viewing);
    setForm({
      property_id: viewing.property_id,
      title: viewing.title,
      start_at: toInputDateTime(viewing.start_at),
      end_at: toInputDateTime(viewing.end_at),
      type: viewing.type,
      notes: viewing.notes,
      attendees: viewing.attendees ? String(viewing.attendees) : '',
    });
    setError(null);
    setOpen(true);
  }

  async function submit() {
    if (!form.property_id) return setError('Välj ett objekt.');
    if (!form.start_at || !form.end_at) return setError('Ange start- och sluttid.');
    if (new Date(form.end_at) <= new Date(form.start_at))
      return setError('Sluttiden måste vara efter starttiden.');

    const property = properties.find((p) => p.id === form.property_id);
    const payload = {
      property_id: form.property_id,
      title: form.title.trim() || `Visning ${property?.address ?? ''}`.trim(),
      start_at: new Date(form.start_at).toISOString(),
      end_at: new Date(form.end_at).toISOString(),
      type: form.type,
      notes: form.notes.trim(),
      attendees: form.attendees ? Number(form.attendees) : 0,
    };

    setBusy(true);
    setError(null);
    try {
      if (editing) {
        await patch('viewings', editing.id, payload);
        push('Visningen är uppdaterad.');
      } else {
        await create('viewings', payload);
        push('Visningen är inbokad.');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara.');
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove('viewings', deleting.id);
      push('Visningen är borttagen.');
      setDeleting(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort visningen.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const weekLabel = `${days[0].toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
  })} – ${days[6].toLocaleDateString('sv-SE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;

  return (
    <>
      <PageHeader
        eyebrow="Kalender"
        title="Visningar"
        description={`${upcoming.length} kommande visningar · ${totalAttendees} registrerade besökare totalt.`}
        actions={
          <button className="btn-primary" onClick={() => openNew()}>
            <Plus className="h-4 w-4" />
            Boka visning
          </button>
        }
      />

      {/* Veckovy */}
      <section className="card mb-6 overflow-hidden">
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
            <CalendarDays className="h-4 w-4 text-brass" />
            {weekLabel}
          </h2>
          <div className="flex items-center gap-1.5">
            <button
              className="btn-quiet"
              onClick={() => setWeekStart(startOfWeek(new Date()))}
            >
              Idag
            </button>
            <button
              aria-label="Föregående vecka"
              className="rounded-md border border-line p-1.5 text-muted transition hover:bg-raised hover:text-ink"
              onClick={() => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() - 7);
                setWeekStart(d);
              }}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              aria-label="Nästa vecka"
              className="rounded-md border border-line p-1.5 text-muted transition hover:bg-raised hover:text-ink"
              onClick={() => {
                const d = new Date(weekStart);
                d.setDate(d.getDate() + 7);
                setWeekStart(d);
              }}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 divide-line sm:grid-cols-4 lg:grid-cols-7 lg:divide-x">
          {days.map((day, index) => {
            const items = sorted.filter((v) =>
              isSameDay(new Date(v.start_at), day),
            );
            const today = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  'min-h-[132px] border-b border-line p-2.5 lg:border-b-0',
                  today && 'bg-brass/5',
                )}
              >
                <button
                  onClick={() => openNew(day)}
                  className="group mb-2 flex w-full items-baseline gap-1.5"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-faint">
                    {WEEKDAYS[index]}
                  </span>
                  <span
                    className={cn(
                      'font-display text-sm font-semibold',
                      today ? 'text-brass' : 'text-ink',
                    )}
                  >
                    {day.getDate()}
                  </span>
                  <Plus className="ml-auto h-3.5 w-3.5 text-transparent transition group-hover:text-faint" />
                </button>
                <div className="space-y-1.5">
                  {items.map((viewing) => {
                    const property = properties.find(
                      (p) => p.id === viewing.property_id,
                    );
                    return (
                      <button
                        key={viewing.id}
                        onClick={() => openEdit(viewing)}
                        className="block w-full rounded border-l-2 border-brass bg-raised px-2 py-1.5 text-left transition hover:bg-brass/10"
                      >
                        <span className="block text-[11px] font-semibold text-brass tnum">
                          {formatTime(viewing.start_at)}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-ink">
                          {property?.address ?? viewing.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Listor */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="card">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="font-display text-[15px] font-semibold text-ink">
              Kommande
            </h2>
          </div>
          <div className="divide-y divide-line">
            {upcoming.map((viewing) => {
              const property = properties.find(
                (p) => p.id === viewing.property_id,
              );
              return (
                <div key={viewing.id} className="flex gap-3.5 px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink">
                      {property ? (
                        <Link
                          href={`/objekt/${property.id}`}
                          className="transition hover:text-brass"
                        >
                          {property.address}
                        </Link>
                      ) : (
                        viewing.title
                      )}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDate(viewing.start_at)} ·{' '}
                        {formatTime(viewing.start_at)}–{formatTime(viewing.end_at)}
                      </span>
                      {viewing.attendees > 0 && (
                        <span className="inline-flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {viewing.attendees}
                        </span>
                      )}
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <ViewingTypeBadge type={viewing.type} />
                      {viewing.notes && (
                        <span className="truncate text-xs text-faint">
                          {viewing.notes}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      aria-label="Redigera"
                      onClick={() => openEdit(viewing)}
                      className="rounded p-1.5 text-faint transition hover:bg-raised hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Ta bort"
                      onClick={() => setDeleting(viewing)}
                      className="rounded p-1.5 text-faint transition hover:bg-clay/10 hover:text-clay"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
            {upcoming.length === 0 && (
              <div className="p-5">
                <EmptyState
                  icon={<CalendarDays className="h-5 w-5" />}
                  title="Inga inbokade visningar"
                  message="Boka en visning så syns den här och i veckovyn."
                  action={
                    <button className="btn-primary" onClick={() => openNew()}>
                      <Plus className="h-4 w-4" />
                      Boka visning
                    </button>
                  }
                />
              </div>
            )}
          </div>
        </section>

        <section className="card">
          <div className="border-b border-line px-5 py-3.5">
            <h2 className="font-display text-[15px] font-semibold text-ink">
              Genomförda
            </h2>
          </div>
          <div className="divide-y divide-line">
            {past.slice(0, 12).map((viewing) => {
              const property = properties.find(
                (p) => p.id === viewing.property_id,
              );
              return (
                <button
                  key={viewing.id}
                  onClick={() => openEdit(viewing)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-left transition hover:bg-raised/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {property?.address ?? viewing.title}
                    </span>
                    <span className="block text-xs text-faint">
                      {formatDate(viewing.start_at)}
                    </span>
                  </span>
                  <span className="shrink-0 text-xs text-muted tnum">
                    {viewing.attendees} besökare
                  </span>
                </button>
              );
            })}
            {past.length === 0 && (
              <p className="px-5 py-10 text-center text-sm text-faint">
                Inga genomförda visningar ännu.
              </p>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Redigera visning' : 'Boka visning'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Avbryt
            </button>
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Spara
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {error && (
            <p role="alert" className="rounded-md border border-clay/30 bg-clay/8 px-3.5 py-2.5 text-sm text-clay">
              {error}
            </p>
          )}
          <Field label="Objekt">
            <select
              className="field"
              value={form.property_id}
              onChange={(e) => setForm({ ...form, property_id: e.target.value })}
            >
              {properties.length === 0 && <option value="">Inga objekt</option>}
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Start">
              <input
                type="datetime-local"
                className="field"
                value={form.start_at}
                onChange={(e) =>
                  setForm({
                    ...form,
                    start_at: e.target.value,
                    end_at: plusHour(e.target.value),
                  })
                }
              />
            </Field>
            <Field label="Slut">
              <input
                type="datetime-local"
                className="field"
                value={form.end_at}
                onChange={(e) => setForm({ ...form, end_at: e.target.value })}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Typ">
              <select
                className="field"
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as ViewingType })
                }
              >
                {Object.entries(VIEWING_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Antal besökare" hint="Fyll i efter visningen">
              <input
                className="field tnum"
                inputMode="numeric"
                value={form.attendees}
                onChange={(e) => setForm({ ...form, attendees: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Rubrik" hint="Lämna tomt för automatisk rubrik">
            <input
              className="field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </Field>
          <Field label="Noteringar">
            <textarea
              className="field min-h-[90px]"
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Kaffe och bullar, extra nycklar hos grannen…"
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort visningen?"
        message="Visningen tas bort permanent från kalendern."
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </>
  );
}
