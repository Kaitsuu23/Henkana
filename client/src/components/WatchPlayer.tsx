'use client';

import { useEffect, useState } from 'react';
import { HlsPlayer } from './HlsPlayer';
import { Loader2 } from 'lucide-react';

interface Server {
  name: string;
  embedUrl: string;
}

interface QualitySource {
  quality: string;
  hlsUrl: string;
}

interface WatchPlayerProps {
  episodeUrl: string;
  servers: Server[];
  title?: string;
  prevUrl?: string | null;
  nextUrl?: string | null;
}

/**
 * Client component — fetches stream URLs from /api/watch after hydration.
 * This keeps the server render fast (no stream extraction on SSR).
 */
export function WatchPlayer({ episodeUrl, servers, title, prevUrl, nextUrl }: WatchPlayerProps) {
  const [sources, setSources] = useState<QualitySource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    if (!episodeUrl) { setLoading(false); return; }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetch(`/api/watch?url=${encodeURIComponent(episodeUrl)}`)
      .then(r => r.json())
      .then(json => {
        if (cancelled) return;
        if (!json.success) { setError('Stream tidak tersedia'); setLoading(false); return; }

        const extracted: QualitySource[] = (json.streams || [])
          .filter((s: any) => s.hlsUrl)
          .map((s: any) => ({ quality: s.quality || s.server || 'Default', hlsUrl: s.hlsUrl }));

        setSources(extracted);
        if (extracted.length === 0) setError('Stream tidak tersedia untuk episode ini');
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) { setError('Gagal memuat stream'); setLoading(false); }
      });

    return () => { cancelled = true; };
  }, [episodeUrl]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-3 text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="text-sm">Memuat stream{servers.length > 0 ? ` dari ${servers.length} server` : ''}…</span>
      </div>
    );
  }

  if (error || sources.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full gap-2 text-muted-foreground text-sm">
        <span>{error || 'Stream tidak tersedia'}</span>
        {servers.length > 0 && (
          <span className="text-xs opacity-60">{servers.length} server tersedia namun tidak dapat di-extract</span>
        )}
      </div>
    );
  }

  return (
    <HlsPlayer
      sources={sources}
      title={title}
      prevUrl={prevUrl}
      nextUrl={nextUrl}
    />
  );
}
