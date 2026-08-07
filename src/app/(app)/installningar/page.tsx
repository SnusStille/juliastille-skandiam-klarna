import { Page } from '@/components/shell';
import { db } from '@/lib/db';
import { SUPABASE_ENABLED } from '@/lib/supabase';
import { InstallningarView } from './installningar-view';

export const dynamic = 'force-dynamic';

export default async function InstallningarPage() {
  const profile = await db.profile.get();

  return (
    <Page>
      <InstallningarView
        profile={profile}
        supabaseReady={SUPABASE_ENABLED}
        claudeReady={Boolean(process.env.ANTHROPIC_API_KEY?.trim())}
        model={
          process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929'
        }
      />
    </Page>
  );
}
