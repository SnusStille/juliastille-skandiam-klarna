import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, Bath, Home, Maximize2, TrendingUp } from 'lucide-react';
import { PropertyStatusBadge, PropertyTypeBadge } from '@/components/badges';
import { cn, formatArea, formatSEK, pricePerSqm } from '@/lib/utils';
import type { Property } from '@/lib/types';

/* ---------- Nyckeltalskort ---------- */

export function StatCard({
  label,
  value,
  sub,
  trend,
  accent = false,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        'card card-pad transition duration-200 hover:shadow-card',
        accent && 'border-brass/30 bg-brass/6',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-faint">
        {label}
      </p>
      <p
        className={cn(
          'mt-3 font-display text-[27px] font-semibold leading-none tracking-tight tnum',
          accent ? 'text-brass' : 'text-ink',
        )}
      >
        {value}
      </p>
      <div className="mt-2.5 flex items-center gap-2">
        {sub && <span className="text-xs text-muted">{sub}</span>}
        {trend && (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
            <TrendingUp className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

/* ---------- Objektkort ---------- */

export function PropertyCard({
  property,
  highestBid,
}: {
  property: Property;
  highestBid?: number | null;
}) {
  const sqm = pricePerSqm(property.price, property.living_area);

  return (
    <Link
      href={`/objekt/${property.id}`}
      className="group card overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-raised">
        {property.image_url ? (
          <Image
            src={property.image_url}
            alt={property.address}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-faint">
            <Home className="h-8 w-8" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          <span className="rounded-full bg-surface/92 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.06em] text-ink shadow-subtle backdrop-blur">
            {property.district}
          </span>
        </div>
        <div className="absolute right-3 top-3 rounded-full bg-surface/92 shadow-subtle backdrop-blur">
          <PropertyStatusBadge status={property.status} />
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-[15px] font-semibold leading-snug text-ink">
            {property.address}
          </h3>
          <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-faint transition group-hover:text-brass" />
        </div>
        <p className="mt-1 text-xs text-faint">{property.city}</p>

        <div className="mt-3.5 flex items-baseline gap-2">
          <span className="font-display text-xl font-semibold tracking-tight text-ink tnum">
            {formatSEK(property.final_price ?? property.price, true)}
          </span>
          {property.final_price && (
            <span className="text-xs text-forest">slutpris</span>
          )}
          {!property.final_price && highestBid ? (
            <span className="text-xs font-medium text-brass">
              bud {formatSEK(highestBid, true)}
            </span>
          ) : null}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 border-t border-line pt-3.5 text-xs text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Bath className="h-3.5 w-3.5 text-faint" />
            {property.rooms} rum
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Maximize2 className="h-3.5 w-3.5 text-faint" />
            {formatArea(property.living_area)}
          </span>
          {sqm > 0 && (
            <span className="tnum text-faint">
              {formatSEK(sqm)}/m²
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

/* ---------- Radlista ---------- */

export function RowLink({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-3.5 rounded-md px-3 py-2.5 transition hover:bg-raised',
        className,
      )}
    >
      {children}
    </Link>
  );
}

export function PropertyTypePill({ property }: { property: Property }) {
  return <PropertyTypeBadge type={property.type} />;
}
