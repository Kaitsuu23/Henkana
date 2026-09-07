"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowUpDown, CalendarDays, Eye } from "lucide-react";

interface Chapter {
  number: string | null;
  title: string | null;
  url: string;
  date: string | null;
  views: string | null;
  isNew: boolean;
}

interface ChapterListProps {
  chapters: Chapter[];
  total: number;
  seriesSlug: string; // untuk build internal URL
}

function getChapterHref(chUrl: string, seriesSlug: string) {
  try {
    const u = new URL(chUrl);
    const ch = u.searchParams.get('chapter');
    const slug = u.pathname.split('/')[2] || seriesSlug;
    if (ch) return `/manga/${slug}/${ch}`;
  } catch {}
  return chUrl;
}

export function ChapterList({ chapters, total, seriesSlug }: ChapterListProps) {
  const [newestFirst, setNewestFirst] = useState(true);
  const sorted = newestFirst ? [...chapters].reverse() : chapters;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <span className="w-1.5 h-6 bg-primary" />
          Chapter List
          <span className="text-sm font-normal text-muted-foreground">({total})</span>
        </h2>

        <button
          onClick={() => setNewestFirst(v => !v)}
          className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-muted hover:bg-primary hover:text-primary-foreground border border-border/50 transition-colors"
        >
          <ArrowUpDown className="h-3 w-3" />
          {newestFirst ? "Terbaru" : "Terlama"}
        </button>
      </div>

      {/* List */}
      <div className="flex flex-col gap-1 max-h-[270px] overflow-y-auto pr-1">
        {sorted.map((ch, i) => {
          const href = getChapterHref(ch.url, seriesSlug);
          return (
            <Link
              key={i}
              href={href}
              className="flex items-center justify-between px-4 py-2.5 bg-muted/30 hover:bg-primary/10 border border-transparent hover:border-l-2 hover:border-primary transition-all group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-bold text-primary/60 w-6 shrink-0 tabular-nums">
                  {ch.number}
                </span>
                <span className="text-sm font-medium group-hover:text-primary transition-colors truncate">
                  {ch.title}
                </span>
                {ch.isNew && (
                  <span className="text-[10px] bg-primary text-primary-foreground px-1.5 py-0.5 font-bold shrink-0">
                    NEW
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground ml-3">
                {ch.date && (
                  <span className="hidden sm:flex items-center gap-1">
                    <CalendarDays className="h-3 w-3" /> {ch.date}
                  </span>
                )}
              </div>
            </Link>
          );
        })}

        {sorted.length === 0 && (
          <div className="py-12 text-center text-muted-foreground text-sm border border-dashed border-border/50">
            Belum ada chapter tersedia.
          </div>
        )}
      </div>
    </div>
  );
}
