'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Copy, FileText, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { TemplateCategoryBadge } from '@/components/badges';
import { ConfirmDialog, EmptyState, Field, Modal, useToast } from '@/components/ui';
import { create, patch, remove } from '@/lib/client';
import {
  TEMPLATE_CATEGORY_LABEL,
  type TemplateCategory,
  type TemplateItem,
} from '@/lib/types';
import { cn } from '@/lib/utils';

/** Platshållare som byts ut när mallen kopieras. */
const PLACEHOLDERS = ['{{kund}}', '{{adress}}', '{{pris}}', '{{tid}}', '{{mäklare}}'];

export function MallarView({
  templates,
  userName,
}: {
  templates: TemplateItem[];
  userName: string;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [category, setCategory] = useState<TemplateCategory | 'alla'>('alla');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<TemplateItem | null>(null);
  const [deleting, setDeleting] = useState<TemplateItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    category: 'mail' as TemplateCategory,
    body: '',
  });

  const filtered = useMemo(
    () =>
      category === 'alla'
        ? templates
        : templates.filter((t) => t.category === category),
    [templates, category],
  );

  function openNew() {
    setEditing(null);
    setForm({ title: '', category: 'mail', body: '' });
    setError(null);
    setOpen(true);
  }

  function openEdit(template: TemplateItem) {
    setEditing(template);
    setForm({
      title: template.title,
      category: template.category,
      body: template.body,
    });
    setError(null);
    setOpen(true);
  }

  async function submit() {
    if (form.title.trim().length < 2) return setError('Ange en rubrik.');
    if (form.body.trim().length < 5) return setError('Skriv ett innehåll.');
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      category: form.category,
      body: form.body,
    };
    try {
      if (editing) {
        await patch('templates', editing.id, payload);
        push('Mallen är uppdaterad.');
      } else {
        await create('templates', payload);
        push('Mallen är sparad.');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara.');
    } finally {
      setBusy(false);
    }
  }

  function copy(template: TemplateItem) {
    const text = template.body.replace(/\{\{mäklare\}\}/g, userName);
    navigator.clipboard?.writeText(text);
    setCopiedId(template.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove('templates', deleting.id);
      push('Mallen är borttagen.');
      setDeleting(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort mallen.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Bibliotek"
        title="Mallar"
        description="Färdiga texter för mail, SMS, annonser och checklistor. Använd platshållare som {{kund}} och {{adress}} så går det snabbt att anpassa."
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Ny mall
          </button>
        }
      />

      <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto border-b border-line pb-px">
        {(['alla', ...Object.keys(TEMPLATE_CATEGORY_LABEL)] as const).map(
          (key) => {
            const count =
              key === 'alla'
                ? templates.length
                : templates.filter((t) => t.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setCategory(key as TemplateCategory | 'alla')}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
                  category === key
                    ? 'border-brass text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {key === 'alla'
                  ? 'Alla'
                  : TEMPLATE_CATEGORY_LABEL[key as TemplateCategory]}
                <span className="ml-1.5 text-xs text-faint tnum">{count}</span>
              </button>
            );
          },
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Inga mallar i den här kategorin"
          message="Skapa en mall så slipper du skriva samma text två gånger."
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Ny mall
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {filtered.map((template) => (
            <article
              key={template.id}
              className="card flex flex-col p-5 transition hover:shadow-card"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-display text-[15px] font-semibold leading-snug text-ink">
                  {template.title}
                </h2>
                <TemplateCategoryBadge category={template.category} />
              </div>
              <pre className="mt-3 flex-1 whitespace-pre-wrap font-sans text-sm leading-relaxed text-muted">
                {template.body}
              </pre>
              <div className="mt-4 flex items-center gap-1.5 border-t border-line pt-3.5">
                <button className="btn-quiet" onClick={() => copy(template)}>
                  {copiedId === template.id ? (
                    <Check className="h-3.5 w-3.5 text-forest" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                  {copiedId === template.id ? 'Kopierad' : 'Kopiera'}
                </button>
                <button className="btn-quiet" onClick={() => openEdit(template)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Redigera
                </button>
                <button
                  className="btn-quiet ml-auto text-clay"
                  onClick={() => setDeleting(template)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        wide
        title={editing ? 'Redigera mall' : 'Ny mall'}
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
            <Field label="Rubrik">
              <input
                className="field"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Uppföljning efter visning"
              />
            </Field>
            <Field label="Kategori">
              <select
                className="field sm:w-44"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as TemplateCategory,
                  })
                }
              >
                {Object.entries(TEMPLATE_CATEGORY_LABEL).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
          </div>

          <Field label="Innehåll">
            <textarea
              className="field min-h-[240px] font-sans"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
              placeholder={'Hej {{kund}},\n\nTack för att du kom på visningen av {{adress}}…'}
            />
          </Field>

          <div>
            <span className="label">Snabbinfoga platshållare</span>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((placeholder) => (
                <button
                  key={placeholder}
                  type="button"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      body: `${prev.body}${placeholder}`,
                    }))
                  }
                  className="rounded-full border border-line px-3 py-1.5 font-mono text-xs text-muted transition hover:border-brass/40 hover:text-ink"
                >
                  {placeholder}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort mallen?"
        message={`”${deleting?.title ?? ''}” tas bort permanent.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </>
  );
}
