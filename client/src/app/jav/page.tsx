import type { Metadata } from 'next';
import { getJav } from '@/lib/api';
import { AnimeCard } from '@/components/AnimeCard';
import { NumberedPagination } from '@/components/NumberedPagination';

export const metadata: Metadata = { title: 'JAV' };

function pageHref(p: number) {
  return p <= 1 ? '/jav' : `/jav/page/${p}/`;
}

export default async function JavPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageStr } = await searchParams;
  const page = Number(pageStr) || 1;

  let javData;
  try {
    javData = await getJav(page);
  } catch {
    javData = null;
  }

  if (!javData?.success) {
    return (
      <div className="py-20 text-center container mx-auto px-4">
        <h2 className="text-xl font-bold text-destructive">Error Loading JAV</h2>
      </div>
    );
  }

  const { data, totalPages, hasNextPage, hasPrevPage, total } = javData;

  return (
    <div className="space-y-8 pb-12">
      <div className="relative overflow-hidden bg-muted/30 border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent pointer-events-none" />
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />
        <div className="container mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <span className="text-xs text-muted-foreground uppercase tracking-widest">Kumpulan</span>
            <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">JAV</h1>
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
            {totalPages > 1 && (
              <NumberedPagination
                page={page}
                totalPages={totalPages}
                hasPrevPage={hasPrevPage}
                hasNextPage={hasNextPage}
                hrefBuilder={pageHref}
              />
            )}
          </>
        ) : (
          <div className="py-20 text-center text-muted-foreground">Tidak ada item ditemukan.</div>
        )}
      </div>
    </div>
  );
}
