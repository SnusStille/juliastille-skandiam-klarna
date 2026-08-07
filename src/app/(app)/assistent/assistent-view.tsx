'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowUp,
  Check,
  Copy,
  Database,
  MessageSquarePlus,
  Sparkles,
  Square,
  Trash2,
} from 'lucide-react';
import { create, remove } from '@/lib/client';
import { RichText } from '@/components/rich-text';
import { ConfirmDialog, useToast } from '@/components/ui';
import { AI_MODES, QUICK_PROMPTS, type AiMode } from '@/lib/ai';
import type { Conversation, Message } from '@/lib/types';
import { cn, relativeTime } from '@/lib/utils';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export function AssistentView({
  conversations,
  messages,
  claudeReady,
  userName,
}: {
  conversations: Conversation[];
  messages: Message[];
  claudeReady: boolean;
  userName: string;
}) {
  const router = useRouter();
  const { push } = useToast();

  const [activeId, setActiveId] = useState<string | null>(
    conversations[0]?.id ?? null,
  );
  const [chat, setChat] = useState<ChatMessage[]>(() =>
    conversations[0]
      ? messages
          .filter((m) => m.conversation_id === conversations[0].id)
          .map((m) => ({ id: m.id, role: m.role, content: m.content }))
      : [],
  );
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<AiMode>('chat');
  const [useContext, setUseContext] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Conversation | null>(null);
  const [busy, setBusy] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [chat, streaming]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [input]);

  function selectConversation(conversation: Conversation) {
    if (streaming) return;
    setActiveId(conversation.id);
    setChat(
      messages
        .filter((m) => m.conversation_id === conversation.id)
        .map((m) => ({ id: m.id, role: m.role, content: m.content })),
    );
  }

  function newConversation() {
    if (streaming) return;
    setActiveId(null);
    setChat([]);
    setInput('');
  }

  async function send(text: string) {
    const content = text.trim();
    if (!content || streaming) return;

    setInput('');
    const userMessage: ChatMessage = {
      id: `local-${Date.now()}`,
      role: 'user',
      content,
    };
    const assistantId = `local-${Date.now()}-a`;
    const history = [...chat, userMessage];
    setChat([...history, { id: assistantId, role: 'assistant', content: '' }]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    let answer = '';
    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          mode,
          useContext,
          messages: history.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        answer =
          payload?.error ??
          'Något gick fel när svaret hämtades. Försök igen om en stund.';
        setChat([
          ...history,
          { id: assistantId, role: 'assistant', content: answer },
        ]);
      } else if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          answer += decoder.decode(value, { stream: true });
          setChat([
            ...history,
            { id: assistantId, role: 'assistant', content: answer },
          ]);
        }
      }
    } catch (error) {
      if ((error as Error)?.name !== 'AbortError') {
        answer =
          answer || 'Kunde inte nå assistenten. Kontrollera din anslutning.';
        setChat([
          ...history,
          { id: assistantId, role: 'assistant', content: answer },
        ]);
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }

    // Spara i historiken
    if (!answer.trim()) return;
    try {
      let conversationId = activeId;
      if (!conversationId) {
        const conversation = await create<Conversation>('conversations', {
          title: content.slice(0, 60),
        });
        conversationId = conversation.id;
        setActiveId(conversationId);
      }
      await create('messages', {
        conversation_id: conversationId,
        role: 'user',
        content,
      });
      await create('messages', {
        conversation_id: conversationId,
        role: 'assistant',
        content: answer,
      });
      router.refresh();
    } catch {
      /* historiken är sekundär — chatten fungerar ändå */
    }
  }

  function stop() {
    abortRef.current?.abort();
    setStreaming(false);
  }

  function copy(message: ChatMessage) {
    navigator.clipboard?.writeText(message.content);
    setCopiedId(message.id);
    setTimeout(() => setCopiedId(null), 1800);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setBusy(true);
    try {
      await remove('conversations', deleting.id);
      if (activeId === deleting.id) newConversation();
      push('Konversationen är borttagen.');
      setDeleting(null);
      router.refresh();
    } catch {
      push('Kunde inte ta bort konversationen.', 'error');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100dvh-3.5rem)] w-full max-w-[1240px] lg:h-[100dvh]">
      {/* Historik */}
      <aside className="hidden w-[240px] shrink-0 flex-col border-r border-line py-6 pr-5 xl:flex">
        <button className="btn-ghost w-full" onClick={newConversation}>
          <MessageSquarePlus className="h-4 w-4" />
          Ny konversation
        </button>
        <p className="mb-2 mt-6 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Historik
        </p>
        <div className="min-h-0 flex-1 space-y-0.5 overflow-y-auto">
          {conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={cn(
                'group flex items-center gap-1 rounded-md transition',
                activeId === conversation.id ? 'bg-raised' : 'hover:bg-raised/60',
              )}
            >
              <button
                onClick={() => selectConversation(conversation)}
                className="min-w-0 flex-1 px-2.5 py-2 text-left"
              >
                <span className="block truncate text-sm text-ink">
                  {conversation.title}
                </span>
                <span className="block text-[11px] text-faint">
                  {relativeTime(conversation.created_at)}
                </span>
              </button>
              <button
                aria-label="Ta bort konversation"
                onClick={() => setDeleting(conversation)}
                className="mr-1.5 rounded p-1 text-transparent transition group-hover:text-faint hover:!text-clay"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          {conversations.length === 0 && (
            <p className="px-2.5 py-3 text-xs text-faint">
              Inga sparade konversationer ännu.
            </p>
          )}
        </div>
      </aside>

      {/* Chatt */}
      <div className="flex min-w-0 flex-1 flex-col px-5 py-6 sm:px-7 xl:pl-7">
        <header className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="eyebrow">Assistent</p>
            <h1 className="mt-1.5 flex items-center gap-2 font-display text-[24px] font-medium tracking-tight text-ink">
              <Sparkles className="h-5 w-5 text-brass" />
              Stille AI
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label
              className={cn(
                'inline-flex cursor-pointer items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition',
                useContext
                  ? 'border-brass/40 bg-brass/10 text-brass'
                  : 'border-line text-muted hover:text-ink',
              )}
              title="Skickar en sammanfattning av dina objekt, kunder, visningar och uppgifter till Claude"
            >
              <input
                type="checkbox"
                className="sr-only"
                checked={useContext}
                onChange={(e) => setUseContext(e.target.checked)}
              />
              <Database className="h-3.5 w-3.5" />
              Min data
            </label>
            <button className="btn-ghost xl:hidden" onClick={newConversation}>
              <MessageSquarePlus className="h-4 w-4" />
              Ny
            </button>
          </div>
        </header>

        {!claudeReady && (
          <div className="mb-4 rounded-md border border-brass/35 bg-brass/8 px-4 py-3 text-sm leading-relaxed text-ink">
            <strong className="font-semibold">Claude är inte kopplad än.</strong>{' '}
            Lägg in <code className="font-mono text-xs">ANTHROPIC_API_KEY</code> i{' '}
            <code className="font-mono text-xs">.env.local</code> (lokalt) och
            under Settings → Environment Variables i Vercel. Allt annat i appen
            fungerar under tiden.
          </div>
        )}

        {/* Lägen */}
        <div className="no-scrollbar mb-4 flex gap-1.5 overflow-x-auto">
          {Object.values(AI_MODES).map((item) => (
            <button
              key={item.id}
              onClick={() => setMode(item.id as AiMode)}
              title={item.hint}
              className={cn(
                'shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                mode === item.id
                  ? 'border-brass bg-brass/12 text-brass'
                  : 'border-line text-muted hover:border-brass/40 hover:text-ink',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Meddelanden */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {chat.length === 0 ? (
            <div className="flex h-full flex-col justify-center py-8">
              <h2 className="font-display text-[20px] font-medium text-ink">
                Hej {userName.split(' ')[0]} — vad vill du ha hjälp med?
              </h2>
              <p className="mt-1.5 max-w-lg text-sm leading-relaxed text-muted">
                {AI_MODES[mode].hint} Assistenten kan läsa dina objekt, kunder,
                visningar och uppgifter när ”Min data” är påslaget.
              </p>
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {QUICK_PROMPTS.map((item) => (
                  <button
                    key={item.label}
                    onClick={() => {
                      setMode(item.mode);
                      void send(item.prompt);
                    }}
                    className="card group px-4 py-3.5 text-left transition hover:border-brass/40 hover:shadow-card"
                  >
                    <span className="block text-sm font-medium text-ink">
                      {item.label}
                    </span>
                    <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-faint">
                      {item.prompt}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5 py-2">
              {chat.map((message) => (
                <div
                  key={message.id}
                  className={cn(
                    'flex',
                    message.role === 'user' ? 'justify-end' : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'group relative max-w-[85%] rounded-lg px-4 py-3',
                      message.role === 'user'
                        ? 'bg-ink text-canvas'
                        : 'border border-line bg-surface',
                    )}
                  >
                    <div
                      className={cn(
                        'text-[15px] leading-relaxed',
                        message.role === 'user' ? 'text-canvas' : 'text-ink',
                      )}
                    >
                      {message.role === 'assistant' ? (
                        <RichText content={message.content} />
                      ) : (
                        <p className="whitespace-pre-wrap">{message.content}</p>
                      )}
                      {streaming &&
                        message.role === 'assistant' &&
                        !message.content && (
                          <span className="inline-flex gap-1 align-middle">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass [animation-delay:150ms]" />
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brass [animation-delay:300ms]" />
                          </span>
                        )}
                    </div>
                    {message.role === 'assistant' && message.content && (
                      <button
                        onClick={() => copy(message)}
                        aria-label="Kopiera svaret"
                        className="absolute -right-2 -top-2 rounded-md border border-line bg-surface p-1.5 text-faint opacity-0 shadow-subtle transition group-hover:opacity-100 hover:text-ink"
                      >
                        {copiedId === message.id ? (
                          <Check className="h-3.5 w-3.5 text-forest" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>
          )}
        </div>

        {/* Inmatning */}
        <div className="mt-4 rounded-lg border border-line bg-surface p-2.5 shadow-subtle focus-within:border-brass/45">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void send(input);
              }
            }}
            rows={1}
            placeholder={`Skriv till Stille AI… (${AI_MODES[mode].label})`}
            className="max-h-[220px] w-full resize-none bg-transparent px-2 py-1.5 text-[15px] leading-relaxed outline-none placeholder:text-faint"
          />
          <div className="flex items-center justify-between gap-3 pl-2">
            <span className="text-[11px] text-faint">
              Enter skickar · Shift + Enter ny rad
            </span>
            {streaming ? (
              <button
                onClick={stop}
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted transition hover:text-clay"
                aria-label="Avbryt"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                onClick={() => send(input)}
                disabled={!input.trim()}
                aria-label="Skicka"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brass text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
              >
                <ArrowUp className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Ta bort konversationen?"
        message={`”${deleting?.title ?? ''}” tas bort permanent.`}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
        busy={busy}
      />
    </div>
  );
}
