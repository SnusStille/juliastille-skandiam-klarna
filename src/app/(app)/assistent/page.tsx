import { db } from '@/lib/db';
import { AssistentView } from './assistent-view';

export const dynamic = 'force-dynamic';

export default async function AssistentPage() {
  const [conversations, messages, profile] = await Promise.all([
    db.conversations.list(),
    db.messages.list(),
    db.profile.get(),
  ]);

  const sortedConversations = [...conversations].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
  const sortedMessages = [...messages].sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  );

  return (
    <AssistentView
      conversations={sortedConversations}
      messages={sortedMessages}
      claudeReady={Boolean(process.env.ANTHROPIC_API_KEY?.trim())}
      userName={profile.name}
    />
  );
}
