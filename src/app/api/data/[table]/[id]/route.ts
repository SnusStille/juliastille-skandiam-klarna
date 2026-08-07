import { NextResponse } from 'next/server';
import { deleteRow, getRow, updateRow, type TableName } from '@/lib/db';
import { TABLE_SCHEMAS, firstError } from '@/lib/schemas';
import type { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const TABLES: TableName[] = [
  'properties',
  'contacts',
  'viewings',
  'bids',
  'tasks',
  'documents',
  'notes',
  'templates',
  'conversations',
  'messages',
];

function resolve(table: string): TableName | null {
  return TABLES.includes(table as TableName) ? (table as TableName) : null;
}

export async function GET(
  _request: Request,
  { params }: { params: { table: string; id: string } },
) {
  const table = resolve(params.table);
  if (!table)
    return NextResponse.json({ error: 'Okänd tabell.' }, { status: 404 });
  const row = await getRow(table, params.id);
  if (!row)
    return NextResponse.json({ error: 'Hittades inte.' }, { status: 404 });
  return NextResponse.json({ data: row });
}

export async function PATCH(
  request: Request,
  { params }: { params: { table: string; id: string } },
) {
  const table = resolve(params.table);
  if (!table)
    return NextResponse.json({ error: 'Okänd tabell.' }, { status: 404 });

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 });
  }

  const schema = TABLE_SCHEMAS[table];
  let patch = body;
  if (schema && 'partial' in schema) {
    const partial = (schema as unknown as z.AnyZodObject).partial();
    const parsed = partial.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstError(parsed.error) },
        { status: 422 },
      );
    }
    patch = parsed.data as Record<string, unknown>;
  }

  try {
    const row = await updateRow(table, params.id, patch);
    if (!row)
      return NextResponse.json({ error: 'Hittades inte.' }, { status: 404 });
    return NextResponse.json({ data: row });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunde inte uppdatera.' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { table: string; id: string } },
) {
  const table = resolve(params.table);
  if (!table)
    return NextResponse.json({ error: 'Okänd tabell.' }, { status: 404 });
  try {
    await deleteRow(table, params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunde inte ta bort.' },
      { status: 500 },
    );
  }
}
