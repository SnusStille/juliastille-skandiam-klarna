'use client';

import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PageHeader } from '@/components/shell';
import { StatCard } from '@/components/cards';
import { SectionTitle } from '@/components/ui';
import {
  CONTACT_STAGE_LABEL,
  CONTACT_STAGE_ORDER,
  PROPERTY_TYPE_LABEL,
  type Bid,
  type Contact,
  type Property,
  type Viewing,
} from '@/lib/types';
import { cn, formatSEK, pricePerSqm } from '@/lib/utils';

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
];

const COLORS = [
  'hsl(var(--brass))',
  'hsl(var(--forest))',
  'hsl(var(--sky))',
  'hsl(var(--clay))',
  'hsl(var(--muted))',
  'hsl(var(--faint))',
  'hsl(var(--ink))',
];

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card card-pad">
      <SectionTitle>{title}</SectionTitle>
      {description && (
        <p className="-mt-2 mb-4 text-xs leading-relaxed text-faint">
          {description}
        </p>
      )}
      <div className="h-[260px] w-full">{children}</div>
    </section>
  );
}

const axisStyle = {
  fontSize: 11,
  fill: 'hsl(var(--faint))',
} as const;

function tooltipStyle() {
  return {
    contentStyle: {
      background: 'hsl(var(--surface))',
      border: '1px solid hsl(var(--line))',
      borderRadius: 8,
      fontSize: 12,
      boxShadow: '0 8px 24px hsl(var(--shadow) / 0.12)',
      color: 'hsl(var(--ink))',
    },
    labelStyle: { color: 'hsl(var(--ink))', fontWeight: 600, marginBottom: 4 },
    itemStyle: { color: 'hsl(var(--muted))' },
  };
}

