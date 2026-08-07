import { Suspense } from 'react';
import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { KunderView } from './kunder-view';

export const dynamic = 'force-dynamic';

export default async function KunderPage() {
  const [contacts, properties] = await Promise.all([
    db.contacts.list(),
    db.properties.list(),
  ]);

  return (
    <Page>
      <Suspense fallback={<div className="skeleton h-96 w-full rounded-lg" />}>
        <KunderView contacts={contacts} properties={properties} />
      </Suspense>
    </Page>
  );
}
