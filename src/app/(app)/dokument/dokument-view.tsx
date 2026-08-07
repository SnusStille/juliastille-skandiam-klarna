'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Download,
  FileText,
  Loader2,
  Paperclip,
  Plus,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { DocumentCategoryBadge } from '@/components/badges';
import { ConfirmDialog, EmptyState, Field, Modal, useToast } from '@/components/ui';
import { create, remove } from '@/lib/client';
import {
  DOCUMENT_CATEGORY_LABEL,
  type DocumentCategory,
  type DocumentItem,
  type Property,
} from '@/lib/types';
import { cn, formatBytes, formatDate } from '@/lib/utils';

export function DokumentView({
  documents,
  properties,
  supabaseReady,
}: {
  documents: DocumentItem[];
  properties: Property[];
  supabaseReady: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DocumentCategory | 'alla'>('alla');
  const [propertyFilter, setPropertyFilter] = useState('alla');
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<DocumentItem | null>(null);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    category: 'avtal' as DocumentCategory,
    url: '',
    property_id: '',
    size: 0,
    mime: 'application/pdf',
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return documents
      .filter((doc) => {
        if (category !== 'alla' && doc.category !== category) return false;
        if (propertyFilter !== 'alla' && doc.property_id !== propertyFilter)
          return false;
        if (!q) return true;
        return doc.name.toLowerCase().includes(q);
      })
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [documents, query, category, propertyFilter]);

  const totalSize = documents.reduce((sum, d) => sum + d.size, 0);

  async function handleFile(file: File) {
    setUploading(true);
    setError(null);
    try {
      const data = new FormData();
      data.append('file', file);
      const response = await fetch('/api/upload', { method: 'POST', body: data });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setError(payload?.error ?? 'Uppladdningen misslyckades.');
        return;
      }
      setForm((prev) => ({
        ...prev,
        name: prev.name || payload.name,
        url: payload.url,
        size: payload.size,
        mime: payload.mime,
      }));
      push('Filen är uppladdad.');
    } catch {
      setError('Kunde inte ladda upp filen.');
    } finally {
      setUploading(false);
    }
  }

  async function submit() {
    if (form.name.trim().length < 2) return setError('Ange ett filnamn.');
    if (!form.url.trim())
      return setError('Ladda upp en fil eller klistra in en länk.');

    setBusy(true);
    setError(null);
    try {
      await create('documents', {
        name: form.name.trim(),
        category: form.category,
        url: form.url.trim(),
        size: form.size,
        mime: form.mime,
        property_id: form.property_id || null,
      });
      setForm({
        name: '',
        category: 'avtal',
        url: '',
        property_id: '',
        size: 0,
        mime: 'application/pdf',
      });
      setOpen(false);
      push('Dokumentet är sparat.');
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
      await remove('documents', deleting.id);
      push('Dokumentet är borttaget.');
      setDeleting(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort dokumentet.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Arkiv"
        title="Dokument"
        description={`${documents.length} dokument · ${formatBytes(totalSize)} totalt. Avtal, besiktningar, planritningar och foton på ett ställe.`}
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nytt dokument
          </button>
        }
      />

      <div className="mb-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök på filnamn…"
            className="field pl-10"
          />
        </div>
        <select
          className="field w-full lg:w-auto lg:min-w-[190px]"
          value={propertyFilter}
          onChange={(e) => setPropertyFilter(e.target.value)}
          aria-label="Filtrera på objekt"
        >
          <option value="alla">Alla objekt</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.address}
            </option>
          ))}
        </select>
      </div>

      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto border-b border-line pb-px">
        {(['alla', ...Object.keys(DOCUMENT_CATEGORY_LABEL)] as const).map(
          (key) => {
            const count =
              key === 'alla'
                ? documents.length
                : documents.filter((d) => d.category === key).length;
            return (
              <button
                key={key}
                onClick={() => setCategory(key as DocumentCategory | 'alla')}
                className={cn(
                  'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
                  category === key
                    ? 'border-brass text-ink'
                    : 'border-transparent text-muted hover:text-ink',
                )}
              >
                {key === 'alla'
                  ? 'Alla'
                  : DOCUMENT_CATEGORY_LABEL[key as DocumentCategory]}
                <span className="ml-1.5 text-xs text-faint tnum">{count}</span>
              </button>
            );
          },
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-5 w-5" />}
          title="Inga dokument här"
          message="Ladda upp ett dokument eller spara en länk till exempelvis en besiktning."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nytt dokument
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {filtered.map((doc) => {
              const property = properties.find((p) => p.id === doc.property_id);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-raised/40"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-raised text-faint">
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {doc.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-faint">
                      {[
                        property?.address,
                        doc.size ? formatBytes(doc.size) : null,
                        formatDate(doc.created_at),
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <DocumentCategoryBadge category={doc.category} />
                  <a
                    href={doc.url}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="Öppna dokumentet"
                    className="rounded p-1.5 text-faint transition hover:bg-raised hover:text-brass"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <button
                    aria-label="Ta bort"
                    onClick={() => setDeleting(doc)}
                    className="rounded p-1.5 text-faint transition hover:bg-clay/10 hover:text-clay"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Nytt dokument"
        description={
          supabaseReady
            ? 'Ladda upp en fil till Supabase Storage eller spara en länk.'
            : 'Spara en länk till dokumentet. Fyll i Supabase-nycklarna för att kunna ladda upp filer direkt.'
        }
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
            <p role="alert" className="rounded-md border border-clay/30 bg-clay/8 px-3.5 py-2.5 text-sm leading-relaxed text-clay">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center gap-2 rounded-lg border border-dashed border-line bg-canvas px-4 py-7 text-center transition hover:border-brass/45"
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin text-brass" />
            ) : (
              <Upload className="h-5 w-5 text-faint" />
            )}
            <span className="text-sm font-medium text-ink">
              {uploading ? 'Laddar upp…' : 'Välj en fil att ladda upp'}
            </span>
            <span className="text-xs text-faint">
              PDF, bilder eller dokument. Max 15 MB.
            </span>
          </button>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleFile(file);
              e.target.value = '';
            }}
          />

          <Field label="Filnamn">
            <input
              className="field"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Besiktningsprotokoll.pdf"
            />
          </Field>

          <Field label="Länk" hint="Fylls i automatiskt vid uppladdning">
            <div className="relative">
              <Paperclip className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
              <input
                className="field pl-10"
                value={form.url}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="https://…"
              />
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Kategori">
              <select
                className="field"
                value={form.category}
                onChange={(e) =>
                  setForm({
                    ...form,
                    category: e.target.value as DocumentCategory,
                  })
                }
              >
                {Object.entries(DOCUMENT_CATEGORY_LABEL).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ),
                )}
              </select>
            </Field>
            <Field label="Kopplat objekt">
              <select
                className="field"
                value={form.property_id}
                onChange={(e) =>
                  setForm({ ...form, property_id: e.target.value })
                }
              >
                <option value="">Inget</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.address}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort dokumentet?"
        message={`”${deleting?.name ?? ''}” tas bort ur arkivet. Filen finns kvar i Supabase Storage om den laddats upp dit.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </>
  );
}
