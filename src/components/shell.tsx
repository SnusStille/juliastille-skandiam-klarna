'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileText,
  Gavel,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  Users,
  X,
} from 'lucide-react';
import { Logo, LogoMark } from '@/components/logo';
import { ThemeToggle } from '@/components/theme';
import { cn, initials } from '@/lib/utils';
import type { Contact, Property } from '@/lib/types';

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const NAV: NavItem[] = [
  { href: '/', label: 'Översikt', icon: LayoutDashboard },
  { href: '/objekt', label: 'Objekt', icon: Building2 },
  { href: '/kunder', label: 'Kunder', icon: Users },
  { href: '/visningar', label: 'Visningar', icon: CalendarDays },
  { href: '/budgivning', label: 'Budgivning', icon: Gavel },
  { href: '/uppgifter', label: 'Uppgifter', icon: ListChecks },
  { href: '/dokument', label: 'Dokument', icon: FileText },
  { href: '/mallar', label: 'Mallar', icon: FileText },
  { href: '/statistik', label: 'Statistik', icon: BarChart3 },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

/* ==========================================================================
   Sidomeny
   ========================================================================== */

function SidebarContent({
  pathname,
  userName,
  agency,
  onNavigate,
  onOpenSearch,
}: {
  pathname: string;
  userName: string;
  agency: string;
  onNavigate?: () => void;
  onOpenSearch: () => void;
}) {
  const router = useRouter();

  const logout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/logga-in');
    router.refresh();
  }, [router]);

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center justify-between px-5">
        <Link href="/" onClick={onNavigate} className="rounded-md">
          <Logo />
        </Link>
        {onNavigate && (
          <button
            type="button"
            onClick={onNavigate}
            aria-label="Stäng meny"
            className="rounded-md p-1.5 text-faint transition hover:bg-raised hover:text-ink lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <div className="px-3.5 pb-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="flex w-full items-center gap-2.5 rounded-md border border-line bg-canvas px-3 py-2 text-sm text-faint transition hover:border-brass/40 hover:text-muted"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1 text-left">Sök…</span>
          <kbd className="hidden rounded border border-line bg-surface px-1.5 py-0.5 font-mono text-[10px] text-faint sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3.5 pb-4">
        <p className="px-2.5 pb-2 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Arbetsyta
        </p>
        {NAV.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition',
                active
                  ? 'bg-raised text-ink'
                  : 'text-muted hover:bg-raised/60 hover:text-ink',
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4.5 w-[3px] -translate-y-1/2 rounded-r-full bg-brass" />
              )}
              <item.icon
                className={cn(
                  'h-[17px] w-[17px] shrink-0 transition',
                  active ? 'text-brass' : 'text-faint group-hover:text-muted',
                )}
              />
              {item.label}
            </Link>
          );
        })}

        <p className="px-2.5 pb-2 pt-5 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
          Intelligens
        </p>
        <Link
          href="/assistent"
          onClick={onNavigate}
          aria-current={isActive(pathname, '/assistent') ? 'page' : undefined}
          className={cn(
            'group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition',
            isActive(pathname, '/assistent')
              ? 'bg-brass/12 text-brass'
              : 'text-muted hover:bg-raised/60 hover:text-ink',
          )}
        >
          <Sparkles
            className={cn(
              'h-[17px] w-[17px] shrink-0',
              isActive(pathname, '/assistent') ? 'text-brass' : 'text-faint',
            )}
          />
          Stille AI
        </Link>
      </nav>

      <div className="border-t border-line p-3.5">
        <Link
          href="/installningar"
          onClick={onNavigate}
          className={cn(
            'flex items-center gap-3 rounded-md p-2 transition hover:bg-raised',
            isActive(pathname, '/installningar') && 'bg-raised',
          )}
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brass/15 font-display text-[13px] font-semibold text-brass">
            {initials(userName)}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-medium text-ink">
              {userName}
            </span>
            <span className="block truncate text-xs text-faint">{agency}</span>
          </span>
          <Settings className="h-4 w-4 shrink-0 text-faint" />
        </Link>

        <div className="mt-2.5 flex items-center gap-2">
          <ThemeToggle className="inline-flex h-8 flex-1 items-center justify-center gap-2 rounded-md border border-line bg-surface text-xs font-medium text-muted transition hover:bg-raised hover:text-ink" />
          <button
            type="button"
            onClick={logout}
            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-md border border-line bg-surface text-xs font-medium text-muted transition hover:border-clay/30 hover:bg-clay/8 hover:text-clay"
          >
            <LogOut className="h-3.5 w-3.5" />
            Logga ut
          </button>
        </div>

        <p className="mt-3 text-center text-[10px] tracking-wide text-faint">
          Developed by Stilledev
        </p>
      </div>
    </div>
  );
}

/* ==========================================================================
   Kommandopalett
   ========================================================================== */

