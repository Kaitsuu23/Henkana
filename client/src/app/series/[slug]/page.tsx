import type { Metadata } from 'next';
import { getDetail } from '@/lib/api';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await getDetail(`https://hentaicop.com/series/${slug}/`);
    if (data?.success && data.data?.title) {
      return { title: data.data.title };
    }
  } catch {}
  const fallback = slug
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
  return { title: fallback };
}
import { Badge } from '@/components/ui/badge';
import { buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { Play, CalendarDays, Clapperboard, User } from 'lucide-react';
import { ExpandableText } from '@/components/ExpandableText';
import { AnimeCard } from '@/components/AnimeCard';

export default async function SeriesDetail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const url = `https://hentaicop.com/series/${slug}/`;

  let detailData;
  try {
    detailData = await getDetail(url);
  } catch {
    detailData = null;
  }

  if (!detailData?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <h2 className="text-2xl font-bold text-destructive">Series Not Found</h2>
        <p className="text-muted-foreground mt-2">Could not fetch series details.</p>
        <Link href="/" className={buttonVariants({ variant: 'outline', className: 'mt-6' })}>
          Back to Home
        </Link>
      </div>
    );
  }

  const { data } = detailData;

  // Episode list — urutkan dari ep 1 ke ep terbaru
  const episodes: any[] = [...(data.episodes?.list || [])].reverse();
  const firstEp = episodes[0] || null;

  function getWatchLink(epUrl: string) {
    try {
      const u = new URL(epUrl, 'https://hentaicop.com');
      return `/watch/${u.pathname.replace(/^\/|\/$/g, '')}`;
    } catch {
      return '#';
    }
  }

  return (
    <div className="min-h-screen">
      {/* ── Hero Banner ─────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden">
        {/* Background blur */}
        <div
          className="absolute inset-0 bg-cover bg-center scale-110"
          style={{ backgroundImage: `url(${data.thumbnail})`, filter: 'blur(40px) brightness(0.3)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />

        <div className="relative container mx-auto px-4 py-16 flex flex-col md:flex-row gap-8 items-start max-w-6xl">
          {/* Poster — no border radius */}
          <div className="w-44 md:w-56 shrink-0 mx-auto md:mx-0 overflow-hidden shadow-2xl shadow-black/60">
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight">
              {data.title}
            </h1>

            {/* Alt titles */}
            {data.alternativeTitles?.length > 0 && (
              <p className="text-xs text-muted-foreground tracking-wide">
                {data.alternativeTitles.join(' · ')}
              </p>
            )}

            {/* Badges row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {data.status && (
                <Badge className="bg-primary text-primary-foreground">{data.status}</Badge>
              )}
              {data.type && <Badge variant="secondary">{data.type}</Badge>}
              {data.censor && <Badge variant="outline">{data.censor}</Badge>}
            </div>

            {/* Meta row */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground">
              {data.released && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  {data.released}
                </span>
              )}
              {data.episodes?.total > 0 && (
                <span className="flex items-center gap-1.5">
                  <Clapperboard className="h-3.5 w-3.5" />
                  {data.episodes.total} Episode{data.episodes.total > 1 ? 's' : ''}
                </span>
              )}
              {data.studios?.length > 0 && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {data.studios.map((s: any) => s.name).join(', ')}
                </span>
              )}
            </div>

            {/* Genres */}
            {data.genres?.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                {data.genres.map((g: any) => (
                  <Link
                    key={g.name}
                    href={`/genre/${g.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xs px-2.5 py-0.5 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Description */}
            {data.description && (
              <ExpandableText text={data.description} clampLines={4} />
            )}

            {/* Watch button */}
            {firstEp && (
              <div className="pt-2">
                <Link
                  href={getWatchLink(firstEp.url)}
                  className={buttonVariants({ size: 'lg', className: 'px-8 gap-2' })}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Tonton Episode 1
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-10 max-w-6xl grid grid-cols-1 md:grid-cols-3 gap-8">

        {/* Episode List */}
        <div className="md:col-span-2 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary" />
            Episode ({data.episodes?.total || 0})
          </h2>

          <div className="flex flex-col gap-2">
            {episodes.map((ep: any, i: number) => {
              const watchLink = getWatchLink(ep.url);
              return (
                <Link
                  key={i}
                  href={watchLink}
                  className="flex items-center justify-between px-4 py-3 bg-muted/40 hover:bg-primary/10 hover:border-primary border border-transparent transition-colors group"
                >
                  <span className="text-sm font-medium group-hover:text-primary transition-colors">
                    {ep.title}
                  </span>
                  <div className="flex items-center gap-2 shrink-0">
                    {ep.sub && (
                      <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 font-medium">
                        {ep.sub}
                      </span>
                    )}
                    {ep.date && (
                      <span className="text-[11px] text-muted-foreground hidden sm:block">
                        {ep.date}
                      </span>
                    )}
                    <Play className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Detail Info */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary" />
            Informasi
          </h2>

          <div className="flex flex-col gap-3 text-sm">
            {/* Judul Alternatif — full width */}
            {data.alternativeTitles?.length > 0 && (
              <div className="col-span-2">
                <p className="text-muted-foreground text-xs mb-1">Judul Alternatif</p>
                <p className="font-medium">{data.alternativeTitles.join(', ')}</p>
              </div>
            )}

            {/* 2 kolom grid */}
            <div className="grid grid-cols-2 gap-3">
              {data.type && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Tipe</p>
                  <p className="font-medium">{data.type}</p>
                </div>
              )}
              {data.released && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Tahun Rilis</p>
                  <p className="font-medium">{data.released}</p>
                </div>
              )}
              {data.status && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Status</p>
                  <p className="font-medium">{data.status}</p>
                </div>
              )}
              {data.censor && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Sensor</p>
                  <p className="font-medium">{data.censor}</p>
                </div>
              )}
              {data.studios?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Studio</p>
                  <div className="flex flex-col gap-1">
                    {data.studios.map((s: any) => (
                      <Link
                        key={s.name}
                        href={`/studio/${s.url?.split('/studio/')[1]?.replace('/', '') || ''}`}
                        className="font-medium hover:text-primary transition-colors"
                      >
                        {s.name}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
              {data.director?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Director</p>
                  <p className="font-medium">{data.director.map((d: any) => d.name).join(', ')}</p>
                </div>
              )}
              {data.casts?.length > 0 && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Cast</p>
                  <p className="font-medium">{data.casts.map((c: any) => c.name).join(', ')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Rekomendasi ──────────────────────────────────────────── */}
      {data.related?.length > 0 && (
        <div className="container mx-auto px-4 pb-12 max-w-6xl space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary" />
            Rekomendasi
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {data.related.map((item: any, i: number) => (
              <AnimeCard key={i} {...item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
