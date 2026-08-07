import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { SUPABASE_ENABLED } from '@/lib/supabase';
import { DokumentView } from './dokument-view';

export const dynamic = 'force-dynamic';

export default async function DokumentPage() {
  const [documents, properties] = await Promise.all([
    db.documents.list(),
    db.properties.list(),
  ]);

  return (
    <Page>
      <DokumentView
        documents={documents}
        properties={properties}
        supabaseReady={SUPABASE_ENABLED}
      />
    </Page>
  );
}