function CommandPalette({
  open,
  onClose,
  properties,
  contacts,
}: {
  open: boolean;
  onClose: () => void;
  properties: Property[];
  contacts: Contact[];
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const pages = NAV.concat([
      { href: '/assistent', label: 'Stille AI', icon: Sparkles },
      { href: '/installningar', label: 'Inställningar', icon: Settings },
    ]).filter((p) => !q || p.label.toLowerCase().includes(q));

    const props = q
      ? properties
          .filter(
            (p) =>
              p.title.toLowerCase().includes(q) ||
              p.address.toLowerCase().includes(q) ||
              p.city.toLowerCase().includes(q) ||
              p.district.toLowerCase().includes(q),
          )
          .slice(0, 6)
      : properties.slice(0, 4);

    const people = q
      ? contacts
          .filter(
            (c) =>
              c.name.toLowerCase().includes(q) ||
              c.email.toLowerCase().includes(q) ||
              c.phone.includes(q),
          )
          .slice(0, 6)
      : [];

    return { pages: pages.slice(0, 6), props, people };
  }, [query, properties, contacts]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  // Platt lista i samma ordning som den visas — används för piltangenter.
  const flat = useMemo(
    () =>
      results.props
        .map((p) => `/objekt/${p.id}`)
        .concat(results.people.map((c) => `/kunder?fokus=${c.id}`))
        .concat(results.pages.map((p) => p.href)),
    [results],
  );

  const [active, setActive] = useState(0);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (flat.length === 0) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActive((i) => (i + 1) % flat.length);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => (i - 1 + flat.length) % flat.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(flat[Math.min(active, flat.length - 1)]);
    }
  };

  const rowClass = (index: number) =>
    cn(
      'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition',
      index === active ? 'bg-raised' : 'hover:bg-raised',
    );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[95] flex items-start justify-center pt-[12vh]">
      <div
        className="absolute inset-0 bg-ink/35 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sök"
        className="relative z-10 w-[min(620px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-line bg-surface shadow-pop animate-scale-in"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search className="h-4 w-4 shrink-0 text-faint" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Sök objekt, kunder eller sidor…"
            className="w-full bg-transparent py-4 text-[15px] outline-none placeholder:text-faint"
          />
          <kbd className="rounded border border-line bg-canvas px-1.5 py-0.5 font-mono text-[10px] text-faint">
            esc
          </kbd>
        </div>

        <div className="max-h-[52vh] overflow-y-auto p-2">
          {results.pages.length === 0 &&
            results.props.length === 0 &&
            results.people.length === 0 && (
              <p className="px-3 py-8 text-center text-sm text-faint">
                Inga träffar på ”{query}”.
              </p>
            )}

          {results.props.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Objekt
              </p>
              {results.props.map((p, i) => (
                <button
                  key={p.id}
                  onClick={() => go(`/objekt/${p.id}`)}
                  onMouseEnter={() => setActive(i)}
                  className={rowClass(i)}
                >
                  <Building2 className="h-4 w-4 shrink-0 text-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {p.address}
                    </span>
                    <span className="block truncate text-xs text-faint">
                      {p.district}, {p.city}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {results.people.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Kunder
              </p>
              {results.people.map((c, i) => (
                <button
                  key={c.id}
                  onClick={() => go(`/kunder?fokus=${c.id}`)}
                  onMouseEnter={() => setActive(results.props.length + i)}
                  className={rowClass(results.props.length + i)}
                >
                  <Users className="h-4 w-4 shrink-0 text-faint" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm text-ink">
                      {c.name}
                    </span>
                    <span className="block truncate text-xs text-faint">
                      {c.email || c.phone}
                    </span>
                  </span>
                </button>
              ))}
            </>
          )}

          {results.pages.length > 0 && (
            <>
              <p className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Gå till
              </p>
              {results.pages.map((p, i) => (
                <button
                  key={p.href}
                  onClick={() => go(p.href)}
                  onMouseEnter={() =>
                    setActive(results.props.length + results.people.length + i)
                  }
                  className={rowClass(
                    results.props.length + results.people.length + i,
                  )}
                >
                  <p.icon className="h-4 w-4 shrink-0 text-faint" />
                  <span className="text-sm text-ink">{p.label}</span>
                </button>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   Skalet
   ========================================================================== */

export function Shell({
  children,
  userName,
  agency,
  properties,
  contacts,
}: {
  children: React.ReactNode;
  userName: string;
  agency: string;
  properties: Property[];
  contacts: Contact[];
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
      if (e.key === 'Escape') setSearchOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-[100dvh] bg-canvas">
      {/* Fast sidomeny */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] border-r border-line bg-surface lg:block">
        <SidebarContent
          pathname={pathname}
          userName={userName}
          agency={agency}
          onOpenSearch={() => setSearchOpen(true)}
        />
      </aside>

      {/* Mobil sidomeny */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40 animate-fade-in"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="relative h-full w-[268px] border-r border-line bg-surface shadow-pop animate-fade-in">
            <SidebarContent
              pathname={pathname}
              userName={userName}
              agency={agency}
              onNavigate={() => setMobileOpen(false)}
              onOpenSearch={() => {
                setMobileOpen(false);
                setSearchOpen(true);
              }}
            />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-[248px]">
        {/* Mobil topbar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-surface/85 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Öppna meny"
            className="rounded-md p-2 text-muted transition hover:bg-raised hover:text-ink"
          >
            <Menu className="h-5 w-5" />
          </button>
          <LogoMark className="h-6 w-6 text-brass" />
          <span className="flex-1 font-display text-[15px] font-semibold text-ink">
            Julia Stille
          </span>
          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Sök"
            className="rounded-md p-2 text-muted transition hover:bg-raised hover:text-ink"
          >
            <Search className="h-4.5 w-4.5" />
          </button>
          <ThemeToggle className="rounded-md p-2 text-muted transition hover:bg-raised hover:text-ink" />
        </header>

        <main className="min-w-0 flex-1">{children}</main>
      </div>

      <CommandPalette
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        properties={properties}
        contacts={contacts}
      />
    </div>
  );
}

/* ==========================================================================
   Sidhuvud som varje sida använder
   ========================================================================== */

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="mt-2 font-display text-[26px] font-medium leading-tight tracking-tight text-ink sm:text-[30px]">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
}

export function Page({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1240px] px-5 py-7 sm:px-7 sm:py-9 lg:px-10">
      {children}
    </div>
  );
}
