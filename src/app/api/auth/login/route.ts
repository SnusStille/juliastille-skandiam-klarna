import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE,
  appPassword,
  appUser,
  createSessionToken,
  safeEqual,
} from '@/lib/auth';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const schema = z.object({ password: z.string().min(1) });

/* Enkel bromskloss mot lösenordsgissning (per serverinstans). */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 8;
const LOCK_MS = 5 * 60 * 1000;

export async function POST(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local';

  const record = attempts.get(ip);
  if (record && record.count >= MAX_ATTEMPTS && Date.now() < record.until) {
    return NextResponse.json(
      {
        error: 'För många försök. Försök igen om några minuter.',
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 });
  }

  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Fyll i lösenordet.' }, { status: 400 });
  }

  if (!safeEqual(parsed.data.password, appPassword())) {
    const next = record && Date.now() < record.until ? record.count + 1 : 1;
    attempts.set(ip, { count: next, until: Date.now() + LOCK_MS });
    return NextResponse.json({ error: 'Fel lösenord.' }, { status: 401 });
  }

  attempts.delete(ip);

  const token = await createSessionToken(appUser());
  const response = NextResponse.json({ ok: true, user: appUser() });
  response.cookies.set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}
