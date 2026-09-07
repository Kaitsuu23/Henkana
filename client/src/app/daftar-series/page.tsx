import type { Metadata } from 'next';
import { getSeries, getSeriesFilters } from '@/lib/api';

export const metadata: Metadata = { title: 'Daftar Series' };
import { AnimeCard } from '@/components/AnimeCard';
import { SeriesFilterBar } from '@/components/SeriesFilterBar';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, List } from 'lucide-react';
import { Suspense } from 'react';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const revalidate = 300;

export default async function DaftarSeriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[]>>;
}) {
  const sp = await searchParams;

  const page    = Number(sp.page)   || 1;
  const status  = (sp.status  as string) || '';
  const order   = (sp.order   as string) || '';
  const type    = (sp.type    as string) || '';
  const sub     = (sp.sub     as string) || '';

  const genres  = sp['genre[]']  ? (Array.isArray(sp['genre[]'])  ? sp['genre[]']  : [sp['genre[]']  as string]) : [];
  const studios = sp['studio[]'] ? (Array.isArray(sp['studio[]']) ? sp['studio[]'] : [sp['studio[]'] as string]) : [];
  const seasons = sp['season[]'] ? (Array.isArray(sp['season[]']) ? sp['season[]'] : [sp['season[]'] as string]) : [];

  const [seriesRes, filtersRes] = await Promise.all([
    getSeries({
      page,
      ...(status  && { status }),
      ...(order   && { order }),
      ...(type    && { type }),
      ...(sub     && { sub }),
      ...(genres.length  && { 'genre[]':  genres }),
      ...(studios.length && { 'studio[]': studios }),
      ...(seasons.length && { 'season[]': seasons }),
    }).catch(() => null),
    getSeriesFilters().catch(() => null),
  ]);

  const { data = [], hasNextPage = false, hasPrevPage = false } = seriesRes || {};
  const filters = filtersRes?.data || { genres: [], seasons: [], studios: [], statuses: [], types: [], orders: [] };

  // Build pagination URL — preserve semua filter params
  function buildPageUrl(targetPage: number) {
    const p = new URLSearchParams();
    if (targetPage > 1) p.set('page', String(targetPage));
    if (status)  p.set('status', status);
    if (order)   p.set('order',  order);
    if (type)    p.set('type',   type);
    if (sub)     p.set('sub',    sub);
    genres.forEach(v  => p.append('genre[]',  v));
    studios.forEach(v => p.append('studio[]', v));
    seasons.forEach(v => p.append('season[]', v));
    const qs = p.toString();
    return `/daftar-series${qs ? '?' + qs : ''}`;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold">Daftar Series</h1>
        </div>
        <Link
          href="/daftar-series/list"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <List className="h-4 w-4 mr-2" />
          Modus Teks
        </Link>
      </div>

      {/* Filter bar — client component, Suspense karena pakai useSearchParams */}
      <Suspense fallback={<div className="h-24 bg-muted/20 border border-border/40 animate-pulse" />}>
        <SeriesFilterBar filters={filters} />
      </Suspense>

      {/* Grid */}
      {data.length > 0 ? (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {data.map((item: any, i: number) => (
              <AnimeCard key={i} {...item} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {hasPrevPage ? (
              <Link href={buildPageUrl(page - 1)} className={buttonVariants({ variant: 'outline' })}>
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Link>
            ) : (
              <Button variant="outline" disabled>
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </Button>
            )}

            <span className="text-sm font-medium text-muted-foreground">Halaman {page}</span>

            {hasNextPage ? (
              <Link href={buildPageUrl(page + 1)} className={buttonVariants({ variant: 'outline' })}>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            ) : (
              <Button variant="outline" disabled>
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        </>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          Tidak ada series ditemukan.
        </div>
      )}
    </div>
  );
}
