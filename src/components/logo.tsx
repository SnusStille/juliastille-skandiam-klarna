import { cn } from '@/lib/utils';

/**
 * Stille-märket: ett hus reducerat till två linjer och en nyckelöppning.
 * Byggt med currentColor så det fungerar i både ljust och mörkt läge.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      aria-hidden="true"
      className={cn('h-8 w-8', className)}
    >
      <path
        d="M4 14.2 16 4.5l12 9.7"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6.8 16.4V27h18.4V16.4"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="19.4" r="2.5" stroke="currentColor" strokeWidth="1.9" />
      <path
        d="M16 21.9V27"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function Logo({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark className="h-7 w-7 shrink-0 text-brass" />
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[15px] font-semibold tracking-tight text-ink">
            Julia Stille
          </span>
          <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.16em] text-faint">
            Mäkleri
          </span>
        </span>
      )}
    </span>
  );
}
