"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ExplorerItem {
  slug: string;
  name: string;
  count?: number | null;
}

interface ItemExplorerProps {
  items: ExplorerItem[];
  basePath: string;       // e.g. "/studio" or "/producer"
  label: string;          // e.g. "studio" or "producer"
}

const ALPHABET = ['#', ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('')];

export function ItemExplorer({ items, basePath, label }: ItemExplorerProps) {
  const [query, setQuery] = useState('');

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items]
  );

  const popular = useMemo(
    () => [...items].sort((a, b) => (b.count || 0) - (a.count || 0)).slice(0, 10),
    [items]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter((g) => g.name.toLowerCase().includes(q));
  }, [sorted, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, ExplorerItem[]>();
    for (const g of filtered) {
      const letter = /[a-z]/i.test(g.name[0]) ? g.name[0].toUpperCase() : '#';
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(g);
    }
    return [...map.entries()].sort(([a], [b]) => {
      if (a === '#') return -1;
      if (b === '#') return 1;
      return a.localeCompare(b);
    });
  }, [filtered]);

  const availableLetters = new Set(grouped.map(([letter]) => letter));

  return (
    <div className="space-y-8">
      {/* Filter input */}
      <div className="relative max-w-xs">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Filter ${label}...`}
          className="w-full rounded-md border border-border/60 bg-card py-2 pl-9 pr-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/50"
        />
      </div>

      {/* Popular */}
      {!query && popular.length > 0 && popular.some(p => p.count) && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Most popular
          </h2>
          <div className="flex flex-wrap gap-2">
            {popular.map((g) => (
              <ItemChip key={g.slug} item={g} basePath={basePath} emphasized />
            ))}
          </div>
        </div>
      )}

      {/* A–Z quick nav */}
      <div className="flex flex-wrap gap-1 border-y border-border/50 py-3">
        {ALPHABET.map((letter) => {
          const has = availableLetters.has(letter);
          return has ? (
            <a
              key={letter}
              href={`#letter-${letter}`}
              className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
            >
              {letter}
            </a>
          ) : (
            <span
              key={letter}
              className="flex h-6 w-6 items-center justify-center rounded text-xs text-muted-foreground/25"
            >
              {letter}
            </span>
          );
        })}
      </div>

      {/* Grouped list */}
      {grouped.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">
          No {label}s match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="space-y-7">
          {grouped.map(([letter, groupItems]) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-20 space-y-3">
              <h3 className="text-sm font-bold text-primary">{letter}</h3>
              <div className="flex flex-wrap gap-2">
                {groupItems.map((g) => (
                  <ItemChip key={g.slug} item={g} basePath={basePath} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function ItemChip({ item, basePath, emphasized }: { item: ExplorerItem; basePath: string; emphasized?: boolean }) {
  return (
    <Link
      href={`${basePath}/${item.slug}`}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-sm font-medium transition-colors',
        emphasized
          ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20'
          : 'border-border/60 bg-card text-foreground hover:border-primary/50 hover:bg-muted/50 hover:text-primary'
      )}
    >
      {item.name}
      {item.count ? (
        <span className={cn('text-xs', emphasized ? 'text-primary/70' : 'text-muted-foreground')}>
          {item.count}
        </span>
      ) : null}
    </Link>
  );
}
