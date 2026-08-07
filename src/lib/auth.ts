import { SignJWT, jwtVerify } from 'jose';

/* ==========================================================================
   Autentisering — signerad sessionskaka (JWT, HttpOnly).
   Lösenordet sätts med APP_PASSWORD i .env.local.
   ========================================================================== */

export const SESSION_COOKIE = 'julia_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 dagar

const FALLBACK_SECRET =
  'julia-stille-utvecklingsnyckel-byt-ut-mig-i-produktion-1234567890';

function secretKey() {
  const raw = process.env.AUTH_SECRET?.trim();
  const value = raw && raw.length >= 32 ? raw : FALLBACK_SECRET;
  return new TextEncoder().encode(value);
}

export function appPassword() {
  return process.env.APP_PASSWORD?.trim() || 'Loppan123';
}

export function appUser() {
  return process.env.NEXT_PUBLIC_APP_USER?.trim() || 'Julia Stille';
}

/** Konstanttidsjämförelse så att svarstiden inte läcker information. */
export function safeEqual(a: string, b: string) {
  const enc = new TextEncoder();
  const bufA = enc.encode(a);
  const bufB = enc.encode(b);
  const length = Math.max(bufA.length, bufB.length);
  let diff = bufA.length ^ bufB.length;
  for (let i = 0; i < length; i++) {
    diff |= (bufA[i] ?? 0) ^ (bufB[i] ?? 0);
  }
  return diff === 0;
}

export async function createSessionToken(user: string) {
  return new SignJWT({ user })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject('julia-stille')
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export async function verifySessionToken(token: string | undefined | null) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      subject: 'julia-stille',
    });
    return { user: String(payload.user ?? appUser()) };
  } catch {
    return null;
  }
}
