"use client";

import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";

import { useState, useRef, useEffect } from "react";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import { Settings2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface QualitySource {
  quality: string;
  hlsUrl: string;
}

interface HlsPlayerProps {
  sources: QualitySource[];
  title?: string;
  prevUrl?: string | null;
  nextUrl?: string | null;
}

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

function proxied(url: string) {
  return `${API_BASE}/proxy/hls?url=${encodeURIComponent(url)}`;
}

export function HlsPlayer({ sources, title, prevUrl, nextUrl }: HlsPlayerProps) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [open, setOpen]           = useState(false);
  const panelRef  = useRef<HTMLDivElement>(null);
  const playerRef = useRef<HTMLDivElement>(null);
  const router    = useRouter();

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;

      const video = playerRef.current?.querySelector("video");

      switch (e.key.toLowerCase()) {

        case "q":
          e.preventDefault();
          setOpen(v => !v);
          break;

        case "1": case "2": case "3": {
          const idx = parseInt(e.key) - 1;
          if (idx < sources.length) { setActiveIdx(idx); setOpen(false); }
          break;
        }

        case "n":
          if (nextUrl) { e.preventDefault(); router.push(nextUrl); }
          break;

        case "p":
          if (prevUrl) { e.preventDefault(); router.push(prevUrl); }
          break;

        case " ":
        case "k":
          e.preventDefault();
          if (video) video.paused ? video.play() : video.pause();
          break;

        case "f":
          e.preventDefault();
          if (playerRef.current) {
            if (!document.fullscreenElement) playerRef.current.requestFullscreen();
            else document.exitFullscreen();
          }
          break;

        case "m":
          e.preventDefault();
          if (video) video.muted = !video.muted;
          break;

        case "arrowleft":
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 5);
          break;

        case "arrowright":
          e.preventDefault();
          if (video) video.currentTime = Math.min(video.duration, video.currentTime + 5);
          break;

        case "j":
          e.preventDefault();
          if (video) video.currentTime = Math.max(0, video.currentTime - 10);
          break;

        case "l":
          e.preventDefault();
          if (video) video.currentTime = Math.min(video.duration, video.currentTime + 10);
          break;

        case "arrowup":
          e.preventDefault();
          if (video) video.volume = Math.min(1, video.volume + 0.1);
          break;

        case "arrowdown":
          e.preventDefault();
          if (video) video.volume = Math.max(0, video.volume - 0.1);
          break;

        case "escape":
          setOpen(false);
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sources.length, nextUrl ?? "", prevUrl ?? ""]);

  if (!sources || sources.length === 0) return null;

  const active = sources[activeIdx];

  return (
    <>
      {/* Player — full width */}
      <div ref={playerRef} className="w-full h-full bg-black">
        <MediaPlayer
          key={active.quality}
          title={title}
          src={{ src: proxied(active.hlsUrl), type: "application/x-mpegurl" }}
          playsInline
          className="w-full h-full"
        >
          <MediaProvider />
          <DefaultVideoLayout icons={defaultLayoutIcons} />
        </MediaPlayer>
      </div>

      {/* Quality button — fixed di tepi kanan layar; tombol & panel satu grup flex
          biar panel selalu pas nempel di kiri tombol, berapa pun lebar tombolnya */}
      {sources.length > 1 && (
        <div
          ref={panelRef}
          className="fixed right-0 top-1/2 z-50 flex -translate-y-1/2 items-center"
        >
          {/* Floating panel — muncul ke kiri dari tombol */}
          {open && (
            <div
              className="mr-2 flex flex-col bg-background border border-border shadow-2xl overflow-hidden rounded-md"
            >
              <div className="px-3 py-2 border-b border-border/50 flex items-center justify-between gap-4">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                  Quality
                </span>
                <span className="text-[10px] text-muted-foreground/50">
                  Press 1–{sources.length}
                </span>
              </div>
              {sources.map((s, i) => (
                <button
                  key={`${s.quality}-${i}`}
                  onClick={() => { setActiveIdx(i); setOpen(false); }}
                  className={`text-sm font-semibold px-5 py-2.5 text-left transition-colors flex items-center justify-between gap-6 ${
                    i === activeIdx
                      ? "bg-primary text-primary-foreground"
                      : "hover:bg-muted text-foreground"
                  }`}
                >
                  <span>{s.quality}</span>
                  <span className={`text-[10px] font-normal ${i === activeIdx ? "text-primary-foreground/60" : "text-muted-foreground/50"}`}>
                    {i + 1}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Trigger — nempel di kanan layar, ikon + teks horizontal */}
          <button
            onClick={() => setOpen(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 shadow-lg transition-colors ${
              open
                ? "bg-primary text-primary-foreground"
                : "bg-background/90 border-l border-y border-border text-foreground hover:bg-muted"
            }`}
            style={{ borderRadius: "6px 0 0 6px" }}
            title="Quality (Q)"
          >
            <Settings2 className="h-3.5 w-3.5" />
            <span className="text-xs font-bold leading-none whitespace-nowrap">
              {sources[activeIdx].quality}
            </span>
          </button>
        </div>
      )}
    </>
  );
}