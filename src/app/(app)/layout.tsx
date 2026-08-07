import { db } from '@/lib/db';
import { Shell } from '@/components/shell';

export const dynamic = 'force-dynamic';

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [profile, properties, contacts] = await Promise.all([
    db.profile.get(),
    db.properties.list(),
    db.contacts.list(),
  ]);

  return (
    <Shell
      userName={profile.name}
      agency={profile.agency}
      properties={properties}
      contacts={contacts}
    >
      {children}
    </Shell>
  );
}
