'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Building2, LayoutGrid, List, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/shell';
import { PropertyCard } from '@/components/cards';
import { PropertyForm } from '@/components/property-form';
import { PropertyStatusBadge, PropertyTypeBadge } from '@/components/badges';
import { EmptyState } from '@/components/ui';
import { cn, formatArea, formatSEK, pricePerSqm } from '@/lib/utils';
import {
  PROPERTY_STATUS_LABEL,
  type Bid,
  type Contact,
  type Property,
  type PropertyStatus,
} from '@/lib/types';
import Link from 'next/link';

type SortKey = 'nyast' | 'pris_hog' | 'pris_lag' | 'yta' | 'adress';

const SORTS: { value: SortKey; label: string }[] = [
  { value: 'nyast', label: 'Senast tillagda' },
  { value: 'pris_hog', label: 'Högsta pris' },
  { value: 'pris_lag', label: 'Lägsta pris' },
  { value: 'yta', label: 'Största yta' },
  { value: 'adress', label: 'Adress A–Ö' },
];

export function ObjektView({
  properties,
  contacts,
  bids,
}: {
  properties: Property[];
  contacts: Contact[];
  bids: Bid[];
}) {
  const params = useSearchParams();
  const [open, setOpen] = useState(params.get('nytt') === '1');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<PropertyStatus | 'alla'>('alla');
  const [sort, setSort] = useState<SortKey>('nyast');
  const [view, setView] = useState<'rutnat' | 'lista'>('rutnat');

  const counts = useMemo(() => {
    const map: Record<string, number> = { alla: properties.length };
    for (const key of Object.keys(PROPERTY_STATUS_LABEL)) map[key] = 0;
    for (const p of properties) map[p.status] = (map[p.status] ?? 0) + 1;
    return map;
  }, [properties]);

  const highestFor = (propertyId: string) => {
    const list = bids.filter((b) => b.property_id === propertyId);
    return list.length ? Math.max(...list.map((b) => b.amount)) : null;
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = properties.filter((p) => {
      if (status !== 'alla' && p.status !== status) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q) ||
        p.district.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q)
      );
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case 'pris_hog':
          return b.price - a.price;
        case 'pris_lag':
          return a.price - b.price;
        case 'yta':
          return b.living_area - a.living_area;
        case 'adress':
          return a.address.localeCompare(b.address, 'sv');
        default:
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
      }
    });

    return list;
  }, [properties, query, status, sort]);

  const totalValue = filtered.reduce(
    (sum, p) => sum + (p.final_price ?? p.price),
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow="Portfölj"
        title="Objekt"
        description={`${filtered.length} av ${properties.length} objekt · ${formatSEK(totalValue, true)} i samlat värde.`}
        actions={
          <button className="btn-primary" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" />
            Nytt objekt
          </button>
        }
      />

      {/* Filterrad */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök på adress, område eller rubrik…"
            className="field pl-10"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="field w-auto min-w-[170px]"
            aria-label="Sortering"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <div className="flex shrink-0 items-center gap-0.5 rounded-md border border-line bg-surface p-0.5">
            <button
              onClick={() => setView('rutnat')}
              aria-label="Rutnät"
              className={cn(
                'rounded p-1.5 transition',
                view === 'rutnat'
                  ? 'bg-raised text-ink'
                  : 'text-faint hover:text-muted',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setView('lista')}
              aria-label="Lista"
              className={cn(
                'rounded p-1.5 transition',
                view === 'lista'
                  ? 'bg-raised text-ink'
                  : 'text-faint hover:text-muted',
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Statusflikar */}
      <div className="no-scrollbar mb-6 flex gap-1.5 overflow-x-auto border-b border-line pb-px">
        {(['alla', ...Object.keys(PROPERTY_STATUS_LABEL)] as const).map((key) => {
          const active = status === key;
          return (
            <button
              key={key}
              onClick={() => setStatus(key as PropertyStatus | 'alla')}
              className={cn(
                'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition',
                active
                  ? 'border-brass text-ink'
                  : 'border-transparent text-muted hover:text-ink',
              )}
            >
              {key === 'alla'
                ? 'Alla'
                : PROPERTY_STATUS_LABEL[key as PropertyStatus]}
              <span className="ml-1.5 text-xs text-faint tnum">
                {counts[key] ?? 0}
              </span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<Building2 className="h-5 w-5" />}
          title="Inga objekt matchar"
          message="Prova att rensa sökningen eller byt statusfilter."
          action={
            <button className="btn-primary" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4" />
              Nytt objekt
            </button>
          }
        />
      ) : view === 'rutnat' ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((property) => (
            <PropertyCard
              key={property.id}
              property={property}
              highestBid={highestFor(property.id)}
            />
          ))}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="hidden grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_auto] gap-4 border-b border-line bg-canvas/60 px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-faint md:grid">
            <span>Objekt</span>
            <span>Typ</span>
            <span className="text-right">Pris</span>
            <span className="text-right">Yta / kr per m²</span>
            <span className="w-24 text-right">Status</span>
          </div>
          <div className="divide-y divide-line">
            {filtered.map((property) => (
              <Link
                key={property.id}
                href={`/objekt/${property.id}`}
                className="grid grid-cols-1 gap-2 px-5 py-3.5 transition hover:bg-raised/50 md:grid-cols-[minmax(0,2.2fr)_1fr_1fr_1fr_auto] md:items-center md:gap-4"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-ink">
                    {property.address}
                  </p>
                  <p className="truncate text-xs text-faint">
                    {property.district}, {property.city}
                  </p>
                </div>
                <div className="md:block">
                  <PropertyTypeBadge type={property.type} />
                </div>
                <p className="text-sm text-ink tnum md:text-right">
                  {formatSEK(property.final_price ?? property.price, true)}
                </p>
                <p className="text-xs text-muted tnum md:text-right">
                  {formatArea(property.living_area)} ·{' '}
                  {formatSEK(pricePerSqm(property.price, property.living_area))}
                  /m²
                </p>
                <div className="md:w-24 md:text-right">
                  <PropertyStatusBadge status={property.status} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <PropertyForm
        open={open}
        onClose={() => setOpen(false)}
        contacts={contacts}
      />
    </>
  );
}
