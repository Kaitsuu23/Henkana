"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Star, Play, ImageOff } from 'lucide-react';
import { AnimeCardTooltip } from './AnimeCardTooltip';

export interface AnimeCardProps {
  title: string;
  thumbnail: string;
  url: string;
  postId?: string | null;
  lastEpisode?: string;
  type?: string;
  status?: string;
  score?: string;
}

export function getSlugFromUrl(url: string) {
  try {
    const urlObj = new URL(url, 'https://hentaicop.com');
    if (urlObj.pathname.startsWith('/series/')) {
      return `/series/${urlObj.pathname.split('/')[2]}`;
    } else if (urlObj.pathname.startsWith('/manga/')) {
      return `/manga/${urlObj.pathname.split('/')[2]}`;
    } else {
      const path = urlObj.pathname.replace(/^\/|\/$/g, '');
      return `/watch/${path}`;
    }
  } catch {
    return '#';
  }
}

// Shown in place of the <img> when the thumbnail URL is missing or
// fails to load — keeps the card's dimensions and lets the title
// still be identified instead of falling back to the browser's
// native broken-image icon + overflowing alt text.
function ImageFallback({ title }: { title: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-muted px-3 text-center">
      <ImageOff className="h-6 w-6 text-muted-foreground/40" aria-hidden />
      <span className="line-clamp-3 text-[11px] font-medium leading-snug text-muted-foreground/50">
        {title}
      </span>
    </div>
  );
}

function CardContent({
  localHref, title, thumbnail, type, status, lastEpisode, score,
}: {
  localHref: string;
  title: string;
  thumbnail: string;
  type?: string;
  status?: string;
  lastEpisode?: string;
  score?: string;
}) {
  const showRating = score && score !== '0';
  const [imgError, setImgError] = useState(false);
  const showFallback = !thumbnail || imgError;

  return (
    <div className="relative flex flex-col gap-3">
      {/* Image area */}
      <Link href={localHref} className="group/img relative block aspect-[3/4] w-full overflow-hidden bg-muted">
        {showFallback ? (
          <ImageFallback title={title} />
        ) : (
          <img
            src={thumbnail}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover/img:scale-110"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 transition-opacity duration-300 group-hover/img:opacity-80" />

        {/* Play overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover/img:opacity-100 scale-90 group-hover/img:scale-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/90 text-primary-foreground backdrop-blur-sm shadow-xl">
            <Play className="h-6 w-6 ml-1" />
          </div>
        </div>

        {/* Type badge — top right */}
        {type && (
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md px-1.5 py-0.5 text-xs font-medium shadow-xl border border-white/10 text-white">
            {showRating && <Star className="h-3 w-3 fill-amber-400 text-amber-400" />}
            <span>{type}</span>
          </div>
        )}

        {/* Episode + Status badges — bottom left overlay */}
        {(lastEpisode || status) && (
          <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
            {lastEpisode && (
              <span className="bg-black/70 backdrop-blur-sm text-white text-[11px] px-2 py-0.5 font-medium border border-white/10">
                {lastEpisode}
              </span>
            )}
            {status && (
              <span className="bg-primary/80 backdrop-blur-sm text-primary-foreground text-[11px] px-2 py-0.5 font-medium">
                {status}
              </span>
            )}
          </div>
        )}
      </Link>

      {/* Title */}
      <div className="px-1">
        <Link href={localHref}>
          <h3 className="line-clamp-2 text-sm font-bold text-foreground/90 hover:text-primary transition-colors leading-snug">
            {title}
          </h3>
        </Link>
      </div>
    </div>
  );
}

export function AnimeCard({ title, thumbnail, url, postId, lastEpisode, type, status, score }: AnimeCardProps) {
  const localHref = getSlugFromUrl(url);

  // detailHref selalu arahkan ke halaman series
  // Kalau sudah /series/:slug → pakai langsung
  // Kalau URL episode (/kanojo-saimin-episode-2/) → strip suffix "-episode-N"
  let detailHref: string | undefined;
  if (localHref.startsWith('/series/')) {
    detailHref = localHref;
  } else if (localHref.startsWith('/watch/')) {
    // Derive series slug dari episode slug: "kanojo-saimin-episode-2" → "kanojo-saimin"
    const epSlug = localHref.replace('/watch/', '');
    const seriesSlug = epSlug.replace(/-episode-\d+.*$/i, '');
    if (seriesSlug && seriesSlug !== epSlug) {
      detailHref = `/series/${seriesSlug}`;
    }
  }

  const content = (
    <CardContent
      localHref={localHref}
      title={title}
      thumbnail={thumbnail}
      type={type}
      status={status}
      lastEpisode={lastEpisode}
      score={score}
    />
  );

  // Kalau ada postId → wrap dengan tooltip
  if (postId) {
    return (
      <AnimeCardTooltip postId={postId} href={localHref} detailHref={detailHref}>
        {content}
      </AnimeCardTooltip>
    );
  }

  return content;
}