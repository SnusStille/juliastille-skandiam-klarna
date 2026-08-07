'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Circle,
  CircleDot,
  ListChecks,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { StatCard } from '@/components/cards';
import { TaskPriorityBadge } from '@/components/badges';
import { ConfirmDialog, EmptyState, Field, Modal, useToast } from '@/components/ui';
import { create, patch, remove } from '@/lib/client';
import {
  TASK_PRIORITY_LABEL,
  TASK_STATUS_LABEL,
  type Contact,
  type Property,
  type Task,
  type TaskPriority,
  type TaskStatus,
} from '@/lib/types';
import { cn, formatDate, toInputDate } from '@/lib/utils';

const STATUS_ICON: Record<TaskStatus, typeof Circle> = {
  att_gora: Circle,
  pagar: CircleDot,
  klar: CheckCircle2,
};

const NEXT_STATUS: Record<TaskStatus, TaskStatus> = {
  att_gora: 'pagar',
  pagar: 'klar',
  klar: 'att_gora',
};

export function UppgifterView({
  tasks,
  properties,
  contacts,
}: {
  tasks: Task[];
  properties: Property[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [filter, setFilter] = useState<TaskStatus | 'alla' | 'forsenade'>('alla');
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_at: '',
    priority: 'normal' as TaskPriority,
    status: 'att_gora' as TaskStatus,
    property_id: '',
    contact_id: '',
  });

  const now = Date.now();
  const overdue = tasks.filter(
    (t) => t.status !== 'klar' && t.due_at && new Date(t.due_at).getTime() < now,
  );
  const done = tasks.filter((t) => t.status === 'klar');

  const filtered = useMemo(() => {
    let list = tasks;
    if (filter === 'forsenade') list = overdue;
    else if (filter !== 'alla') list = tasks.filter((t) => t.status === filter);

    return [...list].sort((a, b) => {
      if (a.status === 'klar' && b.status !== 'klar') return 1;
      if (b.status === 'klar' && a.status !== 'klar') return -1;
      const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity;
      if (ad !== bd) return ad - bd;
      const order: Record<TaskPriority, number> = { hog: 0, normal: 1, lag: 2 };
      return order[a.priority] - order[b.priority];
    });
  }, [tasks, filter, overdue]);

  function openNew() {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      due_at: '',
      priority: 'normal',
      status: 'att_gora',
      property_id: '',
      contact_id: '',
    });
    setError(null);
    setOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setForm({
      title: task.title,
      description: task.description,
      due_at: toInputDate(task.due_at),
      priority: task.priority,
      status: task.status,
      property_id: task.property_id ?? '',
      contact_id: task.contact_id ?? '',
    });
    setError(null);
    setOpen(true);
  }

  async function submit() {
    if (form.title.trim().length < 2) return setError('Ange en rubrik.');
    setBusy(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      due_at: form.due_at ? new Date(`${form.due_at}T09:00:00`).toISOString() : null,
      priority: form.priority,
      status: form.status,
      property_id: form.property_id || null,
      contact_id: form.contact_id || null,
    };
    try {
      if (editing) {
        await patch('tasks', editing.id, payload);
        push('Uppgiften är uppdaterad.');
      } else {
        await create('tasks', payload);
        push('Uppgiften är tillagd.');
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara.');
    } finally {
      setBusy(false);
    }
  }

  async function cycleStatus(task: Task) {
    const status = NEXT_STATUS[task.status];
    try {
      await patch('tasks', task.id, { status });
      router.refresh();
    } catch {
      push('Kunde inte uppdatera uppgiften.', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove('tasks', deleting.id);
      push('Uppgiften är borttagen.');
      setDeleting(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort uppgiften.', 'error');
    } finally {
      setBusy(false);
    }
  }

  const TABS: { value: typeof filter; label: string; count: number }[] = [
    { value: 'alla', label: 'Alla', count: tasks.length },
    {
      value: 'att_gora',
      label: 'Att göra',
      count: tasks.filter((t) => t.status === 'att_gora').length,
    },
    {
      value: 'pagar',
      label: 'Pågår',
      count: tasks.filter((t) => t.status === 'pagar').length,
    },
    { value: 'forsenade', label: 'Försenade', count: overdue.length },
    { value: 'klar', label: 'Klara', count: done.length },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Arbetsflöde"
        title="Uppgifter"
        description="Allt som behöver göras — kopplat till objekt och kunder så inget faller mellan stolarna."
        actions={
          <button className="btn-primary" onClick={openNew}>
            <Plus className="h-4 w-4" />
            Ny uppgift
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Öppna"
          value={String(tasks.length - done.length)}
          sub="att göra och pågående"
        />
        <StatCard
          label="Försenade"
          value={String(overdue.length)}
          sub={overdue.length ? 'behöver åtgärd' : 'inget efter deadline'}
          accent={overdue.length > 0}
        />
        <StatCard label="Klara" value={String(done.length)} />
        <StatCard
          label="Genomförandegrad"
          value={`${tasks.length ? Math.round((done.length / tasks.length) * 100) : 0}%`}
        />
      </div>

      <div className="no-scrollbar mb-5 flex gap-1.5 overflow-x-auto border-b border-line pb-px">
        {TABS.map((tab) => (
          <button
            key={String(tab.value)}
            onClick={() => setFilter(tab.value)}
            className={cn(
              'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
              filter === tab.value
                ? 'border-brass text-ink'
                : 'border-transparent text-muted hover:text-ink',
            )}
          >
            {tab.label}
            <span className="ml-1.5 text-xs text-faint tnum">{tab.count}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="h-5 w-5" />}
          title="Inga uppgifter här"
          message="Lägg till en uppgift eller byt filter."
          action={
            <button className="btn-primary" onClick={openNew}>
              <Plus className="h-4 w-4" />
              Ny uppgift
            </button>
          }
        />
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-line">
            {filtered.map((task) => {
              const Icon = STATUS_ICON[task.status];
              const property = properties.find((p) => p.id === task.property_id);
              const contact = contacts.find((c) => c.id === task.contact_id);
              const late =
                task.status !== 'klar' &&
                task.due_at &&
                new Date(task.due_at).getTime() < now;
              return (
                <div
                  key={task.id}
                  className="flex items-start gap-3.5 px-5 py-3.5 transition hover:bg-raised/40"
                >
                  <button
                    onClick={() => cycleStatus(task)}
                    aria-label={`Ändra status (nu: ${TASK_STATUS_LABEL[task.status]})`}
                    title={`Klicka för att sätta ${TASK_STATUS_LABEL[NEXT_STATUS[task.status]]}`}
                    className="mt-0.5 shrink-0 text-faint transition hover:text-brass"
                  >
                    <Icon
                      className={cn(
                        'h-[18px] w-[18px]',
                        task.status === 'klar' && 'text-forest',
                        task.status === 'pagar' && 'text-sky',
                      )}
                    />
                  </button>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm font-medium text-ink',
                        task.status === 'klar' &&
                          'text-faint line-through decoration-line',
                      )}
                    >
                      {task.title}
                    </p>
                    {task.description && (
                      <p className="mt-0.5 text-xs leading-relaxed text-muted">
                        {task.description}
                      </p>
                    )}
                    <p className="mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-faint">
                      {task.due_at && (
                        <span className={late ? 'font-semibold text-clay' : ''}>
                          {late ? 'Försenad — ' : ''}
                          {formatDate(task.due_at)}
                        </span>
                      )}
                      {property && <span>{property.address}</span>}
                      {contact && <span>{contact.name}</span>}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    <TaskPriorityBadge priority={task.priority} />
                    <button
                      aria-label="Redigera"
                      onClick={() => openEdit(task)}
                      className="rounded p-1.5 text-faint transition hover:bg-raised hover:text-ink"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      aria-label="Ta bort"
                      onClick={() => setDeleting(task)}
                      className="rounded p-1.5 text-faint transition hover:bg-clay/10 hover:text-clay"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Redigera uppgift' : 'Ny uppgift'}
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
          <Field label="Rubrik">
            <input
              className="field"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Beställ energideklaration"
            />
          </Field>
          <Field label="Beskrivning">
            <textarea
              className="field min-h-[90px]"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="Deadline">
              <input
                type="date"
                className="field"
                value={form.due_at}
                onChange={(e) => setForm({ ...form, due_at: e.target.value })}
              />
            </Field>
            <Field label="Prioritet">
              <select
                className="field"
                value={form.priority}
                onChange={(e) =>
                  setForm({ ...form, priority: e.target.value as TaskPriority })
                }
              >
                {Object.entries(TASK_PRIORITY_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className="field"
                value={form.status}
                onChange={(e) =>
                  setForm({ ...form, status: e.target.value as TaskStatus })
                }
              >
                {Object.entries(TASK_STATUS_LABEL).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <Field label="Kopplad kund">
              <select
                className="field"
                value={form.contact_id}
                onChange={(e) =>
                  setForm({ ...form, contact_id: e.target.value })
                }
              >
                <option value="">Ingen</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort uppgiften?"
        message={`”${deleting?.title ?? ''}” tas bort permanent.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </>
  );
}
