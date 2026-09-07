import type { Metadata } from 'next';
import { getMangaRead } from '@/lib/api';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, BookOpen } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

function proxyImage(url: string) {
  return `${API_BASE}/proxy/image?url=${encodeURIComponent(url)}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}): Promise<Metadata> {
  const { slug, chapter } = await params;
  const chapterLabel = chapter.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  const seriesLabel  = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return { title: `${seriesLabel} - ${chapterLabel}` };
}

export default async function MangaReaderPage({
  params,
}: {
  params: Promise<{ slug: string; chapter: string }>;
}) {
  const { slug, chapter } = await params;

  // Construct URL: /manga/:slug/?chapter=:chapter
  const mangaUrl = `https://hentaicop.com/manga/${slug}/?chapter=${chapter}`;

  let readData;
  try {
    readData = await getMangaRead(mangaUrl);
  } catch {
    readData = null;
  }

  if (!readData?.success) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
        <BookOpen className="h-10 w-10 text-muted-foreground/30" />
        <h2 className="text-xl font-bold">Chapter tidak ditemukan</h2>
        <p className="text-sm text-muted-foreground">
          Chapter ini mungkin belum tersedia atau memerlukan login.
        </p>
        <Link href={`/manga/${slug}`} className={buttonVariants({ variant: 'outline' })}>
          ← Kembali ke Detail
        </Link>
      </div>
    );
  }

  const { data } = readData;
  const seriesHref = `/manga/${data.seriesSlug || slug}`;

  // Build nav URLs — extract chapter slug from full URL
  function getReaderUrl(fullUrl: string | null) {
    if (!fullUrl) return null;
    try {
      const u = new URL(fullUrl);
      const ch = u.searchParams.get('chapter');
      const mangaSlug = u.pathname.split('/')[2];
      if (ch && mangaSlug) return `/manga/${mangaSlug}/${ch}`;
    } catch {}
    return null;
  }

  const prevHref = getReaderUrl(data.navigation?.prev);
  const nextHref = getReaderUrl(data.navigation?.next);

  return (
    <div className="min-h-screen bg-black">
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div className="sticky top-0 z-50 bg-black/90 backdrop-blur border-b border-white/10">
        <div className="container mx-auto max-w-4xl px-4 h-12 flex items-center justify-between gap-3">
          {/* Series + chapter info */}
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={seriesHref}
              className="text-white/60 hover:text-white text-xs transition-colors shrink-0"
            >
              ← Series
            </Link>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white text-xs font-medium truncate">
              {data.chapterLabel || chapter.replace(/-/g, ' ')}
            </span>
            <span className="text-white/40 text-xs shrink-0">
              · {data.totalPages} halaman
            </span>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-1 shrink-0">
            {prevHref ? (
              <Link
                href={prevHref}
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 hover:bg-white/10 transition-colors"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-xs text-white/20 px-2 py-1 cursor-not-allowed">
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </span>
            )}
            {nextHref ? (
              <Link
                href={nextHref}
                className="flex items-center gap-1 text-xs text-white/70 hover:text-white px-2 py-1 hover:bg-white/10 transition-colors"
              >
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-xs text-white/20 px-2 py-1 cursor-not-allowed">
                Next <ChevronRight className="h-3.5 w-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Pages ───────────────────────────────────────────── */}
      <div className="flex flex-col items-center gap-0">
        {data.pages.map((src: string, i: number) => (
          <img
            key={i}
            src={proxyImage(src)}
            alt={`Page ${i + 1}`}
            className="w-full max-w-3xl block"
            loading={i < 3 ? 'eager' : 'lazy'}
            draggable={false}
          />
        ))}
      </div>

      {/* ── Bottom navigation ───────────────────────────────── */}
      <div className="flex items-center justify-center gap-4 py-8 border-t border-white/10 mt-4">
        {prevHref ? (
          <Link href={prevHref} className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
            <ChevronLeft className="h-4 w-4" /> Chapter Sebelumnya
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: 'outline' }), 'opacity-30 cursor-not-allowed gap-2')}>
            <ChevronLeft className="h-4 w-4" /> Chapter Sebelumnya
          </span>
        )}

        <Link href={seriesHref} className={cn(buttonVariants({ variant: 'secondary' }), 'gap-2')}>
          <BookOpen className="h-4 w-4" /> Daftar Chapter
        </Link>

        {nextHref ? (
          <Link href={nextHref} className={cn(buttonVariants({ variant: 'outline' }), 'gap-2')}>
            Chapter Berikutnya <ChevronRight className="h-4 w-4" />
          </Link>
        ) : (
          <span className={cn(buttonVariants({ variant: 'outline' }), 'opacity-30 cursor-not-allowed gap-2')}>
            Chapter Berikutnya <ChevronRight className="h-4 w-4" />
          </span>
        )}
      </div>
    </div>
  );
}
