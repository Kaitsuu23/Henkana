import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface NumberedPaginationProps {
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
  hrefBuilder: (p: number) => string;
}

function getPageRange(current: number, total: number): (number | '…')[] {
  const delta = 1;
  const range: (number | '…')[] = [];
  const left  = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);
  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);
  return range;
}

function PageArrow({ href, isDisabled, label, children }: {
  href: string; isDisabled: boolean; label: string; children: ReactNode;
}) {
  if (isDisabled) return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/30">
      {children}
    </span>
  );
  return (
    <Link
      href={href}
      aria-label={label}
      className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </Link>
  );
}

export function NumberedPagination({
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
  hrefBuilder,
}: NumberedPaginationProps) {
  const pages = getPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <PageArrow href={hrefBuilder(page - 1)} isDisabled={!hasPrevPage} label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </PageArrow>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-1.5 text-sm text-muted-foreground/50">…</span>
        ) : (
          <Link
            key={p}
            href={hrefBuilder(p as number)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
              p === page
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {p}
          </Link>
        )
      )}

      <PageArrow href={hrefBuilder(page + 1)} isDisabled={!hasNextPage} label="Next">
        <ChevronRight className="h-4 w-4" />
      </PageArrow>
    </div>
  );
}
