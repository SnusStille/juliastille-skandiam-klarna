import { getServiceClient, SUPABASE_ENABLED } from './supabase';
import {
  seedBids,
  seedContacts,
  seedConversations,
  seedDocuments,
  seedMessages,
  seedNotes,
  seedProfile,
  seedProperties,
  seedTasks,
  seedTemplates,
  seedViewings,
} from './seed';
import type {
  Bid,
  Contact,
  Conversation,
  DocumentItem,
  Message,
  NoteItem,
  Profile,
  Property,
  Task,
  TemplateItem,
  Viewing,
} from './types';
import { uid } from './utils';

/* ==========================================================================
   Dataåtkomst.

   Kör mot Supabase när NEXT_PUBLIC_SUPABASE_URL + nyckel finns i miljön.
   Saknas de används en minnesbaserad demobutik med samma innehåll som
   supabase/seed.sql — appen fungerar alltså direkt efter `npm run dev`.
   ========================================================================== */

export type TableName =
  | 'properties'
  | 'contacts'
  | 'viewings'
  | 'bids'
  | 'tasks'
  | 'documents'
  | 'notes'
  | 'templates'
  | 'conversations'
  | 'messages';

type Row = Record<string, any>;

/* ---------- Minnesbutik ---------- */

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

declare global {
  // eslint-disable-next-line no-var
  var __juliaStore: Record<string, Row[]> | undefined;
  // eslint-disable-next-line no-var
  var __juliaProfile: Profile | undefined;
}

function memory(): Record<string, Row[]> {
  if (!globalThis.__juliaStore) {
    globalThis.__juliaStore = {
      properties: clone(seedProperties),
      contacts: clone(seedContacts),
      viewings: clone(seedViewings),
      bids: clone(seedBids),
      tasks: clone(seedTasks),
      documents: clone(seedDocuments),
      notes: clone(seedNotes),
      templates: clone(seedTemplates),
      conversations: clone(seedConversations),
      messages: clone(seedMessages),
    };
  }
  return globalThis.__juliaStore;
}

function memoryProfile(): Profile {
  if (!globalThis.__juliaProfile) {
    globalThis.__juliaProfile = clone(seedProfile);
  }
  return globalThis.__juliaProfile;
}

/* ---------- Generiska operationer ---------- */

export interface ListOptions {
  orderBy?: string;
  ascending?: boolean;
  match?: Record<string, string | number | null>;
  limit?: number;
}

function sortRows(rows: Row[], orderBy?: string, ascending = false) {
  if (!orderBy) return rows;
  return [...rows].sort((a, b) => {
    const av = a[orderBy];
    const bv = b[orderBy];
    if (av === bv) return 0;
    if (av === null || av === undefined) return 1;
    if (bv === null || bv === undefined) return -1;
    const res = av > bv ? 1 : -1;
    return ascending ? res : -res;
  });
}

export async function listRows<T = Row>(
  table: TableName,
  options: ListOptions = {},
): Promise<T[]> {
  const { orderBy, ascending = false, match, limit } = options;

  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    let query = client.from(table).select('*');
    if (match) {
      for (const [key, value] of Object.entries(match)) {
        query = value === null ? query.is(key, null) : query.eq(key, value);
      }
    }
    if (orderBy) query = query.order(orderBy, { ascending });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw new Error(`[${table}] ${error.message}`);
    return (data ?? []) as T[];
  }

  let rows = memory()[table] ?? [];
  if (match) {
    rows = rows.filter((row) =>
      Object.entries(match).every(([key, value]) => row[key] === value),
    );
  }
  rows = sortRows(rows, orderBy, ascending);
  if (limit) rows = rows.slice(0, limit);
  return clone(rows) as T[];
}

export async function getRow<T = Row>(
  table: TableName,
  id: string,
): Promise<T | null> {
  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    const { data, error } = await client
      .from(table)
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw new Error(`[${table}] ${error.message}`);
    return (data as T) ?? null;
  }
  const row = (memory()[table] ?? []).find((r) => r.id === id);
  return row ? (clone(row) as T) : null;
}

export async function insertRow<T = Row>(
  table: TableName,
  values: Row,
): Promise<T> {
  const record: Row = {
    id: values.id ?? uid(),
    created_at: values.created_at ?? new Date().toISOString(),
    ...values,
  };
  record.id = values.id ?? record.id;

  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    const { data, error } = await client
      .from(table)
      .insert(record)
      .select()
      .single();
    if (error) throw new Error(`[${table}] ${error.message}`);
    return data as T;
  }
  memory()[table] = [record, ...(memory()[table] ?? [])];
  return clone(record) as T;
}

export async function updateRow<T = Row>(
  table: TableName,
  id: string,
  patch: Row,
): Promise<T | null> {
  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    const { data, error } = await client
      .from(table)
      .update(patch)
      .eq('id', id)
      .select()
      .maybeSingle();
    if (error) throw new Error(`[${table}] ${error.message}`);
    return (data as T) ?? null;
  }
  const rows = memory()[table] ?? [];
  const index = rows.findIndex((r) => r.id === id);
  if (index === -1) return null;
  rows[index] = { ...rows[index], ...patch };
  return clone(rows[index]) as T;
}

