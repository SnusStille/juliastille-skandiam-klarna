import { Suspense } from 'react';
import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { ObjektView } from './objekt-view';

export const dynamic = 'force-dynamic';

export default async function ObjektPage() {
  const [properties, contacts, bids] = await Promise.all([
    db.properties.list(),
    db.contacts.list(),
    db.bids.list(),
  ]);

  return (
    <Page>
      <Suspense fallback={<div className="skeleton h-96 w-full rounded-lg" />}>
        <ObjektView properties={properties} contacts={contacts} bids={bids} />
      </Suspense>
    </Page>
  );
}
