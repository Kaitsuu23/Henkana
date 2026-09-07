import Link from 'next/link';
import { Eye, Star } from 'lucide-react';

interface Chapter {
  chapter: string;
  badge?: string | null;
  url: string;
  date: string | null;
}

interface MangaCardProps {
  title: string;
  thumbnail: string;
  url: string;
  type?: string;
  typeUrl?: string;
  views?: string | null;
  score?: string | null;
  latestChapters?: Chapter[];
  titleLines?: 1 | 2;
}

// Map emoji flag → country code untuk flagcdn.com
const FLAG_MAP: Record<string, string> = {
  '🇰🇷': 'kr',
  '🇯🇵': 'jp',
  '🇨🇳': 'cn',
  '🇺🇸': 'us',
};

function parseMangaType(type: string) {
  // Cek apakah dimulai dengan emoji flag (2 regional indicator chars = 4 bytes)
  for (const [emoji, code] of Object.entries(FLAG_MAP)) {
    if (type.startsWith(emoji)) {
      const label = type.replace(emoji, '').trim();
      return { flagCode: code, label };
    }
  }
  return { flagCode: null, label: type };
}

function getChapterReaderUrl(chapterUrl: string) {
  try {
    const u = new URL(chapterUrl);
    const ch = u.searchParams.get('chapter');
    const slug = u.pathname.split('/')[2];
    if (ch && slug) return `/manga/${slug}/${ch}`;
  } catch {}
  return chapterUrl;
}

function getMangaHref(url: string) {
  try {
    const u = new URL(url, 'https://hentaicop.com');
    if (u.pathname.startsWith('/manga/')) {
      return `/manga/${u.pathname.split('/')[2]}`;
    }
    return url;
  } catch {
    return url;
  }
}

export function MangaCard({ title, thumbnail, url, type, views, score, latestChapters = [], titleLines = 2 }: MangaCardProps) {
  const href = getMangaHref(url);

  return (
    <div className="flex flex-col h-full">
      {/* Thumbnail */}
      <Link href={href} className="group relative block aspect-[3/4] w-full overflow-hidden bg-muted">
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          loading="lazy"
        />

        {/* type badge — bottom right */}
        {type && (() => {
          const { flagCode, label } = parseMangaType(type);
          return (
            <div className="absolute bottom-2 right-2 bg-red-700 text-white text-[10px] px-2 py-0.5 font-bold tracking-wide flex items-center gap-1.5">
              {flagCode && (
                <img
                  src={`https://flagcdn.com/16x12/${flagCode}.png`}
                  width={16}
                  height={12}
                  alt={flagCode}
                  className="inline-block"
                />
              )}
              {label.toUpperCase()}
            </div>
          );
        })()}
      </Link>

      {/* Info — fixed heights biar chapter selalu sejajar */}
      <div className="pt-2 flex flex-col">
        <Link href={href}>
          <h3 className={`${titleLines === 1 ? 'h-5 truncate' : 'h-10 line-clamp-2'} text-sm font-bold text-foreground/90 hover:text-primary transition-colors leading-snug`}>
            {title}
          </h3>
        </Link>

        {/* Views + Score — fixed height h-5 */}
        <div className="h-5 mt-1.5 flex items-center">
          {(views || score) && (
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
              {views && (
                <span className="flex items-center gap-1">
                  <Eye className="h-3 w-3" />
                  {views} Views
                </span>
              )}
              {score && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {score}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Latest Chapters — selalu di posisi yang sama */}
        <div className="pt-2 flex flex-col gap-1">
          {latestChapters.slice(0, 2).map((ch, i) => (
            <Link
              key={i}
              href={getChapterReaderUrl(ch.url)}
              className="flex items-center justify-between bg-muted px-2.5 py-1.5 text-xs font-semibold hover:bg-primary hover:text-primary-foreground transition-colors group/ch"
            >
              <span className="truncate">
                {ch.chapter}
                {ch.badge && (
                  <span className="ml-1.5 text-[10px] bg-primary/20 text-primary group-hover/ch:bg-primary-foreground/20 group-hover/ch:text-primary-foreground px-1 py-0.5">
                    {ch.badge}
                  </span>
                )}
              </span>
              <span className="shrink-0 text-muted-foreground group-hover/ch:text-primary-foreground/70 ml-2">
                {ch.date}
              </span>
            </Link>
          ))}
          {/* Placeholder biar tinggi konsisten */}
          {Array.from({ length: Math.max(0, 2 - latestChapters.length) }).map((_, i) => (
            <div key={i} className="h-7" />
          ))}
        </div>
      </div>
    </div>
  );
}
