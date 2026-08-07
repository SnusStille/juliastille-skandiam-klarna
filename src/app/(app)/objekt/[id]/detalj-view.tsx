'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowLeft,
  Banknote,
  CalendarDays,
  Check,
  Copy,
  Gavel,
  Home,
  Pencil,
  Plus,
  StickyNote,
  Trash2,
  Users,
} from 'lucide-react';
import { PropertyForm } from '@/components/property-form';
import {
  BidStatusBadge,
  PropertyStatusBadge,
  PropertyTypeBadge,
  Tag,
  ViewingTypeBadge,
} from '@/components/badges';
import { ConfirmDialog, Field, Modal, useToast } from '@/components/ui';
import { create, patch, remove } from '@/lib/client';
import {
  BID_STATUS_LABEL,
  type Bid,
  type BidStatus,
  type Contact,
  type NoteItem,
  type Property,
  type Task,
  type Viewing,
} from '@/lib/types';
import {
  formatDate,
  formatDateTime,
  formatSEK,
  formatArea,
  pricePerSqm,
  relativeTime,
} from '@/lib/utils';

export function DetaljView({
  property,
  contacts,
  viewings,
  bids,
  tasks,
  notes,
}: {
  property: Property;
  contacts: Contact[];
  viewings: Viewing[];
  bids: Bid[];
  tasks: Task[];
  notes: NoteItem[];
}) {
  const router = useRouter();
  const { push } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [bidOpen, setBidOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');
  const [copied, setCopied] = useState(false);

  const [bidForm, setBidForm] = useState({
    bidder_name: '',
    amount: '',
    contact_id: '',
    note: '',
  });

  const seller = contacts.find((c) => c.id === property.seller_id) ?? null;
  const sorted = [...bids].sort((a, b) => b.amount - a.amount);
  const highest = sorted[0] ?? null;
  const openTasks = tasks.filter((t) => t.status !== 'klar');

  const overBid =
    highest && property.price
      ? Math.round(((highest.amount - property.price) / property.price) * 100)
      : 0;

  async function addBid() {
    if (!bidForm.bidder_name.trim() || !bidForm.amount.trim()) {
      push('Fyll i namn och belopp.', 'error');
      return;
    }
    setBusy(true);
    try {
      const amount = Number(bidForm.amount.replace(/\s/g, ''));
      const isHighest = !highest || amount > highest.amount;

      if (isHighest && highest) {
        await patch('bids', highest.id, { status: 'aktivt' });
      }
      await create('bids', {
        property_id: property.id,
        contact_id: bidForm.contact_id || null,
        bidder_name: bidForm.bidder_name.trim(),
        amount,
        bid_at: new Date().toISOString(),
        status: isHighest ? 'hogsta' : 'aktivt',
        note: bidForm.note.trim(),
      });
      if (property.status !== 'budgivning' && property.status !== 'sald') {
        await patch('properties', property.id, { status: 'budgivning' });
      }
      setBidForm({ bidder_name: '', amount: '', contact_id: '', note: '' });
      setBidOpen(false);
      push('Budet är registrerat.');
      router.refresh();
    } catch (err) {
      push(err instanceof Error ? err.message : 'Kunde inte spara budet.', 'error');
    } finally {
      setBusy(false);
    }
  }

  async function setBidStatus(bid: Bid, status: BidStatus) {
    try {
      await patch('bids', bid.id, { status });
      if (status === 'accepterat') {
        await patch('properties', property.id, {
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

  async function addNote() {
    if (!note.trim()) return;
    try {
      await create('notes', {
        body: note.trim(),
        property_id: property.id,
        contact_id: null,
      });
      setNote('');
      push('Anteckningen är sparad.');
      router.refresh();
    } catch {
      push('Kunde inte spara anteckningen.', 'error');
    }
  }

  async function deleteProperty() {
    setBusy(true);
    try {
      await remove('properties', property.id);
      push('Objektet är borttaget.');
      router.push('/objekt');
      router.refresh();
    } catch {
      push('Kunde inte ta bort objektet.', 'error');
      setBusy(false);
    }
  }

  function copySummary() {
    const text = [
      property.title,
      `${property.address}, ${property.district}, ${property.city}`,
      `${property.rooms} rum · ${formatArea(property.living_area)} · ${formatSEK(property.price)}`,
      property.monthly_fee ? `Avgift ${formatSEK(property.monthly_fee)}/mån` : '',
      '',
      property.description,
    ]
      .filter(Boolean)
      .join('\n');
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const facts: { label: string; value: string }[] = [
    { label: 'Bostadstyp', value: '' },
    { label: 'Antal rum', value: `${property.rooms}` },
    { label: 'Boarea', value: formatArea(property.living_area) },
    ...(property.plot_area
      ? [{ label: 'Tomtarea', value: formatArea(property.plot_area) }]
      : []),
    ...(property.floor ? [{ label: 'Våning', value: property.floor }] : []),
    ...(property.build_year
      ? [{ label: 'Byggår', value: String(property.build_year) }]
      : []),
    ...(property.monthly_fee
      ? [{ label: 'Avgift', value: `${formatSEK(property.monthly_fee)}/mån` }]
      : []),
    ...(property.operating_cost
      ? [
          {
            label: 'Driftkostnad',
            value: `${formatSEK(property.operating_cost)}/mån`,
          },
        ]
      : []),
    {
      label: 'Pris per m²',
      value: `${formatSEK(pricePerSqm(property.price, property.living_area))}/m²`,
    },
    { label: 'Provision', value: formatSEK(property.commission) },
  ];

  return (
    <>
      <Link
        href="/objekt"
        className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-brass"
      >
        <ArrowLeft className="h-4 w-4" />
        Alla objekt
      </Link>

      <div className="grid grid-cols-1 gap-7 lg:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        {/* Vänster */}
        <div className="space-y-6">
          <div className="card overflow-hidden">
            <div className="relative aspect-[16/10] bg-raised">
              {property.image_url ? (
                <Image
                  src={property.image_url}
                  alt={property.address}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 62vw"
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-faint">
                  <Home className="h-10 w-10" />
                </div>
              )}
              <div className="absolute left-4 top-4 flex gap-2">
                <span className="rounded-full bg-surface/92 shadow-subtle backdrop-blur">
                  <PropertyStatusBadge status={property.status} />
                </span>
                <span className="rounded-full bg-surface/92 shadow-subtle backdrop-blur">
                  <PropertyTypeBadge type={property.type} />
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6">
              <p className="eyebrow">
                {property.district}, {property.city}
              </p>
              <h1 className="mt-2 font-display text-[24px] font-medium leading-tight tracking-tight text-ink sm:text-[28px]">
                {property.title}
              </h1>
              <p className="mt-1.5 text-sm text-muted">
                {property.address}
                {property.postal_code ? `, ${property.postal_code}` : ''}
              </p>

              <div className="mt-5 flex flex-wrap items-end gap-x-6 gap-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                    {property.final_price ? 'Slutpris' : 'Utgångspris'}
                  </p>
                  <p className="mt-1 font-display text-[26px] font-semibold leading-none tracking-tight text-ink tnum">
                    {formatSEK(property.final_price ?? property.price)}
                  </p>
                </div>
                {highest && !property.final_price && (
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
                      Högsta bud
                    </p>
                    <p className="mt-1 font-display text-[26px] font-semibold leading-none tracking-tight text-brass tnum">
                      {formatSEK(highest.amount)}
                      {overBid > 0 && (
                        <span className="ml-2 align-middle text-sm font-medium text-forest">
                          +{overBid}%
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {property.description && (
                <p className="mt-5 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                  {property.description}
                </p>
              )}

              {property.features.length > 0 && (
                <div className="mt-5 flex flex-wrap gap-2">
                  {property.features.map((feature) => (
                    <Tag key={feature}>{feature}</Tag>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-wrap gap-2">
                <button className="btn-primary" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" />
                  Redigera
                </button>
                <button className="btn-ghost" onClick={() => setBidOpen(true)}>
                  <Gavel className="h-4 w-4" />
                  Registrera bud
                </button>
                <button className="btn-ghost" onClick={copySummary}>
                  {copied ? (
                    <Check className="h-4 w-4 text-forest" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  {copied ? 'Kopierat' : 'Kopiera underlag'}
                </button>
                <button
                  className="btn-quiet ml-auto text-clay"
                  onClick={() => setDeleteOpen(true)}
                >
                  <Trash2 className="h-4 w-4" />
                  Ta bort
                </button>
              </div>
            </div>
          </div>

          {/* Fakta */}
          <section className="card card-pad">
            <h2 className="font-display text-[17px] font-semibold text-ink">
              Objektfakta
            </h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-0 sm:grid-cols-3">
              {facts
                .filter((f) => f.value)
                .map((fact) => (
                  <div
                    key={fact.label}
                    className="border-b border-line py-2.5 last:border-0"
                  >
                    <dt className="text-xs text-faint">{fact.label}</dt>
                    <dd className="mt-0.5 text-sm font-medium text-ink tnum">
                      {fact.value}
                    </dd>
                  </div>
                ))}
            </dl>
          </section>

          {/* Budhistorik */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <Gavel className="h-4 w-4 text-brass" />
                Budhistorik
                <span className="text-xs font-normal text-faint tnum">
                  {bids.length}
                </span>
              </h2>
              <button
                className="btn-quiet"
                onClick={() => setBidOpen(true)}
              >
                <Plus className="h-3.5 w-3.5" />
                Nytt bud
              </button>
            </div>
            <div className="divide-y divide-line">
              {sorted.map((bid) => (
                <div key={bid.id} className="flex flex-wrap items-center gap-3 px-5 py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">
                      {bid.bidder_name}
                    </p>
                    <p className="mt-0.5 text-xs text-faint">
                      {formatDateTime(bid.bid_at)}
                      {bid.note ? ` · ${bid.note}` : ''}
                    </p>
                  </div>
                  <span className="font-display text-[15px] font-semibold text-ink tnum">
                    {formatSEK(bid.amount)}
                  </span>
                  <BidStatusBadge status={bid.status} />
                  {bid.status !== 'accepterat' && property.status !== 'sald' && (
                    <div className="flex gap-1.5">
                      <button
                        className="btn-quiet"
                        onClick={() => setBidStatus(bid, 'accepterat')}
                        title="Acceptera budet och markera objektet som sålt"
                      >
                        Acceptera
                      </button>
                      {bid.status !== 'avslaget' && (
                        <button
                          className="btn-quiet text-clay"
                          onClick={() => setBidStatus(bid, 'avslaget')}
                        >
                          Avslå
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {bids.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-faint">
                  Inga bud registrerade ännu.
                </p>
              )}
            </div>
          </section>

          {/* Anteckningar */}
          <section className="card card-pad">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
              <StickyNote className="h-4 w-4 text-brass" />
              Anteckningar
            </h2>
            <div className="mt-3.5 flex gap-2">
              <input
                className="field"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    void addNote();
                  }
                }}
                placeholder="Skriv en anteckning och tryck Enter…"
              />
              <button className="btn-primary shrink-0" onClick={addNote}>
                <Plus className="h-4 w-4" />
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {notes.map((item) => (
                <li
                  key={item.id}
                  className="rounded-md border border-line bg-canvas/60 px-3.5 py-3"
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                    {item.body}
                  </p>
                  <p className="mt-1.5 text-xs text-faint">
                    {relativeTime(item.created_at)}
                  </p>
                </li>
              ))}
              {notes.length === 0 && (
                <li className="py-4 text-sm text-faint">
                  Inga anteckningar ännu.
                </li>
              )}
            </ul>
          </section>
        </div>

        {/* Höger */}
        <div className="space-y-5">
          <section className="card card-pad">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
              <Users className="h-4 w-4 text-brass" />
              Säljare
            </h2>
            {seller ? (
              <div className="mt-3.5">
                <p className="text-sm font-medium text-ink">{seller.name}</p>
                <div className="mt-2 space-y-1 text-sm text-muted">
                  {seller.phone && (
                    <a
                      href={`tel:${seller.phone.replace(/\s/g, '')}`}
                      className="block transition hover:text-brass"
                    >
                      {seller.phone}
                    </a>
                  )}
                  {seller.email && (
                    <a
                      href={`mailto:${seller.email}`}
                      className="block break-all transition hover:text-brass"
                    >
                      {seller.email}
                    </a>
                  )}
                </div>
                <Link
                  href={`/kunder?fokus=${seller.id}`}
                  className="btn-ghost mt-4 w-full"
                >
                  Öppna kundkort
                </Link>
              </div>
            ) : (
              <p className="mt-3 text-sm text-faint">
                Ingen säljare kopplad. Redigera objektet för att välja en kontakt.
              </p>
            )}
          </section>

          <section className="card card-pad">
            <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
              <Banknote className="h-4 w-4 text-brass" />
              Ekonomi
            </h2>
            <dl className="mt-3.5 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Utgångspris</dt>
                <dd className="font-medium text-ink tnum">
                  {formatSEK(property.price)}
                </dd>
              </div>
              {highest && (
                <div className="flex justify-between">
                  <dt className="text-muted">Högsta bud</dt>
                  <dd className="font-medium text-brass tnum">
                    {formatSEK(highest.amount)}
                  </dd>
                </div>
              )}
              {property.final_price && (
                <div className="flex justify-between">
                  <dt className="text-muted">Slutpris</dt>
                  <dd className="font-medium text-forest tnum">
                    {formatSEK(property.final_price)}
                  </dd>
                </div>
              )}
              <div className="flex justify-between border-t border-line pt-2.5">
                <dt className="text-muted">Provision</dt>
                <dd className="font-medium text-ink tnum">
                  {formatSEK(property.commission)}
                </dd>
              </div>
            </dl>
          </section>

          <section className="card">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <CalendarDays className="h-4 w-4 text-brass" />
                Visningar
              </h2>
            </div>
            <div className="divide-y divide-line">
              {viewings.map((viewing) => (
                <div key={viewing.id} className="px-5 py-3.5">
                  <p className="text-sm font-medium text-ink">
                    {formatDateTime(viewing.start_at)}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <ViewingTypeBadge type={viewing.type} />
                    {viewing.attendees > 0 && (
                      <span className="text-xs text-faint">
                        {viewing.attendees} besökare
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {viewings.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-faint">
                  Inga visningar bokade.
                </p>
              )}
            </div>
          </section>

          <section className="card">
            <div className="border-b border-line px-5 py-3.5">
              <h2 className="font-display text-[15px] font-semibold text-ink">
                Uppgifter kopplade hit
              </h2>
            </div>
            <div className="divide-y divide-line">
              {openTasks.map((task) => (
                <div key={task.id} className="px-5 py-3">
                  <p className="text-sm text-ink">{task.title}</p>
                  <p className="mt-0.5 text-xs text-faint">
                    {task.due_at ? formatDate(task.due_at) : 'Ingen deadline'}
                  </p>
                </div>
              ))}
              {openTasks.length === 0 && (
                <p className="px-5 py-8 text-center text-sm text-faint">
                  Inga öppna uppgifter.
                </p>
              )}
            </div>
          </section>

          <p className="text-center text-xs text-faint">
            Upplagt {formatDate(property.created_at)}
          </p>
        </div>
      </div>

      <PropertyForm
        open={editOpen}
        onClose={() => setEditOpen(false)}
        property={property}
        contacts={contacts}
      />

      <Modal
        open={bidOpen}
        onClose={() => setBidOpen(false)}
        title="Registrera bud"
        description={`Bud på ${property.address}`}
        footer={
          <>
            <button className="btn-ghost" onClick={() => setBidOpen(false)}>
              Avbryt
            </button>
            <button className="btn-primary" onClick={addBid} disabled={busy}>
              Spara bud
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Budgivare">
            <input
              className="field"
              value={bidForm.bidder_name}
              onChange={(e) =>
                setBidForm({ ...bidForm, bidder_name: e.target.value })
              }
              placeholder="Namn på budgivaren"
            />
          </Field>
          <Field label="Belopp (kr)">
            <input
              className="field tnum"
              inputMode="numeric"
              value={bidForm.amount}
              onChange={(e) =>
                setBidForm({ ...bidForm, amount: e.target.value })
              }
              placeholder={String(property.price)}
            />
          </Field>
          <Field label="Koppla till kund" hint="Valfritt">
            <select
              className="field"
              value={bidForm.contact_id}
              onChange={(e) =>
                setBidForm({ ...bidForm, contact_id: e.target.value })
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
          <Field label="Notering" hint="Valfritt">
            <input
              className="field"
              value={bidForm.note}
              onChange={(e) => setBidForm({ ...bidForm, note: e.target.value })}
              placeholder="T.ex. med lånelöfte, vill tillträda 1 sep"
            />
          </Field>
          {highest && (
            <p className="rounded-md border border-line bg-canvas px-3.5 py-2.5 text-sm text-muted">
              Nuvarande högsta bud: {formatSEK(highest.amount)} (
              {BID_STATUS_LABEL[highest.status].toLowerCase()}).
            </p>
          )}
        </div>
      </Modal>

      <ConfirmDialog
        open={deleteOpen}
        title="Ta bort objektet?"
        message={`${property.address} tas bort permanent. Kopplade bud, visningar och anteckningar finns kvar men blir utan objekt.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={deleteProperty}
        busy={busy}
      />
    </>
  );
}
