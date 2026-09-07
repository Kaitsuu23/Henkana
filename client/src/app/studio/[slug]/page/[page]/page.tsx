import type { Metadata } from 'next';
import { getStudioSlug } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { title: `${title} - Studio` };
}
import { AnimeCard } from '@/components/AnimeCard';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, AlertTriangle, SearchX } from 'lucide-react';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export default async function StudioSlugPageN({
  params,
}: {
  params: Promise<{ slug: string; page: string }>;
}) {
  const { slug, page: pageStr } = await params;
  const page = Number(pageStr) || 1;

  let studioData;
  try {
    studioData = await getStudioSlug(slug, page);
  } catch (e) {
    studioData = null;
  }

  if (!studioData || !studioData.success) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-24">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive/70" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">Couldn't load this studio</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Something went wrong fetching this page. Try refreshing, or head back to the studio list.
          </p>
          <Link href="/studio" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2')}>
            <ChevronLeft className="mr-1.5 h-3.5 w-3.5" />
            All studios
          </Link>
        </div>
      </div>
    );
  }

  const { data, totalPages, hasNextPage, hasPrevPage, total } = studioData;

  const titleFormatted = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  const resultCount = total ?? data.length;

  return (
    <div className="space-y-8 pb-12">
      {/* Header banner */}
      <div className="relative overflow-hidden bg-muted/30 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

        <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/studio"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border/50 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" />
              All studios
            </Link>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Studio</span>
            </div>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight text-foreground">
              {titleFormatted}
            </h1>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shrink-0">
            {resultCount} {resultCount === 1 ? 'title' : 'titles'}
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 space-y-8">
        {data && data.length > 0 ? (
          <>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {data.map((item: any, i: number) => (
                <AnimeCard key={i} {...item} />
              ))}
            </div>

            {totalPages > 1 && (
              <StudioPagination
                slug={slug}
                page={page}
                totalPages={totalPages}
                hasPrevPage={hasPrevPage}
                hasNextPage={hasNextPage}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-20 text-center">
            <SearchX className="h-6 w-6 text-muted-foreground/50" aria-hidden />
            <p className="text-sm text-muted-foreground">No series found from this studio.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function StudioPagination({
  slug,
  page,
  totalPages,
  hasPrevPage,
  hasNextPage,
}: {
  slug: string;
  page: number;
  totalPages: number;
  hasPrevPage: boolean;
  hasNextPage: boolean;
}) {
  const pages = getPageRange(page, totalPages);

  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <PageArrow
        href={page - 1 === 1 ? `/studio/${slug}` : `/studio/${slug}/page/${page - 1}/`}
        disabled={!hasPrevPage}
        label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </PageArrow>

      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`ellipsis-${i}`} className="px-1.5 text-sm text-muted-foreground/50">
            …
          </span>
        ) : (
          <Link
            key={p}
            href={p === 1 ? `/studio/${slug}` : `/studio/${slug}/page/${p}/`}
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

      <PageArrow href={`/studio/${slug}/page/${page + 1}/`} disabled={!hasNextPage} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </PageArrow>
    </div>
  );
}

function PageArrow({
  href,
  disabled,
  label,
  children,
}: {
  href: string;
  disabled: boolean;
  label: string;
  children: ReactNode;
}) {
  if (disabled) {
    return (
      <span className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground/30">
        {children}
      </span>
    );
  }
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

function getPageRange(current: number, total: number): (number | '…')[] {
  const delta = 1;
  const range: (number | '…')[] = [];
  const left = Math.max(2, current - delta);
  const right = Math.min(total - 1, current + delta);

  range.push(1);
  if (left > 2) range.push('…');
  for (let i = left; i <= right; i++) range.push(i);
  if (right < total - 1) range.push('…');
  if (total > 1) range.push(total);

  return range;
}
