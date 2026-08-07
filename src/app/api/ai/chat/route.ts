import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { AI_MODES, buildContext, systemPrompt, type AiMode } from '@/lib/ai';
import { appUser } from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const schema = z.object({
  mode: z.string().optional(),
  useContext: z.boolean().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1),
      }),
    )
    .min(1),
});

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'ANTHROPIC_API_KEY saknas. Lägg till din Claude-nyckel i .env.local (eller i Vercel under Settings → Environment Variables) och ladda om sidan.',
      }),
      { status: 503, headers: { 'content-type': 'application/json' } },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Ogiltig förfrågan.' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: 'Ogiltigt meddelande.' }), {
      status: 422,
      headers: { 'content-type': 'application/json' },
    });
  }

  const mode: AiMode =
    parsed.data.mode && parsed.data.mode in AI_MODES
      ? (parsed.data.mode as AiMode)
      : 'chat';

  let context = '';
  if (parsed.data.useContext !== false) {
    try {
      context = await buildContext();
    } catch {
      context = '';
    }
  }

  const anthropic = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL?.trim() || DEFAULT_MODEL;

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const response = await anthropic.messages.stream({
          model,
          max_tokens: 2048,
          temperature: 0.7,
          system: systemPrompt(mode, context, appUser()),
          messages: parsed.data.messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        });

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (error) {
        const message =
          error instanceof Anthropic.APIError
            ? `Claude svarade med ett fel (${error.status}). ${
                error.status === 401
                  ? 'Kontrollera att ANTHROPIC_API_KEY är giltig.'
                  : error.status === 429
                    ? 'Du har nått gränsen för antal anrop — vänta en stund.'
                    : 'Försök igen om en stund.'
              }`
            : 'Kunde inte nå Claude just nu. Kontrollera din internetanslutning och försök igen.';
        controller.enqueue(encoder.encode(`\n\n⚠️ ${message}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'content-type': 'text/plain; charset=utf-8',
      'cache-control': 'no-store',
      'x-accel-buffering': 'no',
    },
  });
}
