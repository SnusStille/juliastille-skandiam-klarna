'use client';

/* Tunna fetch-hjälpare mot appens API. Kastar Error med svenskt meddelande. */

async function handle<T>(response: Response): Promise<T> {
  let payload: any = null;
  try {
    payload = await response.json();
  } catch {
    /* tomt svar */
  }
  if (!response.ok) {
    throw new Error(payload?.error || 'Något gick fel. Försök igen.');
  }
  return (payload?.data ?? payload) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const response = await fetch(path, { cache: 'no-store' });
  return handle<T>(response);
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handle<T>(response);
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  return handle<T>(response);
}

export async function apiDelete(path: string): Promise<void> {
  const response = await fetch(path, { method: 'DELETE' });
  await handle(response);
}

export const create = <T,>(table: string, values: unknown) =>
  apiPost<T>(`/api/data/${table}`, values);

export const patch = <T,>(table: string, id: string, values: unknown) =>
  apiPatch<T>(`/api/data/${table}/${id}`, values);

export const remove = (table: string, id: string) =>
  apiDelete(`/api/data/${table}/${id}`);