export function StatistikView({
  properties,
  contacts,
  viewings,
  bids,
}: {
  properties: Property[];
  contacts: Contact[];
  viewings: Viewing[];
  bids: Bid[];
}) {
  const [year, setYear] = useState<number>(new Date().getFullYear());

  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    for (const p of properties) {
      if (p.sold_at) set.add(new Date(p.sold_at).getFullYear());
      if (p.listed_at) set.add(new Date(p.listed_at).getFullYear());
    }
    return Array.from(set).sort((a, b) => b - a);
  }, [properties]);

  const sold = useMemo(
    () => properties.filter((p) => p.status === 'sald' && p.sold_at),
    [properties],
  );

  const soldThisYear = sold.filter(
    (p) => new Date(p.sold_at as string).getFullYear() === year,
  );

  const revenue = soldThisYear.reduce((sum, p) => sum + p.commission, 0);
  const totalValue = soldThisYear.reduce(
    (sum, p) => sum + (p.final_price ?? p.price),
    0,
  );

  const overAsking = soldThisYear.filter(
    (p) => (p.final_price ?? 0) > p.price,
  ).length;

  /* Månadsvis försäljning */
  const monthly = useMemo(
    () =>
      MONTHS.map((label, index) => {
        const rows = sold.filter((p) => {
          const date = new Date(p.sold_at as string);
          return date.getFullYear() === year && date.getMonth() === index;
        });
        return {
          month: label,
          objekt: rows.length,
          volym: Math.round(
            rows.reduce((sum, p) => sum + (p.final_price ?? p.price), 0) /
              1_000_000,
          ),
        };
      }),
    [sold, year],
  );

  /* Kvadratmeterpris per område */
  const perArea = useMemo(() => {
    const map = new Map<string, number[]>();
    for (const property of properties) {
      if (!property.living_area) continue;
      const key = property.district || property.city;
      const list = map.get(key) ?? [];
      list.push(pricePerSqm(property.final_price ?? property.price, property.living_area));
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([district, values]) => ({
        district,
        pris: Math.round(values.reduce((a, b) => a + b, 0) / values.length),
      }))
      .sort((a, b) => b.pris - a.pris)
      .slice(0, 8);
  }, [properties]);

  /* Pipeline */
  const pipeline = useMemo(
    () =>
      CONTACT_STAGE_ORDER.map((stage) => ({
        stage: CONTACT_STAGE_LABEL[stage],
        antal: contacts.filter((c) => c.stage === stage).length,
      })),
    [contacts],
  );

  /* Objektstyper */
  const byType = useMemo(() => {
    const map = new Map<string, number>();
    for (const property of properties) {
      const label = PROPERTY_TYPE_LABEL[property.type];
      map.set(label, (map.get(label) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [properties]);

  /* Visningsbesök */
  const attendance = useMemo(
    () =>
      [...viewings]
        .sort(
          (a, b) =>
            new Date(a.start_at).getTime() - new Date(b.start_at).getTime(),
        )
        .slice(-10)
        .map((viewing) => ({
          label:
            properties.find((p) => p.id === viewing.property_id)?.address.split(' ')[0] ??
            'Visning',
          besokare: viewing.attendees,
        })),
    [viewings, properties],
  );

  const avgAttendees = viewings.length
    ? Math.round(
        viewings.reduce((sum, v) => sum + v.attendees, 0) / viewings.length,
      )
    : 0;

  const highestBid = bids.length
    ? Math.max(...bids.map((b) => b.amount))
    : 0;

  return (
    <>
      <PageHeader
        eyebrow="Uppföljning"
        title="Statistik"
        description="Hur året utvecklas — försäljning, prisnivåer, pipeline och visningar."
        actions={
          <div className="flex gap-1.5">
            {years.slice(0, 3).map((value) => (
              <button
                key={value}
                onClick={() => setYear(value)}
                className={cn(
                  'rounded-md border px-3.5 py-2 text-sm font-medium transition tnum',
                  year === value
                    ? 'border-brass bg-brass/10 text-brass'
                    : 'border-line text-muted hover:text-ink',
                )}
              >
                {value}
              </button>
            ))}
          </div>
        }
      />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Sålda objekt ${year}`}
          value={String(soldThisYear.length)}
          sub={`${overAsking} över utgångspris`}
          accent
        />
        <StatCard
          label="Förmedlad volym"
          value={formatSEK(totalValue, true)}
          sub={`${sold.length} sålda totalt`}
        />
        <StatCard
          label="Arvode"
          value={formatSEK(revenue, true)}
          sub="Summerad provision för årets affärer"
        />
        <StatCard
          label="Snitt per visning"
          value={`${avgAttendees} besökare`}
          sub={
            highestBid ? `Högsta bud ${formatSEK(highestBid, true)}` : 'Inga bud än'
          }
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ChartCard
          title={`Försäljning ${year}`}
          description="Antal sålda objekt och total volym i miljoner kronor per månad."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthly} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="hsl(var(--line))"
                vertical={false}
              />
              <XAxis dataKey="month" tick={axisStyle} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'hsl(var(--raised))' }} {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--faint))' }} />
              <Bar dataKey="objekt" name="Objekt" fill="hsl(var(--brass))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="volym" name="Volym (mkr)" fill="hsl(var(--forest))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Kvadratmeterpris per område"
          description="Genomsnitt av utgångs- eller slutpris delat med boarea."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={perArea}
              layout="vertical"
              margin={{ top: 8, right: 16, left: 10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--line))" horizontal={false} />
              <XAxis
                type="number"
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value: number) => `${Math.round(value / 1000)}k`}
              />
              <YAxis
                type="category"
                dataKey="district"
                width={92}
                tick={axisStyle}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--raised))' }}
                formatter={(value: number) => [`${formatSEK(value)}/m²`, 'Snittpris']}
                {...tooltipStyle()}
              />
              <Bar dataKey="pris" fill="hsl(var(--brass))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Kundpipeline"
          description="Var dina kontakter befinner sig i processen just nu."
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={pipeline} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--line))" vertical={false} />
              <XAxis dataKey="stage" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip cursor={{ fill: 'hsl(var(--raised))' }} {...tooltipStyle()} />
              <Bar dataKey="antal" name="Kontakter" fill="hsl(var(--sky))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Besökare per visning"
          description="De tio senaste visningarna."
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendance} margin={{ top: 8, right: 12, left: -18, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--line))" vertical={false} />
              <XAxis dataKey="label" tick={{ ...axisStyle, fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={axisStyle} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip {...tooltipStyle()} />
              <Line
                type="monotone"
                dataKey="besokare"
                name="Besökare"
                stroke="hsl(var(--brass))"
                strokeWidth={2}
                dot={{ r: 3, fill: 'hsl(var(--brass))' }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Fördelning per objektstyp"
          description="Alla objekt i portföljen."
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={byType}
                dataKey="value"
                nameKey="name"
                innerRadius={54}
                outerRadius={92}
                paddingAngle={2}
                stroke="hsl(var(--surface))"
                strokeWidth={2}
              >
                {byType.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip {...tooltipStyle()} />
              <Legend wrapperStyle={{ fontSize: 11, color: 'hsl(var(--faint))' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <section className="card card-pad">
          <SectionTitle>Sålda objekt {year}</SectionTitle>
          {soldThisYear.length === 0 ? (
            <p className="text-sm text-faint">
              Inga sålda objekt registrerade för {year} ännu.
            </p>
          ) : (
            <div className="divide-y divide-line">
              {soldThisYear.map((property) => {
                const final = property.final_price ?? property.price;
                const diff = final - property.price;
                return (
                  <div
                    key={property.id}
                    className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-ink">
                        {property.address}
                      </p>
                      <p className="text-xs text-faint">
                        {property.district} · {property.living_area} m²
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-ink tnum">
                        {formatSEK(final)}
                      </p>
                      <p
                        className={cn(
                          'text-xs tnum',
                          diff > 0 ? 'text-forest' : diff < 0 ? 'text-clay' : 'text-faint',
                        )}
                      >
                        {diff > 0 ? '+' : ''}
                        {formatSEK(diff)} mot utgångspris
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
