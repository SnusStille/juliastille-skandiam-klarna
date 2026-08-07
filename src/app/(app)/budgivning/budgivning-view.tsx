'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Gavel, Loader2, Plus, Trash2, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { StatCard } from '@/components/cards';
import { BidStatusBadge } from '@/components/badges';
import { ConfirmDialog, EmptyState, Field, Modal, useToast } from '@/components/ui';
import { create, patch, remove } from '@/lib/client';
import type { Bid, BidStatus, Contact, Property } from '@/lib/types';
import { formatDateTime, formatSEK } from '@/lib/utils';

export function BudgivningView({
  bids,
  properties,
  contacts,
}: {
  bids: Bid[];
  properties: Property[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Bid | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    property_id: properties[0]?.id ?? '',
    bidder_name: '',
    amount: '',
    contact_id: '',
    note: '',
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Bid[]>();
    for (const bid of bids) {
      const list = map.get(bid.property_id) ?? [];
      list.push(bid);
      map.set(bid.property_id, list);
    }
    return Array.from(map.entries())
      .map(([propertyId, list]) => ({
        property: properties.find((p) => p.id === propertyId) ?? null,
        bids: [...list].sort((a, b) => b.amount - a.amount),
      }))
      .sort((a, b) => (b.bids[0]?.amount ?? 0) - (a.bids[0]?.amount ?? 0));
  }, [bids, properties]);

  const active = grouped.filter((g) =>
    g.bids.some((b) => b.status === 'aktivt' || b.status === 'hogsta'),
  );

  const totalHighest = grouped.reduce(
    (sum, g) => sum + (g.bids[0]?.amount ?? 0),
    0,
  );

  const avgOverAsk = (() => {
    const values = grouped
      .filter((g) => g.property && g.property.price > 0 && g.bids[0])
      .map((g) => (g.bids[0].amount - g.property!.price) / g.property!.price);
    if (!values.length) return 0;
    return Math.round(
      (values.reduce((a, b) => a + b, 0) / values.length) * 100,
    );
  })();

  async function submit() {
    if (!form.property_id) return setError('Välj ett objekt.');
    if (!form.bidder_name.trim()) return setError('Ange budgivarens namn.');
    if (!form.amount.trim()) return setError('Ange ett belopp.');

    const amount = Number(form.amount.replace(/\s/g, ''));
    if (!Number.isFinite(amount) || amount <= 0)
      return setError('Beloppet måste vara ett tal.');

    const existing = bids
      .filter((b) => b.property_id === form.property_id)
      .sort((a, b) => b.amount - a.amount);
    const currentHighest = existing[0];
    const isHighest = !currentHighest || amount > currentHighest.amount;

    setBusy(true);
    setError(null);
    try {
      if (isHighest && currentHighest && currentHighest.status === 'hogsta') {
        await patch('bids', currentHighest.id, { status: 'aktivt' });
      }
      await create('bids', {
        property_id: form.property_id,
        contact_id: form.contact_id || null,
        bidder_name: form.bidder_name.trim(),
        amount,
        bid_at: new Date().toISOString(),
        status: isHighest ? 'hogsta' : 'aktivt',
        note: form.note.trim(),
      });
      const property = properties.find((p) => p.id === form.property_id);
      if (property && property.status !== 'sald' && property.status !== 'budgivning') {
        await patch('properties', property.id, { status: 'budgivning' });
      }
      setForm({ ...form, bidder_name: '', amount: '', note: '', contact_id: '' });
      setOpen(false);
      push('Budet är registrerat.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kunde inte spara budet.');
    } finally {
      setBusy(false);
    }
  }

  async function setStatus(bid: Bid, status: BidStatus) {
    try {
      await patch('bids', bid.id, { status });
      if (status === 'accepterat') {
        await patch('properties', bid.property_id, {
          status: 'sald',
          final_price: bid.amount,
          sold_at: new Date().toISOString(),
        });
        push('Affären är markerad som såld.');
      } else {
        push('Budet är uppdaterat.');
      }
      router.refresh();
    } catch {
      push('Kunde inte uppdatera budet.', 'error');
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove('bids', deleting.id);
      push('Budet är borttaget.');
      setDeleting(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort budet.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Affärer"
        title="Budgivning"
        description="Samlad överblick över alla bud, objekt för objekt. Acceptera ett bud så markeras objektet automatiskt som sålt."
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Registrera bud
          </button>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard label="Objekt med bud" value={String(grouped.length)} />
        <StatCard label="Pågående budgivningar" value={String(active.length)} />
        <StatCard
          label="Summa högsta bud"
          value={formatSEK(totalHighest, true)}
        />
        <StatCard
          label="Snitt över utgångspris"
          value={`${avgOverAsk > 0 ? '+' : ''}${avgOverAsk}%`}
          accent
        />
      </div>

      {grouped.length === 0 ? (
        <EmptyState
          icon={<Gavel className="h-5 w-5" />}
          title="Inga bud registrerade"
          message="Så fort du får in ett bud kan du registrera det här och följa hela budgivningen."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Registrera bud
            </button>
          }
        />
      ) : (
        <div className="space-y-5">
          {grouped.map(({ property, bids: list }) => {
            const highest = list[0];
            const over =
              property && property.price
                ? Math.round(
                    ((highest.amount - property.price) / property.price) * 100,
                  )
                : 0;
            return (
              <section key={property?.id ?? highest.property_id} className="card">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-[16px] font-semibold text-ink">
                      {property ? (
                        <Link
                          href={`/objekt/${property.id}`}
                          className="transition hover:text-brass"
                        >
                          {property.address}
                        </Link>
                      ) : (
                        'Borttaget objekt'
                      )}
                    </h2>
                    <p className="mt-0.5 text-xs text-faint">
                      Utgångspris {formatSEK(property?.price)} · {list.length} bud
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-lg font-semibold text-brass tnum">
                      {formatSEK(highest.amount)}
                    </p>
                    {over !== 0 && (
                      <p className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-forest">
                        <TrendingUp className="h-3 w-3" />
                        {over > 0 ? '+' : ''}
                        {over}% mot utgångspris
                      </p>
                    )}
                  </div>
                </div>

                <div className="divide-y divide-line">
                  {list.map((bid) => (
                    <div
                      key={bid.id}
                      className="flex flex-wrap items-center gap-3 px-5 py-3.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {bid.bidder_name}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-faint">
                          {formatDateTime(bid.bid_at)}
                          {bid.note ? ` · ${bid.note}` : ''}
                        </p>
                      </div>
                      <span className="font-display text-[15px] font-semibold text-ink tnum">
                        {formatSEK(bid.amount)}
                      </span>
                      <BidStatusBadge status={bid.status} />
                      <div className="flex gap-1.5">
                        {bid.status !== 'accepterat' && (
                          <button
                            className="btn-quiet"
                            onClick={() => setStatus(bid, 'accepterat')}
                          >
                            Acceptera
                          </button>
                        )}
                        {bid.status !== 'avslaget' &&
                          bid.status !== 'accepterat' && (
                            <button
                              className="btn-quiet text-clay"
                              onClick={() => setStatus(bid, 'avslaget')}
                            >
                              Avslå
                            </button>
                          )}
                        <button
                          aria-label="Ta bort budet"
                          onClick={() => setDeleting(bid)}
                          className="rounded p-1.5 text-faint transition hover:bg-clay/10 hover:text-clay"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Registrera bud"
        footer={
          <>
            <button className="btn-ghost" onClick={() => setOpen(false)}>
              Avbryt
            </button>
            <button className="btn-primary" onClick={submit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Spara bud
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
                  {p.address} — {formatSEK(p.price, true)}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Budgivare">
              <input
                className="field"
                value={form.bidder_name}
                onChange={(e) =>
                  setForm({ ...form, bidder_name: e.target.value })
                }
              />
            </Field>
            <Field label="Belopp (kr)">
              <input
                className="field tnum"
                inputMode="numeric"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </Field>
          </div>
          <Field label="Koppla till kund" hint="Valfritt">
            <select
              className="field"
              value={form.contact_id}
              onChange={(e) => setForm({ ...form, contact_id: e.target.value })}
            >
              <option value="">Ingen</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notering" hint="Valfritt">
            <input
              className="field"
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort budet?"
        message={`Budet från ${deleting?.bidder_name ?? ''} tas bort permanent.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </>
  );
}
