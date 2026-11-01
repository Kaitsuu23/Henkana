import type { Metadata } from 'next';
import { getTerbaru } from '@/lib/api';
import { AnimeCard } from '@/components/AnimeCard';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Baru Ditambahkan' };

function pageHref(p: number) {
  if (p <= 1) return '/terbaru';
  return `/terbaru/page/${p}/`;
}

export default async function TerbaruPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;

  let terbaruData;
  try {
    terbaruData = await getTerbaru(page);
  } catch {
    terbaruData = null;
  }

  if (!terbaruData?.success) {
    return (
      <div className="py-20 text-center container mx-auto px-4">
        <h2 className="text-xl font-bold text-destructive">Error Loading Terbaru</h2>
      </div>
    );
  }

  const { data, totalPages, hasNextPage, hasPrevPage, total } = terbaruData;

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden bg-muted/30 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Terbaru</span>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">Baru Ditambahkan</h1>
          </div>
          {total && (
            <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shrink-0">
              {total} titles
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 space-y-8">
        {data && data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.map((item: any, i: number) => (
                <AnimeCard key={i} {...item} />
              ))}
            </div>

            <TerbaruPagination
              page={page}
              totalPages={totalPages}
              hasPrevPage={hasPrevPage}
              hasNextPage={hasNextPage}
            />
          </>
        ) : (
          <div className="py-20 text-center text-muted-foreground">Tidak ada item ditemukan.</div>
        )}
      </div>
    </div>
  );
}

function TerbaruPagination({ page, totalPages, hasPrevPage, hasNextPage }: {
  page: number; totalPages?: number; hasPrevPage: boolean; hasNextPage: boolean;
}) {
  const showPrev = hasPrevPage;
  const showNext = hasNextPage;

  if (!showPrev && !showNext) return null;

  // If totalPages is available and >1, show numbered pages; otherwise prev/next only
  if (totalPages && totalPages > 1) {
    const pages = getPageRange(page, totalPages);
    return (
      <div className="flex items-center justify-center gap-1.5 pt-4">
        <PageArrow href={pageHref(page - 1)} isDisabled={!hasPrevPage} label="Previous">
          <ChevronLeft className="h-4 w-4" />
        </PageArrow>
        {pages.map((p, i) =>
          p === '…' ? (
            <span key={`e-${i}`} className="px-1.5 text-sm text-muted-foreground/50">…</span>
          ) : (
            <Link
              key={p}
              href={pageHref(p as number)}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                'flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
                p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >{p}</Link>
          )
        )}
        <PageArrow href={pageHref(page + 1)} isDisabled={!hasNextPage} label="Next">
          <ChevronRight className="h-4 w-4" />
        </PageArrow>
      </div>
    );
  }

  // Fallback: prev/next arrows only
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <PageArrow href={pageHref(page - 1)} isDisabled={!hasPrevPage} label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </PageArrow>
      <span className="px-3 text-sm text-muted-foreground">Halaman {page}</span>
      <PageArrow href={pageHref(page + 1)} isDisabled={!hasNextPage} label="Next">
        <ChevronRight className="h-4 w-4" />
      </PageArrow>
    </div>
  );
}

function PageArrow({ href, isDisabled, label, children }: {
  href: string; isDisabled: boolean; label: string; children: ReactNode;
}) {
  if (isDisabled) return <span className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/30">{children}</span>;
  return (
    <Link href={href} aria-label={label} className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
      {children}
    </Link>
  );
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
