import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { UppgifterView } from './uppgifter-view';

export const dynamic = 'force-dynamic';

export default async function UppgifterPage() {
  const [tasks, properties, contacts] = await Promise.all([
    db.tasks.list(),
    db.properties.list(),
    db.contacts.list(),
  ]);

  return (
    <Page>
      <UppgifterView tasks={tasks} properties={properties} contacts={contacts} />
    </Page>
  );
}
