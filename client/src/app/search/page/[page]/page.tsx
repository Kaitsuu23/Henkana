import type { Metadata } from 'next';
import { getSearch } from '@/lib/api';
import { AnimeCard } from '@/components/AnimeCard';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Search, SearchX } from 'lucide-react';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}): Promise<Metadata> {
  const { q = '' } = await searchParams;
  return { title: q ? `Search: "${q}"` : 'Search' };
}

export default async function SearchPageN({
  params,
  searchParams,
}: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const { page: pageStr } = await params;
  const { q: query = '' } = await searchParams;
  const page = Number(pageStr) || 1;

  if (!query) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-32 text-center">
        <Search className="mx-auto h-10 w-10 text-muted-foreground/30 mb-4" />
        <h2 className="text-xl font-semibold">Cari anime atau manga</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Ketik judul, genre, atau keyword di search bar di atas.
        </p>
      </div>
    );
  }

  let searchData;
  try {
    searchData = await getSearch(query, page);
  } catch {
    searchData = null;
  }

  if (!searchData?.success) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-32 text-center">
        <SearchX className="mx-auto h-8 w-8 text-destructive/60 mb-4" />
        <h2 className="text-lg font-semibold">Gagal memuat hasil pencarian</h2>
      </div>
    );
  }

  const { data, totalPages, hasNextPage, hasPrevPage, total } = searchData;
  const q = encodeURIComponent(query);

  function pageHref(p: number) {
    if (p <= 1) return `/search?q=${q}`;
    return `/search/page/${p}/?q=${q}`;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Header */}
      <div className="relative overflow-hidden bg-muted/30 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Search className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Hasil Pencarian</span>
            </div>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">&ldquo;{query}&rdquo;</h1>
          </div>
          <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shrink-0">
            {total} hasil
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
              <div className="flex items-center justify-center gap-1.5 pt-4">
                <PageArrow href={pageHref(page - 1)} isDisabled={!hasPrevPage} label="Sebelumnya">
                  <ChevronLeft className="h-4 w-4" />
                </PageArrow>
                {getPageRange(page, totalPages).map((p, i) =>
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
                <PageArrow href={pageHref(page + 1)} isDisabled={!hasNextPage} label="Berikutnya">
                  <ChevronRight className="h-4 w-4" />
                </PageArrow>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-24 text-center">
            <SearchX className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Tidak ada hasil untuk &ldquo;{query}&rdquo;.</p>
          </div>
        )}
      </div>
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
