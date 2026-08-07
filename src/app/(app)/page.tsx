import Link from 'next/link';
import {
  ArrowRight,
  CalendarDays,
  Gavel,
  ListChecks,
  Plus,
  Sparkles,
  Users,
} from 'lucide-react';
import { Page, PageHeader } from '@/components/shell';
import { PropertyCard, StatCard } from '@/components/cards';
import {
  ContactStageBadge,
  TaskPriorityBadge,
  ViewingTypeBadge,
} from '@/components/badges';
import { EmptyState } from '@/components/ui';
import { db } from '@/lib/db';
import {
  formatDate,
  formatSEK,
  formatTime,
  initials,
  isSameDay,
} from '@/lib/utils';

export const dynamic = 'force-dynamic';

const GREETINGS = [
  { until: 5, text: 'Sen kväll' },
  { until: 10, text: 'God morgon' },
  { until: 13, text: 'Förmiddag' },
  { until: 17, text: 'God eftermiddag' },
  { until: 22, text: 'God kväll' },
  { until: 24, text: 'Sen kväll' },
];

export default async function DashboardPage() {
  const [profile, properties, contacts, viewings, tasks, bids] =
    await Promise.all([
      db.profile.get(),
      db.properties.list(),
      db.contacts.list(),
      db.viewings.list(),
      db.tasks.list(),
      db.bids.list(),
    ]);

  const hour = new Date().getHours();
  const greeting =
    GREETINGS.find((g) => hour < g.until)?.text ?? 'Välkommen tillbaka';
  const firstName = profile.name.split(' ')[0];

  const active = properties.filter(
    (p) => p.status === 'till_salu' || p.status === 'budgivning',
  );
  const sold = properties.filter((p) => p.status === 'sald');
  const soldValue = sold.reduce((sum, p) => sum + (p.final_price ?? p.price), 0);
  const commission = sold.reduce((sum, p) => sum + p.commission, 0);
  const portfolioValue = active.reduce((sum, p) => sum + p.price, 0);

  const now = Date.now();
  const upcomingViewings = viewings
    .filter((v) => new Date(v.start_at).getTime() >= now - 3_600_000)
    .slice(0, 4);

  const openTasks = tasks
    .filter((t) => t.status !== 'klar')
    .sort((a, b) => {
      const ad = a.due_at ? new Date(a.due_at).getTime() : Infinity;
      const bd = b.due_at ? new Date(b.due_at).getTime() : Infinity;
      return ad - bd;
    });
  const overdue = openTasks.filter(
    (t) => t.due_at && new Date(t.due_at).getTime() < now,
  );

  const hotLeads = contacts
    .filter((c) => c.stage !== 'avslutad' && c.type !== 'saljare')
    .slice(0, 5);

  const activeBids = bids
    .filter((b) => b.status === 'aktivt' || b.status === 'hogsta')
    .slice(0, 4);

  const highestFor = (propertyId: string) => {
    const list = bids.filter((b) => b.property_id === propertyId);
    return list.length ? Math.max(...list.map((b) => b.amount)) : null;
  };

  const goalProgress = profile.goal_revenue
    ? Math.min(100, Math.round((commission / profile.goal_revenue) * 100))
    : 0;

  return (
    <Page>
      <PageHeader
        eyebrow={new Date().toLocaleDateString('sv-SE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        title={`${greeting}, ${firstName}.`}
        description={
          openTasks.length
            ? `Du har ${openTasks.length} öppna uppgifter${
                overdue.length ? `, varav ${overdue.length} försenade` : ''
              } och ${upcomingViewings.length} visningar på gång.`
            : 'Allt är avbockat. Fin dag att ringa några gamla kunder.'
        }
        actions={
          <>
            <Link href="/assistent" className="btn-ghost">
              <Sparkles className="h-4 w-4 text-brass" />
              Fråga Stille AI
            </Link>
            <Link href="/objekt?nytt=1" className="btn-primary">
              <Plus className="h-4 w-4" />
              Nytt objekt
            </Link>
          </>
        }
      />

      {/* Nyckeltal */}
      <div className="grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        <StatCard
          label="Aktiva objekt"
          value={String(active.length)}
          sub={`${formatSEK(portfolioValue, true)} i portfölj`}
        />
        <StatCard
          label="Sålt i år"
          value={String(sold.length)}
          sub={formatSEK(soldValue, true)}
        />
        <StatCard
          label="Provision"
          value={formatSEK(commission, true)}
          sub={`${goalProgress}% av årsmålet`}
          accent
        />
        <StatCard
          label="Kunder i registret"
          value={String(contacts.length)}
          sub={`${hotLeads.length} aktiva leads`}
        />
      </div>

      {/* Målstapel */}
      <div className="card card-pad mt-3.5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="eyebrow">Årsmål provision</p>
            <p className="mt-1.5 font-display text-lg font-semibold text-ink tnum">
              {formatSEK(commission)}{' '}
              <span className="text-sm font-normal text-faint">
                av {formatSEK(profile.goal_revenue)}
              </span>
            </p>
          </div>
          <span className="text-sm font-semibold text-brass tnum">
            {goalProgress}%
          </span>
        </div>
        <div className="mt-3.5 h-2 w-full overflow-hidden rounded-full bg-raised">
          <div
            className="h-full rounded-full bg-brass transition-all duration-700"
            style={{ width: `${Math.max(goalProgress, 2)}%` }}
          />
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Vänsterkolumn */}
        <div className="space-y-6 lg:col-span-2">
          <section>
            <div className="mb-3.5 flex items-end justify-between">
              <h2 className="font-display text-[17px] font-semibold text-ink">
                Aktiva objekt
              </h2>
              <Link
                href="/objekt"
                className="inline-flex items-center gap-1 text-sm font-medium text-muted transition hover:text-brass"
              >
                Alla objekt
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {active.length ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {active.slice(0, 4).map((property) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    highestBid={highestFor(property.id)}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title="Inga aktiva objekt"
                message="Lägg upp ditt första objekt så dyker det upp här."
                action={
                  <Link href="/objekt?nytt=1" className="btn-primary">
                    <Plus className="h-4 w-4" />
                    Nytt objekt
                  </Link>
                }
              />
            )}
          </section>

          {/* Uppgifter */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <ListChecks className="h-4 w-4 text-brass" />
                Att göra
              </h2>
              <Link
                href="/uppgifter"
                className="text-sm font-medium text-muted transition hover:text-brass"
              >
                Alla
              </Link>
            </div>
            <div className="divide-y divide-line">
              {openTasks.slice(0, 5).map((task) => {
                const property = properties.find((p) => p.id === task.property_id);
                const late = task.due_at && new Date(task.due_at).getTime() < now;
                return (
                  <Link
                    key={task.id}
                    href="/uppgifter"
                    className="flex items-start gap-3.5 px-5 py-3.5 transition hover:bg-raised/50"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        task.priority === 'hog'
                          ? 'bg-clay'
                          : task.priority === 'normal'
                            ? 'bg-sky'
                            : 'bg-line'
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-ink">
                        {task.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-faint">
                        {property ? `${property.address} · ` : ''}
                        {task.due_at ? formatDate(task.due_at) : 'Ingen deadline'}
                      </span>
                    </span>
                    {late && (
                      <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-clay">
                        Försenad
                      </span>
                    )}
                  </Link>
                );
              })}
              {openTasks.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-faint">
                  Inga öppna uppgifter. Snyggt jobbat.
                </p>
              )}
            </div>
          </section>
        </div>

        {/* Högerkolumn */}
        <div className="space-y-6">
          {/* Visningar */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <CalendarDays className="h-4 w-4 text-brass" />
                Kommande visningar
              </h2>
              <Link
                href="/visningar"
                className="text-sm font-medium text-muted transition hover:text-brass"
              >
                Alla
              </Link>
            </div>
            <div className="divide-y divide-line">
              {upcomingViewings.map((viewing) => {
                const property = properties.find(
                  (p) => p.id === viewing.property_id,
                );
                const date = new Date(viewing.start_at);
                const today = isSameDay(date, new Date());
                return (
                  <div key={viewing.id} className="flex gap-3.5 px-5 py-3.5">
                    <div className="flex w-11 shrink-0 flex-col items-center rounded-md border border-line bg-canvas py-1.5">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-faint">
                        {date
                          .toLocaleDateString('sv-SE', { month: 'short' })
                          .replace('.', '')}
                      </span>
                      <span className="font-display text-base font-semibold leading-none text-ink">
                        {date.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {property?.address ?? viewing.title}
                      </p>
                      <p className="mt-0.5 text-xs text-faint">
                        {today ? 'Idag' : formatDate(viewing.start_at)} ·{' '}
                        {formatTime(viewing.start_at)}–
                        {formatTime(viewing.end_at)}
                      </p>
                      <div className="mt-1.5">
                        <ViewingTypeBadge type={viewing.type} />
                      </div>
                    </div>
                  </div>
                );
              })}
              {upcomingViewings.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-faint">
                  Inga inbokade visningar.
                </p>
              )}
            </div>
          </section>

          {/* Budgivning */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <Gavel className="h-4 w-4 text-brass" />
                Pågående bud
              </h2>
              <Link
                href="/budgivning"
                className="text-sm font-medium text-muted transition hover:text-brass"
              >
                Alla
              </Link>
            </div>
            <div className="divide-y divide-line">
              {activeBids.map((bid) => {
                const property = properties.find((p) => p.id === bid.property_id);
                return (
                  <div
                    key={bid.id}
                    className="flex items-center gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-ink">
                        {bid.bidder_name}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-faint">
                        {property?.address ?? '—'}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 font-display text-sm font-semibold tnum ${
                        bid.status === 'hogsta' ? 'text-brass' : 'text-ink'
                      }`}
                    >
                      {formatSEK(bid.amount, true)}
                    </span>
                  </div>
                );
              })}
              {activeBids.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-faint">
                  Ingen aktiv budgivning just nu.
                </p>
              )}
            </div>
          </section>

          {/* Leads */}
          <section className="card">
            <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
              <h2 className="flex items-center gap-2 font-display text-[15px] font-semibold text-ink">
                <Users className="h-4 w-4 text-brass" />
                Aktiva leads
              </h2>
              <Link
                href="/kunder"
                className="text-sm font-medium text-muted transition hover:text-brass"
              >
                Alla
              </Link>
            </div>
            <div className="divide-y divide-line">
              {hotLeads.map((contact) => (
                <Link
                  key={contact.id}
                  href={`/kunder?fokus=${contact.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition hover:bg-raised/50"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-raised text-[11px] font-semibold text-muted">
                    {initials(contact.name)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink">
                      {contact.name}
                    </span>
                    <span className="block truncate text-xs text-faint">
                      {contact.wanted_area || contact.source}
                    </span>
                  </span>
                  <ContactStageBadge stage={contact.stage} />
                </Link>
              ))}
              {hotLeads.length === 0 && (
                <p className="px-5 py-10 text-center text-sm text-faint">
                  Inga aktiva leads.
                </p>
              )}
            </div>
          </section>
        </div>
      </div>
    </Page>
  );
}
