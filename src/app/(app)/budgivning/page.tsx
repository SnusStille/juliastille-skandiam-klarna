import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { BudgivningView } from './budgivning-view';

export const dynamic = 'force-dynamic';

export default async function BudgivningPage() {
  const [bids, properties, contacts] = await Promise.all([
    db.bids.list(),
    db.properties.list(),
    db.contacts.list(),
  ]);

  return (
    <Page>
      <BudgivningView bids={bids} properties={properties} contacts={contacts} />
    </Page>
  );
}
