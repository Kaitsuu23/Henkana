"use client";

import { useState, useCallback } from "react";
import * as HoverCard from "@radix-ui/react-hover-card";
import { Star, Info } from "lucide-react";
import Link from "next/link";

interface TooltipData {
  title: string;
  type?: string | null;
  score?: string | null;
  duration?: string | null;
  description?: string | null;
  status?: string | null;
  genres?: string[];
  studios?: string[];
}

interface AnimeCardTooltipProps {
  postId: string;
  href: string;
  detailHref?: string;
  children: React.ReactNode;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export function AnimeCardTooltip({ postId, href, detailHref, children }: AnimeCardTooltipProps) {
  const [data, setData]       = useState<TooltipData | null>(null);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [open, setOpen]       = useState(false);

  const handleOpenChange = useCallback(async (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen || fetched || !postId) return;

    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/tooltip/${postId}`);
      const json = await res.json();
      if (json.success) setData(json.data);
    } catch { /* silent */ }
    finally {
      setLoading(false);
      setFetched(true);
    }
  }, [postId, fetched]);

  function truncateText(text: string, maxLength = 180): string {
    if (!text) return "";

    if (text.length <= maxLength) {
      return text;
    }

    const truncated = text.slice(0, maxLength);

    // Cari spasi terakhir supaya kata tidak terpotong
    const lastSpace = truncated.lastIndexOf(" ");

    if (lastSpace === -1) {
      return truncated + "...";
    }

    return truncated.slice(0, lastSpace).trimEnd() + "...";
  }

  return (
    <HoverCard.Root open={open} onOpenChange={handleOpenChange} openDelay={500} closeDelay={200}>
      <HoverCard.Trigger asChild>
        <div className="cursor-pointer">{children}</div>
      </HoverCard.Trigger>

      <HoverCard.Portal>
        <HoverCard.Content
          side="right"
          sideOffset={12}
          align="start"
          avoidCollisions
          collisionPadding={16}
          className="z-50 w-72 bg-[#18181b]/96 backdrop-blur-md border border-white/10 shadow-2xl text-white"
        >
          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-10">
              <div className="h-7 w-7 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}

          {/* No data */}
          {!loading && fetched && !data && (
            <div className="px-4 py-6 text-sm text-muted-foreground text-center">
              Data tidak tersedia
            </div>
          )}

          {/* Data */}
          {!loading && data && (
            <div className="flex flex-col">
              {/* Title + type + score */}
              <div className="px-4 pt-4 pb-3 border-b border-white/10">
                <h4 className="font-bold text-base leading-snug">{data.title}</h4>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {data.score && parseFloat(data.score) > 0 && (
                    <span className="flex items-center gap-1 text-sm font-bold">
                      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                      {data.score}
                    </span>
                  )}
                  {data.duration && (
                    <span className="text-xs text-muted-foreground">{data.duration}</span>
                  )}
                  {data.type && (
                    <span className="ml-auto bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5">
                      {data.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              {data.description && (
                <p className="px-4 py-3 text-[12px] text-foreground/80 leading-relaxed border-b border-white/10">
                  {truncateText(data.description, 150)}
                </p>
              )}

              {/* Meta */}
              <div className="px-4 py-3 flex flex-col gap-1.5 text-[12px]">
                {data.status && (
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <span className="font-semibold">{data.status}</span>
                  </div>
                )}
                {data.genres && data.genres.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Genres: </span>
                    {data.genres.map((g, i) => (
                      <span key={g}>
                        <Link
                          href={`/genre/${g.toLowerCase().replace(/\s+/g, '-')}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {g}
                        </Link>
                        {i < data.genres!.length - 1 && <span className="text-muted-foreground">, </span>}
                      </span>
                    ))}
                  </div>
                )}
                {data.studios && data.studios.length > 0 && (
                  <div>
                    <span className="text-muted-foreground">Studio: </span>
                    {data.studios.map((s, i) => (
                      <span key={s}>
                        <Link
                          href={`/studio/${s.toLowerCase().replace(/\s+/g, '-')}`}
                          className="font-semibold hover:text-primary transition-colors"
                        >
                          {s}
                        </Link>
                        {i < data.studios!.length - 1 && <span className="text-muted-foreground">, </span>}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <Link
                href={detailHref || href}
                className="flex items-center justify-center gap-2 mx-3 mb-3 py-2 bg-white/10 hover:bg-primary/80 text-sm font-medium transition-colors"
              >
                <Info className="h-3.5 w-3.5" />
                Keterangan lebih lanjut
              </Link>
            </div>
          )}

          <HoverCard.Arrow className="fill-[#18181b]/96" />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}
