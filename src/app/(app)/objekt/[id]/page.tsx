import { notFound } from 'next/navigation';
import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { DetaljView } from './detalj-view';

export const dynamic = 'force-dynamic';

export default async function ObjektDetaljPage({
  params,
}: {
  params: { id: string };
}) {
  const property = await db.properties.get(params.id);
  if (!property) notFound();

  const [contacts, viewings, bids, tasks, notes] = await Promise.all([
    db.contacts.list(),
    db.viewings.list(),
    db.bids.list(),
    db.tasks.list(),
    db.notes.list(),
  ]);

  return (
    <Page>
      <DetaljView
        property={property}
        contacts={contacts}
        viewings={viewings.filter((v) => v.property_id === params.id)}
        bids={bids.filter((b) => b.property_id === params.id)}
        tasks={tasks.filter((t) => t.property_id === params.id)}
        notes={notes.filter((n) => n.property_id === params.id)}
      />
    </Page>
  );
}
