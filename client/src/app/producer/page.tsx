import type { Metadata } from 'next';
import { getProducers } from '@/lib/api';

export const metadata: Metadata = { title: 'All Producers' };
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { ItemExplorer } from '@/components/ItemExplorer';

export const revalidate = 86400;

export default async function ProducerPage() {
  let producerData;
  try {
    producerData = await getProducers();
  } catch (e) {
    producerData = null;
  }

  if (!producerData || !producerData.success) {
    return (
      <div className="container mx-auto max-w-6xl px-4 py-24">
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border/60 py-16 text-center">
          <AlertTriangle className="h-6 w-6 text-destructive/70" aria-hidden />
          <h2 className="text-lg font-semibold">Couldn't load producers</h2>
          <p className="max-w-xs text-sm text-muted-foreground">
            Something went wrong. Try refreshing or head back home.
          </p>
          <Link href="/" className="mt-2 text-sm font-medium text-primary hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  const producers = (producerData.data || []).map((p: any) => ({
    slug : p.slug,
    name : p.name,
    count: p.count ?? null,
  }));

  return (
    <div className="container mx-auto max-w-6xl space-y-8 px-4 py-10">
      <div className="space-y-2 border-b border-border/50 pb-6">
        <h1 className="text-3xl font-bold">All Producers</h1>
        <p className="text-muted-foreground">
          Browse anime by producer ({producerData.total} total)
        </p>
      </div>

      <ItemExplorer items={producers} basePath="/producer" label="producer" />
    </div>
  );
}
