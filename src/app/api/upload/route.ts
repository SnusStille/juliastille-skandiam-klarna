import { NextResponse } from 'next/server';
import { getServiceClient, STORAGE_BUCKET } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAX_BYTES = 15 * 1024 * 1024;

/**
 * Laddar upp en fil till Supabase Storage (bucket "media").
 * Kräver att Supabase-nycklarna är ifyllda i .env.local.
 */
export async function POST(request: Request) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      {
        error:
          'Filuppladdning kräver Supabase. Fyll i NEXT_PUBLIC_SUPABASE_URL och SUPABASE_SERVICE_ROLE_KEY i .env.local, eller spara dokumentet som länk istället.',
      },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 });
  }

  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Ingen fil bifogad.' }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: 'Filen är för stor. Max 15 MB.' },
      { status: 413 },
    );
  }

  const safeName = file.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .slice(-90);
  const path = `${Date.now()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(path, buffer, {
      contentType: file.type || 'application/octet-stream',
      upsert: false,
    });

  if (error) {
    return NextResponse.json(
      {
        error: `Uppladdningen misslyckades: ${error.message}. Kontrollera att bucketen "${STORAGE_BUCKET}" finns i Supabase.`,
      },
      { status: 500 },
    );
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);

  return NextResponse.json({
    url: data.publicUrl,
    name: file.name,
    size: file.size,
    mime: file.type || 'application/octet-stream',
  });
}
