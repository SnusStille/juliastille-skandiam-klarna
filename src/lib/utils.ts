import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/* ---------- Formatering ---------- */

export function formatSEK(value: number | null | undefined, compact = false) {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  if (compact) {
    if (Math.abs(value) >= 1_000_000)
      return `${(value / 1_000_000).toLocaleString('sv-SE', {
        maximumFractionDigits: 1,
      })} mkr`;
    if (Math.abs(value) >= 1000)
      return `${Math.round(value / 1000).toLocaleString('sv-SE')} tkr`;
  }
  return `${Math.round(value).toLocaleString('sv-SE')} kr`;
}

export function formatNumber(value: number, decimals = 0) {
  return value.toLocaleString('sv-SE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatArea(value: number) {
  return `${formatNumber(value)} m²`;
}

const MONTHS = [
  'jan',
  'feb',
  'mar',
  'apr',
  'maj',
  'jun',
  'jul',
  'aug',
  'sep',
  'okt',
  'nov',
  'dec',
];

export function formatDate(input: string | Date | null | undefined) {
  if (!input) return '–';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '–';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDateTime(input: string | Date | null | undefined) {
  if (!input) return '–';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '–';
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${String(d.getHours()).padStart(
    2,
    '0',
  )}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatTime(input: string | Date | null | undefined) {
  if (!input) return '–';
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return '–';
  return `${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes(),
  ).padStart(2, '0')}`;
}

export function relativeTime(input: string | Date | null | undefined) {
  if (!input) return '–';
  const d = new Date(input).getTime();
  if (Number.isNaN(d)) return '–';
  const diff = d - Date.now();
  const abs = Math.abs(diff);
  const min = 60_000;
  const hour = 60 * min;
  const day = 24 * hour;

  const fmt = (n: number, unit: string) =>
    diff < 0 ? `för ${n} ${unit} sedan` : `om ${n} ${unit}`;

  if (abs < min) return 'nyss';
  if (abs < hour) return fmt(Math.round(abs / min), 'min');
  if (abs < day) return fmt(Math.round(abs / hour), 'tim');
  if (abs < 30 * day) return fmt(Math.round(abs / day), 'dgr');
  return formatDate(input);
}

export function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function toInputDateTime(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours(),
  )}:${pad(d.getMinutes())}`;
}

export function toInputDate(value: string | null | undefined) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

export function slugify(input: string) {
  return input
    .toLowerCase()
    .replace(/[åä]/g, 'a')
    .replace(/ö/g, 'o')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function uid(prefix = '') {
  const rnd =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  return prefix ? `${prefix}-${rnd}` : rnd;
}

export function formatBytes(bytes: number) {
  if (!bytes) return '0 B';
  const units = ['B', 'kB', 'MB', 'GB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / Math.pow(1024, i)).toLocaleString('sv-SE', {
    maximumFractionDigits: 1,
  })} ${units[i]}`;
}

export function pricePerSqm(price: number, area: number) {
  if (!area) return 0;
  return Math.round(price / area);
}
