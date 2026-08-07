import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase-klienter.
 *
 * - `getServiceClient()` används på servern (API-routes / server actions) och
 *   använder service_role-nyckeln. Får ALDRIG importeras i klientkomponenter.
 * - `getBrowserClient()` används för publika läsningar och Storage-uppladdning.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || '';
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || '';

export const SUPABASE_ENABLED = Boolean(url && (serviceKey || anonKey));

let serviceClient: SupabaseClient | null = null;

export function getServiceClient(): SupabaseClient | null {
  if (!url) return null;
  const key = serviceKey || anonKey;
  if (!key) return null;
  if (!serviceClient) {
    serviceClient = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return serviceClient;
}

let browserClient: SupabaseClient | null = null;

export function getBrowserClient(): SupabaseClient | null {
  if (!url || !anonKey) return null;
  if (!browserClient) {
    browserClient = createClient(url, anonKey, {
      auth: { persistSession: false },
    });
  }
  return browserClient;
}

export const STORAGE_BUCKET = 'media';
