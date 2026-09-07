import { getWatch } from '@/lib/api';
import { Button, buttonVariants } from '@/components/ui/button';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { WatchPlayer } from '@/components/WatchPlayer';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  try {
    const data = await getWatch(`https://hentaicop.com/${slug}/`);
    return { title: data?.title || slug.replace(/-/g, ' ') };
  } catch {
    return { title: slug.replace(/-/g, ' ') };
  }
}

export default async function WatchPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const episodeUrl = `https://hentaicop.com/${slug}/`;

  let watchData: any = null;
  try {
    watchData = await getWatch(episodeUrl);
  } catch {
    watchData = null;
  }

  if (!watchData?.title && !watchData?.servers) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-destructive">Episode Not Found</h2>
        <p className="text-muted-foreground mt-2">Could not load the episode data.</p>
      </div>
    );
  }

  const data = watchData;

  // Resolve prev/next
  function getNavUrl(navUrl: string | null) {
    if (!navUrl) return null;
    try {
      const u = new URL(navUrl, 'https://hentaicop.com');
      return `/watch/${u.pathname.replace(/^\/|\/$/g, '')}`;
    } catch { return null; }
  }

  const prevUrl = getNavUrl(data.navigation?.prev);
  const nextUrl = getNavUrl(data.navigation?.next);

  // Series link
  let seriesLink = '#';
  if (data.series?.url) {
    try {
      const sObj = new URL(data.series.url, 'https://hentaicop.com');
      seriesLink = `/series/${sObj.pathname.split('/')[2]}`;
    } catch {}
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-6xl space-y-6 pb-10">

      {/* Header */}
      <div className="flex flex-col gap-4 border-b border-border/50 pb-5 md:flex-row md:items-end md:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div>
              <span className="block text-xs text-muted-foreground">Now playing</span>
              <h1 className="text-xl font-bold leading-tight text-foreground md:text-2xl">
                {data.title}
              </h1>
            </div>
          </div>
        </div>
      </div>

      {/* Player — stream extraction happens client-side */}
      <div className="aspect-video w-full bg-black overflow-hidden border border-border shadow-2xl">
        <WatchPlayer
          episodeUrl={episodeUrl}
          servers={data.servers || []}
          title={data.title}
          prevUrl={prevUrl}
          nextUrl={nextUrl}
        />
      </div>

      {/* Navigasi */}
      <div className="flex items-center justify-between border-t border-b border-border/50 py-4">
        {prevUrl ? (
          <Link href={prevUrl} className={buttonVariants({ variant: 'outline' })}>
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Link>
        ) : (
          <Button variant="outline" disabled>
            <ChevronLeft className="w-4 h-4 mr-2" /> Previous
          </Button>
        )}

        <Link href={seriesLink} className={buttonVariants({ variant: 'default' })}>
          All Episodes
        </Link>

        {nextUrl ? (
          <Link href={nextUrl} className={buttonVariants({ variant: 'outline' })}>
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Link>
        ) : (
          <Button variant="outline" disabled>
            Next <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>

      {/* Downloads */}
      {data.downloads && data.downloads.length > 0 && (
        <div className="space-y-4 pt-2">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <span className="w-1.5 h-6 bg-primary" />
            Download Links
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.downloads.map((dl: any, i: number) => (
              <a
                key={i}
                href={dl.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border border-border bg-card hover:bg-muted/50 transition-colors group"
              >
                <div className="flex flex-col">
                  <span className="font-medium text-sm group-hover:text-primary transition-colors">{dl.server}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-[10px]">{dl.quality}</Badge>
                    <span className="text-xs text-muted-foreground">{dl.size}</span>
                  </div>
                </div>
                <Download className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
