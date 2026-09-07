import type { Metadata } from 'next';
import { getMangaDetail } from '@/lib/api';
import { ExpandableText } from '@/components/ExpandableText';
import { ChapterList } from '@/components/ChapterList';
import { RelatedManga } from '@/components/RelatedManga';
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { BookOpen, Star, User } from 'lucide-react';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export const revalidate = 3600;

// ─────────────────────────────────────────────────────────────
// Metadata
// ─────────────────────────────────────────────────────────────
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const res = await getMangaDetail(`https://hentaicop.com/manga/${slug}/`);
    if (res?.success && res.data?.title) return { title: res.data.title };
  } catch {}
  return {
    title: slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
  };
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const FLAG_MAP: Record<string, string> = {
  '🇰🇷': 'kr', '🇯🇵': 'jp', '🇨🇳': 'cn', '🇺🇸': 'us',
};

function parseType(type: string) {
  for (const [emoji, code] of Object.entries(FLAG_MAP)) {
    if (type.startsWith(emoji)) return { flagCode: code, label: type.replace(emoji, '').trim() };
  }
  return { flagCode: null, label: type };
}

// ─────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────
export default async function MangaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const url = `https://hentaicop.com/manga/${slug}/`;

  const detailData = await getMangaDetail(url).catch(() => null);

  if (!detailData?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <h2 className="text-2xl font-bold text-destructive">Manga Not Found</h2>
        <p className="text-muted-foreground text-sm">Could not fetch manga details.</p>
        <Link href="/manga" className={buttonVariants({ variant: 'outline' })}>
          ← Back to Manga
        </Link>
      </div>
    );
  }

  const { data } = detailData;
  const { flagCode, label: typeLabel } = data.type ? parseType(data.type) : { flagCode: null, label: null };
  const chapters = [...(data.chapters?.list || [])].reverse();

  return (
    <div className="min-h-screen">
      {/* ── Hero ───────────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        <div
          className="absolute inset-0 scale-110"
          style={{
            backgroundImage   : `url(${data.thumbnail})`,
            backgroundSize    : 'cover',
            backgroundPosition: 'center top',
            filter            : 'blur(48px) brightness(0.2) saturate(0.4)',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/40 to-transparent" />

        <div className="relative container mx-auto max-w-6xl px-4 pt-10 pb-14 flex flex-col md:flex-row gap-8 items-start">
          {/* Cover */}
          <div className="w-36 md:w-52 shrink-0 mx-auto md:mx-0 shadow-2xl shadow-black/70">
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-full aspect-[3/4] object-cover"
            />
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3.5 text-center md:text-left">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight leading-tight text-white drop-shadow-sm">
              {data.title}
            </h1>

            {data.altTitle && (
              <p className="text-xs text-white/50 tracking-wide">{data.altTitle}</p>
            )}

            {/* Badges */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
              {data.type && (
                <span className="flex items-center gap-1.5 bg-red-700 text-white text-xs font-bold px-2.5 py-1">
                  {flagCode && (
                    <img src={`https://flagcdn.com/16x12/${flagCode}.png`} width={14} height={11} alt={flagCode} />
                  )}
                  {typeLabel?.toUpperCase()}
                </span>
              )}
              {data.status && (
                <span className={`text-xs font-semibold px-2.5 py-1 ${
                  data.status.toLowerCase().includes('ongoing')
                    ? 'bg-emerald-600/90 text-white'
                    : 'bg-white/15 text-white/80'
                }`}>
                  {data.status}
                </span>
              )}
              {data.rating && parseFloat(data.rating) > 0 && (
                <span className="flex items-center gap-1 text-xs font-bold text-amber-400 bg-black/30 px-2 py-1">
                  <Star className="h-3 w-3 fill-amber-400" /> {data.rating}
                </span>
              )}
            </div>

            {/* Meta */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-white/50">
              {data.info?.authors && (
                <span className="flex items-center gap-1.5">
                  <User className="h-3 w-3" /> {data.info.authors}
                </span>
              )}
              {data.chapters?.total > 0 && (
                <span className="flex items-center gap-1.5">
                  <BookOpen className="h-3 w-3" /> {data.chapters.total} Chapter
                </span>
              )}
            </div>

            {/* Genres */}
            {data.genres?.length > 0 && (
              <div className="flex flex-wrap justify-center md:justify-start gap-1.5">
                {data.genres.map((g: any) => (
                  <Link
                    key={g.name}
                    href={`/manga/genre/${g.name.toLowerCase().replace(/\s+/g, '-')}`}
                    className="text-xs px-2.5 py-0.5 bg-white/10 hover:bg-primary hover:text-primary-foreground transition-colors text-white/60 border border-white/10"
                  >
                    {g.name}
                  </Link>
                ))}
              </div>
            )}

            {/* Synopsis */}
            {data.synopsis && (
              <div className="max-w-2xl mx-auto md:mx-0">
                <ExpandableText text={data.synopsis} clampLines={3} />
              </div>
            )}

            {/* CTA */}
            {data.firstChapterUrl && (
              <div className="pt-1">
                <a
                  href={data.firstChapterUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ size: 'lg', className: 'gap-2' })}
                >
                  <BookOpen className="h-4 w-4" />
                  Baca Chapter Pertama
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────────── */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_260px] gap-8">

          {/* Chapter List */}
          <ChapterList chapters={chapters} total={data.chapters?.total || 0} seriesSlug={slug} />

          {/* Sidebar — quick-info card */}
          <aside className="hidden lg:block">
            <div className="space-y-4">
              <div className="border border-border/50 bg-card overflow-hidden">
                {/* Header */}
                <div className="px-4 py-3 border-b border-border/50 bg-muted/30">
                  <p className="text-sm font-bold line-clamp-2 text-foreground">
                    {data.title}
                  </p>
                </div>

                <div className="p-4 space-y-3">
                  {data.firstChapterUrl && (
                    <a
                      href={data.firstChapterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={buttonVariants({ className: 'w-full gap-2', size: 'sm' })}
                    >
                      <BookOpen className="h-3.5 w-3.5" />
                      Mulai Baca
                    </a>
                  )}

                  {/* Info grid */}
                  <dl className="space-y-1.5 text-xs border-t border-border/50 pt-3">
                    {[
                      ['Type',    typeLabel],
                      ['Status',  data.status],
                      ['Author',  data.info?.authors],
                      ['Chapter', data.chapters?.total ? `${data.chapters.total} chapter` : null],
                      ['Rating',  data.rating && parseFloat(data.rating) > 0 ? data.rating : null],
                    ].filter(([, v]) => v).map(([k, v]) => (
                      <div key={k as string} className="flex items-start justify-between gap-2">
                        <dt className="text-muted-foreground shrink-0">{k}</dt>
                        <dd className={`font-medium text-right truncate ${
                          k === 'Rating' ? 'text-amber-400' : 'text-foreground'
                        }`}>
                          {k === 'Rating' ? `⭐ ${v}` : v}
                        </dd>
                      </div>
                    ))}
                  </dl>

                  {/* Genres */}
                  {data.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1 border-t border-border/50 pt-3">
                      {data.genres.map((g: any) => (
                        <Link
                          key={g.name}
                          href={`/manga/genre/${g.name.toLowerCase().replace(/\s+/g, '-')}`}
                          className="text-[11px] px-2 py-0.5 bg-muted hover:bg-primary hover:text-primary-foreground transition-colors text-muted-foreground"
                        >
                          {g.name}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Related Manga */}
        <RelatedManga items={data.related || []} />
      </div>
    </div>
  );
}
