import { NextResponse } from 'next/server';
import { SUPABASE_ENABLED } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    supabase: SUPABASE_ENABLED,
    claude: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
    model: process.env.ANTHROPIC_MODEL?.trim() || 'claude-sonnet-4-5-20250929',
    mode: SUPABASE_ENABLED ? 'supabase' : 'demo',
  });
}