export async function deleteRow(table: TableName, id: string): Promise<void> {
  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    const { error } = await client.from(table).delete().eq('id', id);
    if (error) throw new Error(`[${table}] ${error.message}`);
    return;
  }
  memory()[table] = (memory()[table] ?? []).filter((r) => r.id !== id);
}

/* ---------- Profil (en rad) ---------- */

export async function getProfile(): Promise<Profile> {
  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    const { data, error } = await client
      .from('profile')
      .select('*')
      .eq('id', 'profile')
      .maybeSingle();
    if (error) throw new Error(`[profile] ${error.message}`);
    if (data) return data as Profile;
    return seedProfile;
  }
  return clone(memoryProfile());
}

export async function updateProfile(patch: Partial<Profile>): Promise<Profile> {
  const client = SUPABASE_ENABLED ? getServiceClient() : null;
  if (client) {
    const { data, error } = await client
      .from('profile')
      .upsert({ id: 'profile', ...patch })
      .select()
      .single();
    if (error) throw new Error(`[profile] ${error.message}`);
    return data as Profile;
  }
  globalThis.__juliaProfile = { ...memoryProfile(), ...patch } as Profile;
  return clone(globalThis.__juliaProfile);
}

/* ---------- Typade genvägar ---------- */

export const db = {
  properties: {
    list: () =>
      listRows<Property>('properties', {
        orderBy: 'created_at',
        ascending: false,
      }),
    get: (id: string) => getRow<Property>('properties', id),
    create: (values: Partial<Property>) =>
      insertRow<Property>('properties', values),
    update: (id: string, patch: Partial<Property>) =>
      updateRow<Property>('properties', id, patch),
    remove: (id: string) => deleteRow('properties', id),
  },
  contacts: {
    list: () =>
      listRows<Contact>('contacts', { orderBy: 'created_at', ascending: false }),
    get: (id: string) => getRow<Contact>('contacts', id),
    create: (values: Partial<Contact>) => insertRow<Contact>('contacts', values),
    update: (id: string, patch: Partial<Contact>) =>
      updateRow<Contact>('contacts', id, patch),
    remove: (id: string) => deleteRow('contacts', id),
  },
  viewings: {
    list: () =>
      listRows<Viewing>('viewings', { orderBy: 'start_at', ascending: true }),
    create: (values: Partial<Viewing>) => insertRow<Viewing>('viewings', values),
    update: (id: string, patch: Partial<Viewing>) =>
      updateRow<Viewing>('viewings', id, patch),
    remove: (id: string) => deleteRow('viewings', id),
  },
  bids: {
    list: () => listRows<Bid>('bids', { orderBy: 'bid_at', ascending: false }),
    create: (values: Partial<Bid>) => insertRow<Bid>('bids', values),
    update: (id: string, patch: Partial<Bid>) =>
      updateRow<Bid>('bids', id, patch),
    remove: (id: string) => deleteRow('bids', id),
  },
  tasks: {
    list: () =>
      listRows<Task>('tasks', { orderBy: 'created_at', ascending: false }),
    create: (values: Partial<Task>) => insertRow<Task>('tasks', values),
    update: (id: string, patch: Partial<Task>) =>
      updateRow<Task>('tasks', id, patch),
    remove: (id: string) => deleteRow('tasks', id),
  },
  documents: {
    list: () =>
      listRows<DocumentItem>('documents', {
        orderBy: 'created_at',
        ascending: false,
      }),
    create: (values: Partial<DocumentItem>) =>
      insertRow<DocumentItem>('documents', values),
    remove: (id: string) => deleteRow('documents', id),
  },
  notes: {
    list: () =>
      listRows<NoteItem>('notes', { orderBy: 'created_at', ascending: false }),
    create: (values: Partial<NoteItem>) => insertRow<NoteItem>('notes', values),
    remove: (id: string) => deleteRow('notes', id),
  },
  templates: {
    list: () =>
      listRows<TemplateItem>('templates', {
        orderBy: 'created_at',
        ascending: false,
      }),
    create: (values: Partial<TemplateItem>) =>
      insertRow<TemplateItem>('templates', values),
    update: (id: string, patch: Partial<TemplateItem>) =>
      updateRow<TemplateItem>('templates', id, patch),
    remove: (id: string) => deleteRow('templates', id),
  },
  conversations: {
    list: () =>
      listRows<Conversation>('conversations', {
        orderBy: 'created_at',
        ascending: false,
      }),
    create: (values: Partial<Conversation>) =>
      insertRow<Conversation>('conversations', values),
    update: (id: string, patch: Partial<Conversation>) =>
      updateRow<Conversation>('conversations', id, patch),
    remove: (id: string) => deleteRow('conversations', id),
  },
  messages: {
    list: () =>
      listRows<Message>('messages', {
        orderBy: 'created_at',
        ascending: true,
      }),
    listFor: (conversationId: string) =>
      listRows<Message>('messages', {
        orderBy: 'created_at',
        ascending: true,
        match: { conversation_id: conversationId },
      }),
    create: (values: Partial<Message>) => insertRow<Message>('messages', values),
  },
  profile: {
    get: getProfile,
    update: updateProfile,
  },
};
