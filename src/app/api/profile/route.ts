import { NextResponse } from 'next/server';
import { getProfile, updateProfile } from '@/lib/db';
import { profileSchema, firstError } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const profile = await getProfile();
  return NextResponse.json({ data: profile });
}

export async function PATCH(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 });
  }

  const parsed = profileSchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error) }, { status: 422 });
  }

  try {
    const profile = await updateProfile(parsed.data);
    return NextResponse.json({ data: profile });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunde inte spara.' },
      { status: 500 },
    );
  }
}
