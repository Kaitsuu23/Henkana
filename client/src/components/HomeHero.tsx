"use client";

import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import Link from "next/link";
import { getSlugFromUrl } from "./AnimeCard";

interface HeroItem {
  title: string;
  thumbnail: string;
  url: string;
  lastEpisode?: string;
  type?: string;
  status?: string;
}

const TITLE_SIZE        = "clamp(2.2rem, 5.5vw, 4.2rem)";
const TITLE_LINE_HEIGHT = 0.95;
const TITLE_MAX_LINES   = 2;

export function HomeHero({ items }: { items: HeroItem[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActiveIndex(p => (p + 1) % items.length);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 600);
    }, 5000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [items.length]);

  if (!items || items.length === 0) return null;

  const active = items[activeIndex];
  const href   = getSlugFromUrl(active.url);

  function switchTo(i: number) {
    if (timerRef.current) clearInterval(timerRef.current);
    setActiveIndex(i);
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 600);
    timerRef.current = setInterval(() => {
      setActiveIndex(p => (p + 1) % items.length);
    }, 6000);
  }

  return (
    <>
      <style>{`
        .bh-bg {
          background: var(--background);
        }
        .bh-scan {
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(0,0,0,0.15) 0px, rgba(0,0,0,0.15) 1px,
            transparent 1px, transparent 3px
          );
          animation: bh-scan-move 8s linear infinite;
        }
        .bh-title-skew {
          transform: skewX(-5deg);
          transform-origin: left;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: ${TITLE_MAX_LINES};
          overflow: hidden;
        }
        .bh-fade-in  { animation: bh-rise 0.5s cubic-bezier(0.22,1,0.36,1) both; }
        .bh-art-fade { animation: bh-fade 0.6s ease both; }
        .bh-pulse    { animation: bh-dot-pulse 1.6s ease-in-out infinite; }
        @keyframes bh-fade      { from{opacity:0} to{opacity:1} }
        @keyframes bh-rise      { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        @keyframes bh-scan-move { from{transform:translateY(0)} to{transform:translateY(3px)} }
        @keyframes bh-dot-pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
      `}</style>

      <section className="relative min-h-[600px] md:min-h-[680px] flex flex-col overflow-hidden -mt-[57px] pt-[57px]">

        {/* Background */}
        <div key={`art-${activeIndex}`} className="absolute inset-0 bh-bg bh-art-fade" aria-hidden>
          {/* Thumbnail blur kanan */}
          <div
            className="absolute right-0 top-0 bottom-0 w-[55%] opacity-20"
            style={{
              backgroundImage    : `url(${active.thumbnail})`,
              backgroundSize     : "cover",
              backgroundPosition : "center top",
              maskImage          : "linear-gradient(to right, transparent 0%, black 40%)",
              WebkitMaskImage    : "linear-gradient(to right, transparent 0%, black 40%)",
              filter             : "saturate(0.5) blur(1px)",
            }}
          />
          <div className="absolute inset-0 bh-scan opacity-20" />
          <div
            className="absolute inset-0 opacity-15"
            style={{
              backgroundImage: "radial-gradient(rgba(0,0,0,0.6) 1px, transparent 1.4px)",
              backgroundSize : "5px 5px",
              mixBlendMode   : "multiply",
            }}
          />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
        </div>

        {/* Copy */}
        <div className="relative z-10 flex-1 flex items-center px-6 py-8 md:py-12">
          <div key={`copy-${activeIndex}`} className={`max-w-lg ${isAnimating ? "bh-fade-in" : ""}`}>

            {/* Tags */}
            <div className="flex gap-2 flex-wrap mb-5">
              {active.type && (
                <span className="text-[11px] px-2.5 py-1 border border-white/15 text-white/60">
                  {active.type}
                </span>
              )}
              {active.lastEpisode && (
                <span className="text-[11px] px-2.5 py-1 font-semibold border text-primary border-primary/40">
                  {active.lastEpisode}
                </span>
              )}
            </div>

            {/* Title */}
            <h1
              className="bh-title-skew text-white mb-5"
              style={{
                fontFamily : "'Anton', 'Impact', sans-serif",
                fontWeight : "400",
                fontSize   : TITLE_SIZE,
                lineHeight : TITLE_LINE_HEIGHT,
                textShadow : "0 2px 20px rgba(0,0,0,0.7)",
                minHeight  : `calc(${TITLE_SIZE} * ${TITLE_LINE_HEIGHT} * ${TITLE_MAX_LINES})`,
              }}
            >
              {active.title}
            </h1>

            {/* CTA */}
            <Link
              href={href}
              className="inline-flex items-center gap-2.5 font-bold text-sm px-6 py-3 bg-primary text-primary-foreground hover:-translate-y-0.5 active:translate-y-0 transition-all"
              style={{ borderRadius: "3px" }}
            >
              <Play className="h-4 w-4 fill-current" aria-hidden />
              Tonton Sekarang
            </Link>
          </div>
        </div>

        {/* Guide bar */}
        <div
          className="relative z-10 border-t border-white/10 px-6 pt-3 pb-5 bg-background/90"
          role="tablist"
          aria-label="Pilih episode"
        >
          <span className="block text-[11px] text-muted-foreground mb-2.5 uppercase tracking-widest">
            On air now
          </span>
          <div className="flex gap-2.5 overflow-x-auto pb-1">
            {items.map((item, i) => {
              const isActive = i === activeIndex;
              return (
                <button
                  key={i}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => switchTo(i)}
                  className={`flex-none flex items-center gap-2.5 px-3 py-2 text-left transition-colors border ${
                    isActive
                      ? "border-primary text-foreground bg-muted"
                      : "border-border/30 text-muted-foreground bg-muted/40 hover:bg-muted"
                  }`}
                  style={{ borderRadius: "3px" }}
                >
                  <span className="w-7 h-9 shrink-0 overflow-hidden" style={{ borderRadius: "2px" }}>
                    <img src={item.thumbnail} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className={`text-[10px] font-semibold tabular-nums ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                      {item.lastEpisode || item.type || "—"}
                    </span>
                    <span className="text-xs font-medium whitespace-nowrap max-w-[120px] truncate hidden sm:block">
                      {item.title}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
