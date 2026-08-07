import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { VisningarView } from './visningar-view';

export const dynamic = 'force-dynamic';

export default async function VisningarPage() {
  const [viewings, properties] = await Promise.all([
    db.viewings.list(),
    db.properties.list(),
  ]);

  return (
    <Page>
      <VisningarView viewings={viewings} properties={properties} />
    </Page>
  );
}
