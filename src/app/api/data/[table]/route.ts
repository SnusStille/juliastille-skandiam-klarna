import { NextResponse } from 'next/server';
import { insertRow, listRows, type TableName } from '@/lib/db';
import { TABLE_SCHEMAS, firstError } from '@/lib/schemas';
import { z } from 'zod';

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
  request: Request,
  { params }: { params: { table: string } },
) {
  const table = resolve(params.table);
  if (!table)
    return NextResponse.json({ error: 'Okänd tabell.' }, { status: 404 });

  const url = new URL(request.url);
  const match: Record<string, string> = {};
  url.searchParams.forEach((value, key) => {
    if (key !== 'orderBy' && key !== 'ascending') match[key] = value;
  });

  try {
    const rows = await listRows(table, {
      orderBy: url.searchParams.get('orderBy') ?? 'created_at',
      ascending: url.searchParams.get('ascending') === 'true',
      match: Object.keys(match).length ? match : undefined,
    });
    return NextResponse.json({ data: rows });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunde inte hämta data.' },
      { status: 500 },
    );
  }
}

export async function POST(
  request: Request,
  { params }: { params: { table: string } },
) {
  const table = resolve(params.table);
  if (!table)
    return NextResponse.json({ error: 'Okänd tabell.' }, { status: 404 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Ogiltig förfrågan.' }, { status: 400 });
  }

  const schema = TABLE_SCHEMAS[table];
  let values = body as Record<string, unknown>;
  if (schema) {
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: firstError(parsed.error as z.ZodError) },
        { status: 422 },
      );
    }
    values = parsed.data as Record<string, unknown>;
  }

  try {
    const row = await insertRow(table, values);
    return NextResponse.json({ data: row }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Kunde inte spara.' },
      { status: 500 },
    );
  }
}
