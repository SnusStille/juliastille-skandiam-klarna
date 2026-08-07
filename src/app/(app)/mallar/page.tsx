import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { MallarView } from './mallar-view';

export const dynamic = 'force-dynamic';

export default async function MallarPage() {
  const [templates, profile] = await Promise.all([
    db.templates.list(),
    db.profile.get(),
  ]);

  return (
    <Page>
      <MallarView templates={templates} userName={profile.name} />
    </Page>
  );
}
