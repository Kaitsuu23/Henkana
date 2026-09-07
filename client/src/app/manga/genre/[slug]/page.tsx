import type { Metadata } from 'next';
import { getMangaGenreSlug } from '@/lib/api';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Tag, AlertTriangle, SearchX } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { AnimeCard } from '@/components/AnimeCard';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { title: `${title} - Manga Genre` };
}

export default async function MangaGenreSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;

  let data;
  try {
    data = await getMangaGenreSlug(slug, page);
  } catch {
    data = null;
  }

  if (!data?.success) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-24">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive/70" />
          <h2 className="text-lg font-semibold">Couldn't load this genre</h2>
          <Link href="/manga" className={cn(buttonVariants({ variant: 'outline', size: 'sm' }), 'mt-2')}>
            <ChevronLeft className="mr-1.5 h-3.5 w-3.5" /> Back to Manga
          </Link>
        </div>
      </div>
    );
  }

  const { data: items, totalPages, hasNextPage, hasPrevPage, genre, total } = data;
  const titleFormatted = slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  return (
    <div className="space-y-8 pb-12">
      {/* Header banner */}
      <div className="relative overflow-hidden bg-muted/30 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />

        <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-2">
            <Link
              href="/manga"
              className="inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border/50 transition-colors"
            >
              <ChevronLeft className="h-3 w-3" /> Back to Manga
            </Link>
            <div className="flex items-center gap-2">
              <Tag className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Manga Genre</span>
            </div>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">{genre || titleFormatted}</h1>
          </div>

          <span className="inline-flex w-fit items-center rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm font-medium text-muted-foreground shrink-0">
            {total} titles
          </span>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 space-y-8">
        {items && items.length > 0 ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {items.map((item: any, i: number) => (
                <AnimeCard
                  key={i}
                  title={item.title}
                  thumbnail={item.thumbnail}
                  url={item.url}
                  postId={item.postId}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <MangaGenrePagination
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
            <SearchX className="h-6 w-6 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Tidak ada manga ditemukan untuk genre ini.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function MangaGenrePagination({ slug, page, totalPages, hasPrevPage, hasNextPage }: {
  slug: string; page: number; totalPages: number; hasPrevPage: boolean; hasNextPage: boolean;
}) {
  const pages = getPageRange(page, totalPages);
  return (
    <div className="flex items-center justify-center gap-1.5 pt-4">
      <PageArrow href={page - 1 === 1 ? `/manga/genre/${slug}` : `/manga/genre/${slug}/page/${page - 1}/`} isDisabled={!hasPrevPage} label="Previous">
        <ChevronLeft className="h-4 w-4" />
      </PageArrow>
      {pages.map((p, i) =>
        p === '…' ? (
          <span key={`e-${i}`} className="px-1.5 text-sm text-muted-foreground/50">…</span>
        ) : (
          <Link
            key={p}
            href={p === 1 ? `/manga/genre/${slug}` : `/manga/genre/${slug}/page/${p}/`}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'flex h-9 min-w-9 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
              p === page ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >{p}</Link>
        )
      )}
      <PageArrow href={`/manga/genre/${slug}/page/${page + 1}/`} isDisabled={!hasNextPage} label="Next">
        <ChevronRight className="h-4 w-4" />
      </PageArrow>
    </div>
  );
}

function PageArrow({ href, isDisabled, label, children }: { href: string; isDisabled: boolean; label: string; children: ReactNode }) {
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
