import type { Metadata } from 'next';
import { getListMode } from '@/lib/api';

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}): Promise<Metadata> {
  const { title = '' } = await searchParams;
  return { title: title ? `Daftar Series - ${title}` : 'Daftar Series - List' };
}
import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import { Grid2X2, List } from 'lucide-react';

export const revalidate = 86400; // cache 24 jam

const LETTERS = ['[', '#', ...Array.from({ length: 26 }, (_, i) => String.fromCharCode(65 + i))];

export default async function ListModePage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string }>;
}) {
  const { title = '' } = await searchParams;

  let listData;
  try {
    listData = await getListMode(title);
  } catch {
    listData = null;
  }

  const groups = listData?.groups || [];

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-bold">Daftar Series</h1>
          {listData?.total && (
            <p className="text-sm text-muted-foreground mt-0.5">{listData.total.toLocaleString()} series</p>
          )}
        </div>
        {/* Toggle mode */}
        <Link
          href="/daftar-series"
          className={buttonVariants({ variant: 'outline', size: 'sm' })}
        >
          <Grid2X2 className="h-4 w-4 mr-2" />
          Modus Gambar
        </Link>
      </div>

      {/* Alphabet nav */}
      <div className="flex flex-wrap gap-1.5">
        <Link
          href="/daftar-series/list"
          className={`text-sm px-3.5 py-2 font-medium transition-colors border ${
            !title ? 'bg-primary text-primary-foreground border-primary' : 'bg-muted border-border/50 hover:bg-muted/70'
          }`}
        >
          Semua
        </Link>
        {LETTERS.map(l => (
          <Link
            key={l}
            href={`/daftar-series/list?title=${encodeURIComponent(l)}`}
            className={`text-sm px-3.5 py-2 font-medium transition-colors border ${
              title === l
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-muted border-border/50 hover:bg-muted/70'
            }`}
          >
            {l}
          </Link>
        ))}
      </div>

      {/* List groups */}
      {groups.length > 0 ? (
        <div className="space-y-6">
          {groups.map((group: any) => (
            <div key={group.letter}>
              {/* Letter header */}
              <div className="text-lg font-bold text-primary border-b border-border/40 pb-1 mb-3">
                {group.letter}
              </div>
              {/* 2 kolom grid list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1">
                {group.items.map((item: any, i: number) => (
                  <Link
                    key={i}
                    href={item.slug ? `/series/${item.slug}` : item.url}
                    className="text-sm text-foreground/80 hover:text-primary transition-colors truncate py-0.5 flex items-center gap-1.5 group"
                  >
                    <span className="w-1 h-1 rounded-full bg-primary/50 shrink-0 group-hover:bg-primary transition-colors" />
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-muted-foreground">
          Tidak ada series ditemukan.
        </div>
      )}
    </div>
  );
}
