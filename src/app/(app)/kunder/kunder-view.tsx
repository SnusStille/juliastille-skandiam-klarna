'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  Kanban,
  Loader2,
  Mail,
  Phone,
  Plus,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { ContactStageBadge, ContactTypeBadge, Tag } from '@/components/badges';
import { ConfirmDialog, EmptyState, Field, Modal, useToast } from '@/components/ui';
import { create, patch, remove } from '@/lib/client';
import {
  CONTACT_STAGE_LABEL,
  CONTACT_STAGE_ORDER,
  CONTACT_TYPE_LABEL,
  type Contact,
  type ContactStage,
  type ContactType,
  type Property,
} from '@/lib/types';
import { cn, formatSEK, initials, relativeTime } from '@/lib/utils';

const EMPTY = {
  name: '',
  email: '',
  phone: '',
  type: 'spekulant' as ContactType,
  stage: 'ny' as ContactStage,
  source: '',
  budget_min: '',
  budget_max: '',
  wanted_area: '',
  notes: '',
  tags: '',
  property_id: '',
};

type FormState = typeof EMPTY;

export function KunderView({
  contacts,
  properties,
}: {
  contacts: Contact[];
  properties: Property[];
}) {
  const router = useRouter();
  const params = useSearchParams();
  const { push } = useToast();

  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<ContactType | 'alla'>('alla');
  const [view, setView] = useState<'lista' | 'pipeline'>('lista');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState<Contact | null>(null);

  const focusId = params.get('fokus');
  useEffect(() => {
    if (!focusId) return;
    const found = contacts.find((c) => c.id === focusId);
    if (found) setDetail(found);
  }, [focusId, contacts]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  function openNew() {
    setEditing(null);
    setForm(EMPTY);
    setError(null);
    setFormOpen(true);
  }

  function openEdit(contact: Contact) {
    setEditing(contact);
    setForm({
      name: contact.name,
      email: contact.email,
      phone: contact.phone,
      type: contact.type,
      stage: contact.stage,
      source: contact.source,
      budget_min: contact.budget_min ? String(contact.budget_min) : '',
      budget_max: contact.budget_max ? String(contact.budget_max) : '',
      wanted_area: contact.wanted_area,
      notes: contact.notes,
      tags: contact.tags.join(', '),
      property_id: contact.property_id ?? '',
    });
    setError(null);
    setDetail(null);
    setFormOpen(true);
  }

  async function submit() {
    if (form.name.trim().length < 2) {
      setError('Ange ett namn.');
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      type: form.type,
      stage: form.stage,
      source: form.source.trim(),
      budget_min: form.budget_min ? Number(form.budget_min.replace(/\s/g, '')) : null,
      budget_max: form.budget_max ? Number(form.budget_max.replace(/\s/g, '')) : null,
      wanted_area: form.wanted_area.trim(),
      notes: form.notes.trim(),
      tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
      property_id: form.property_id || null,
      last_contact: new Date().toISOString(),
    };
    try {
      if (editing) {
        await patch('contacts', editing.id, payload);
        push('Kunden är uppdaterad.');
      } else {
        await create('contacts', payload);
        push('Kunden är tillagd.');
      }
      setFormOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara.');
    } finally {
      setBusy(false);
    }
  }

  async function moveStage(contact: Contact, stage: ContactStage) {
    try {
      await patch('contacts', contact.id, { stage });
      push(`${contact.name} flyttad till ${CONTACT_STAGE_LABEL[stage]}.`);
      router.refresh();
    } catch {
      push('Kunde inte flytta kunden.', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove('contacts', deleting.id);
      push('Kunden är borttagen.');
      setDeleting(null);
      setDetail(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort kunden.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contacts.filter((c) => {
      if (typeFilter !== 'alla' && c.type !== typeFilter) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.wanted_area.toLowerCase().includes(q) ||
        c.tags.some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [contacts, query, typeFilter]);

  const byStage = useMemo(() => {
    const map = new Map<ContactStage, Contact[]>();
    for (const stage of CONTACT_STAGE_ORDER) map.set(stage, []);
    for (const contact of filtered) map.get(contact.stage)?.push(contact);
    return map;
  }, [filtered]);

  return (
    <>
      <PageHeader
        eyebrow="Kundregister"
        title="Kunder"
        description={`${filtered.length} av ${contacts.length} kontakter. Håll koll på säljare, köpare och spekulanter i samma vy.`}
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Ny kund
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök på namn, telefon, e-post eller område…"
            className="field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            className="field w-auto min-w-[150px]"
            value={typeFilter}
            onChange={(e) =>
              setTypeFilter(e.target.value as ContactType | 'alla')
            }
            aria-label="Kundtyp"
          >
            <option value="alla">Alla typer</option>
            {Object.entries(CONTACT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-line bg-surface p-0.5">
            <button
              onClick={() => setView('lista')}
              aria-label="Lista"
              className={cn(
                'rounded px-2.5 py-1.5 text-sm transition',
                view === 'lista' ? 'bg-raised text-ink' : 'text-faint',
              )}
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('pipeline')}
              aria-label="Pipeline"
              className={cn(
                'rounded px-2.5 py-1.5 text-sm transition',
                view === 'pipeline' ? 'bg-raised text-ink' : 'text-faint',
              )}
            >
              <Kanban className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" />}
          title="Inga kunder matchar"
          message="Rensa sökningen eller lägg till en ny kontakt."
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Ny kund
            </button>
          }
        />
      ) : view === 'lista' ? (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {filtered.map((contact) => (
              <button
                key={contact.id}
                onClick={() => setDetail(contact)}
                className="flex w-full items-center gap-4 px-5 py-3.5 text-left transition hover:bg-raised/50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-xs font-semibold text-muted">
                  {initials(contact.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-ink">
                    {contact.name}
                  </span>
                  <span className="block truncate text-xs text-faint">
                    {[contact.phone, contact.email].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="hidden min-w-0 flex-1 text-xs text-muted sm:block">
                  {contact.wanted_area ||
                    (contact.budget_max
                      ? `Budget ${formatSEK(contact.budget_max, true)}`
                      : contact.source)}
                </span>
                <span className="hidden sm:block">
                  <ContactTypeBadge type={contact.type} />
                </span>
                <ContactStageBadge stage={contact.stage} />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="no-scrollbar -mx-1 flex gap-3.5 overflow-x-auto px-1 pb-3">
          {CONTACT_STAGE_ORDER.map((stage) => {
            const list = byStage.get(stage) ?? [];
            return (
              <div
                key={stage}
                className="flex w-[260px] shrink-0 flex-col rounded-lg border border-line bg-surface/70"
              >
                <div className="flex items-center justify-between border-b border-line px-3.5 py-2.5">
                  <span className="text-sm font-semibold text-ink">
                    {CONTACT_STAGE_LABEL[stage]}
                  </span>
                  <span className="text-xs text-faint tnum">{list.length}</span>
                </div>
                <div className="flex-1 space-y-2 p-2.5">
                  {list.map((contact) => {
                    const index = CONTACT_STAGE_ORDER.indexOf(stage);
                    const nextStage = CONTACT_STAGE_ORDER[index + 1];
                    const prevStage = CONTACT_STAGE_ORDER[index - 1];
                    return (
                      <div
                        key={contact.id}
                        className="rounded-md border border-line bg-surface p-3 shadow-subtle"
                      >
                        <button
                          onClick={() => setDetail(contact)}
                          className="block w-full text-left"
                        >
                          <p className="text-sm font-medium text-ink">
                            {contact.name}
                          </p>
                          <p className="mt-0.5 text-xs text-faint">
                            {contact.wanted_area || contact.source || '—'}
                          </p>
                          {contact.budget_max ? (
                            <p className="mt-1.5 text-xs font-medium text-brass tnum">
                              {formatSEK(contact.budget_max, true)}
                            </p>
                          ) : null}
                        </button>
                        <div className="mt-2.5 flex gap-1">
                          {prevStage && (
                            <button
                              onClick={() => moveStage(contact, prevStage)}
                              className="btn-quiet flex-1 justify-center"
                              title={`Flytta till ${CONTACT_STAGE_LABEL[prevStage]}`}
                            >
                              ←
                            </button>
                          )}
                          {nextStage && (
                            <button
                              onClick={() => moveStage(contact, nextStage)}
                              className="btn-quiet flex-1 justify-center"
                              title={`Flytta till ${CONTACT_STAGE_LABEL[nextStage]}`}
                            >
                              →
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {list.length === 0 && (
                    <p className="px-1 py-6 text-center text-xs text-faint">
                      Tomt
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Kunddetalj */}
      <Modal
        open={Boolean(detail)}
        onClose={() => setDetail(null)}
        title={detail?.name ?? ''}
        description={detail ? CONTACT_TYPE_LABEL[detail.type] : undefined}
        footer={
          detail && (
            <>
              <button
                className="btn-quiet mr-auto text-clay"
                onClick={() => setDeleting(detail)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Ta bort
              </button>
              <button className="btn-ghost" onClick={() => setDetail(null)}>
                Stäng
              </button>
              <button className="btn-primary" onClick={() => openEdit(detail)}>
                Redigera
              </button>
            </>
          )
        }
      >
        {detail && (
          <div className="space-y-5">
            <div className="flex flex-wrap gap-2">
              <ContactStageBadge stage={detail.stage} />
              <ContactTypeBadge type={detail.type} />
              {detail.tags.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {detail.phone && (
                <a
                  href={`tel:${detail.phone.replace(/\s/g, '')}`}
                  className="flex items-center gap-2.5 rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink transition hover:border-brass/40"
                >
                  <Phone className="h-4 w-4 text-faint" />
                  {detail.phone}
                </a>
              )}
              {detail.email && (
                <a
                  href={`mailto:${detail.email}`}
                  className="flex items-center gap-2.5 rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-ink transition hover:border-brass/40"
                >
                  <Mail className="h-4 w-4 shrink-0 text-faint" />
                  <span className="truncate">{detail.email}</span>
                </a>
              )}
            </div>

            <dl className="space-y-2.5 text-sm">
              {detail.wanted_area && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Sökområde</dt>
                  <dd className="text-right text-ink">{detail.wanted_area}</dd>
                </div>
              )}
              {(detail.budget_min || detail.budget_max) && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Budget</dt>
                  <dd className="text-right text-ink tnum">
                    {formatSEK(detail.budget_min)} – {formatSEK(detail.budget_max)}
                  </dd>
                </div>
              )}
              {detail.source && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Källa</dt>
                  <dd className="text-right text-ink">{detail.source}</dd>
                </div>
              )}
              {detail.property_id && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Objekt</dt>
                  <dd className="text-right">
                    <Link
                      href={`/objekt/${detail.property_id}`}
                      className="text-brass hover:underline"
                    >
                      {properties.find((p) => p.id === detail.property_id)
                        ?.address ?? 'Öppna'}
                    </Link>
                  </dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted">Senaste kontakt</dt>
                <dd className="text-right text-ink">
                  {relativeTime(detail.last_contact)}
                </dd>
              </div>
            </dl>

            {detail.notes && (
              <div className="rounded-md border border-line bg-canvas px-3.5 py-3">
                <p className="whitespace-pre-line text-sm leading-relaxed text-muted">
                  {detail.notes}
                </p>
              </div>
            )}

            <div>
              <span className="label">Flytta i pipeline</span>
              <div className="flex flex-wrap gap-1.5">
                {CONTACT_STAGE_ORDER.map((stage) => (
                  <button
                    key={stage}
                    onClick={() => {
                      void moveStage(detail, stage);
                      setDetail({ ...detail, stage });
                    }}
                    className={cn(
                      'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                      detail.stage === stage
                        ? 'border-brass bg-brass/12 text-brass'
                        : 'border-line text-muted hover:border-brass/40 hover:text-ink',
                    )}
                  >
                    {CONTACT_STAGE_LABEL[stage]}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Formulär */}
      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        wide
        title={editing ? 'Redigera kund' : 'Ny kund'}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setFormOpen(false)}>
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Namn" className="sm:col-span-1">
              <input
                className="field"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                placeholder="Anna Bergqvist"
              />
            </Field>
            <Field label="Telefon">
              <input
                className="field"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="070-123 45 67"
              />
            </Field>
            <Field label="E-post">
              <input
                className="field"
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                placeholder="namn@exempel.se"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Typ">
              <select
                className="field"
                value={form.type}
                onChange={(e) => set('type', e.target.value as ContactType)}
              >
                {Object.entries(CONTACT_TYPE_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Steg">
              <select
                className="field"
                value={form.stage}
                onChange={(e) => set('stage', e.target.value as ContactStage)}
              >
                {CONTACT_STAGE_ORDER.map((stage) => (
                  <option key={stage} value={stage}>
                    {CONTACT_STAGE_LABEL[stage]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Källa">
              <input
                className="field"
                value={form.source}
                onChange={(e) => set('source', e.target.value)}
                placeholder="Hemnet, visning, rekommendation…"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Budget från (kr)">
              <input
                className="field tnum"
                inputMode="numeric"
                value={form.budget_min}
                onChange={(e) => set('budget_min', e.target.value)}
              />
            </Field>
            <Field label="Budget till (kr)">
              <input
                className="field tnum"
                inputMode="numeric"
                value={form.budget_max}
                onChange={(e) => set('budget_max', e.target.value)}
              />
            </Field>
            <Field label="Sökområde">
              <input
                className="field"
                value={form.wanted_area}
                onChange={(e) => set('wanted_area', e.target.value)}
                placeholder="Södermalm, Vasastan"
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kopplat objekt">
              <select
                className="field"
                value={form.property_id}
                onChange={(e) => set('property_id', e.target.value)}
              >
                <option value="">Inget</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Taggar" hint="Separera med komma">
              <input
                className="field"
                value={form.tags}
                onChange={(e) => set('tags', e.target.value)}
                placeholder="Lånelöfte, Snabb affär"
              />
            </Field>
          </div>

          <Field label="Anteckningar">
            <textarea
              className="field min-h-[110px]"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort kunden?"
        message={`${deleting?.name ?? ''} tas bort permanent från kundregistret.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </>
  );
}
