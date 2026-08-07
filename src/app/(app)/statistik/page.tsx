import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { StatistikView } from './statistik-view';

export const dynamic = 'force-dynamic';

export default async function StatistikPage() {
  const [properties, contacts, viewings, bids] = await Promise.all([
    db.properties.list(),
    db.contacts.list(),
    db.viewings.list(),
    db.bids.list(),
  ]);

  return (
    <Page>
      <StatistikView
        properties={properties}
        contacts={contacts}
        viewings={viewings}
        bids={bids}
      />
    </Page>
  );
}
