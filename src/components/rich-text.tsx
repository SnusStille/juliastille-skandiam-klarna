import { Fragment, type ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Lätt markdown-rendering för AI-svar.
 * Stöder rubriker, punktlistor, numrerade listor, fetstil, kursiv och kod.
 * Ingen HTML tolkas — allt renderas som text, så inget kan injiceras.
 */

function inline(text: string, keyPrefix: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const pattern = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\n]+\*)/g;
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) parts.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-i${i++}`;

    if (token.startsWith('**')) {
      parts.push(
        <strong key={key} className="font-semibold">
          {token.slice(2, -2)}
        </strong>,
      );
    } else if (token.startsWith('`')) {
      parts.push(
        <code
          key={key}
          className="rounded bg-raised px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>,
      );
    } else {
      parts.push(
        <em key={key} className="italic">
          {token.slice(1, -1)}
        </em>,
      );
    }
    last = match.index + token.length;
  }

  if (last < text.length) parts.push(text.slice(last));
  return parts.length ? parts : [text];
}

export function RichText({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  const lines = content.split('\n');
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = (key: string) => {
    if (!list) return;
    const { ordered, items } = list;
    const Tag = ordered ? 'ol' : 'ul';
    blocks.push(
      <Tag
        key={key}
        className={cn(
          'my-1.5 space-y-1 pl-5',
          ordered ? 'list-decimal' : 'list-disc',
        )}
      >
        {items.map((item, idx) => (
          <li key={`${key}-${idx}`}>{inline(item, `${key}-${idx}`)}</li>
        ))}
      </Tag>,
    );
    list = null;
  };

  lines.forEach((raw, index) => {
    const line = raw.trimEnd();
    const key = `b${index}`;

    const bullet = /^\s*[-*•]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^(#{1,4})\s+(.*)$/.exec(line);

    if (bullet) {
      if (list && list.ordered) flush(`${key}-f`);
      list = list ?? { ordered: false, items: [] };
      list.items.push(bullet[1]);
      return;
    }
    if (numbered) {
      if (list && !list.ordered) flush(`${key}-f`);
      list = list ?? { ordered: true, items: [] };
      list.items.push(numbered[1]);
      return;
    }

    flush(`${key}-f`);

    if (!line.trim()) {
      blocks.push(<div key={key} className="h-2.5" aria-hidden />);
      return;
    }

    if (heading) {
      blocks.push(
        <p
          key={key}
          className="mt-2 font-display text-[15px] font-semibold text-ink first:mt-0"
        >
          {inline(heading[2], key)}
        </p>,
      );
      return;
    }

    blocks.push(<p key={key}>{inline(line, key)}</p>);
  });

  flush('tail');

  return (
    <div className={cn('space-y-0.5', className)}>
      {blocks.map((block, idx) => (
        <Fragment key={idx}>{block}</Fragment>
      ))}
    </div>
  );
}
