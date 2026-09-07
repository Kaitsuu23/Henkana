import { getDoujinshi, getSidebar } from '@/lib/api';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';
import { NumberedPagination } from '@/components/NumberedPagination';

export const revalidate = 300;

function getMangaHref(url: string, slug?: string | null) {
  if (slug) return `/manga/${slug}`;
  try {
    const u = new URL(url, 'https://hentaicop.com');
    if (u.pathname.startsWith('/manga/')) return `/manga/${u.pathname.split('/')[2]}`;
  } catch {}
  return url;
}

export default async function DoujinshiPageN({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageStr } = await params;
  const page = Number(pageStr) || 1;

  const [doujinshiData, sidebarData] = await Promise.all([
    getDoujinshi(page).catch(() => null),
    getSidebar().catch(() => null),
  ]);

  if (!doujinshiData?.success) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-destructive">Error Loading Doujinshi</h2>
      </div>
    );
  }

  const { data = [], totalPages, hasNextPage, hasPrevPage } = doujinshiData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

        {/* Main content */}
        <div className="space-y-6">
          {/* Header */}
          <div className="border-b border-border/40 pb-4 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Doujinshi & Manga</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Halaman {page} dari {totalPages}
              </p>
            </div>
            <Link href="/manga" className="text-sm text-muted-foreground hover:text-primary transition-colors">
              ← Kembali ke Komik
            </Link>
          </div>

          {/* Grid */}
          {data.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {data.map((item: any, i: number) => {
                const href = getMangaHref(item.url, item.slug);
                return (
                  <div key={i} className="flex flex-col">
                    <Link href={href} className="group relative block aspect-[3/4] overflow-hidden bg-muted">
                      <img
                        src={item.thumbnail}
                        alt={item.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                      />
                    </Link>
                    <div className="pt-2">
                      <Link href={href}>
                        <h3 className="line-clamp-2 text-sm font-bold text-foreground/90 hover:text-primary transition-colors leading-snug">
                          {item.title}
                        </h3>
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-20 text-center text-muted-foreground">
              Tidak ada konten ditemukan.
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <NumberedPagination
              page={page}
              totalPages={totalPages}
              hasPrevPage={hasPrevPage}
              hasNextPage={hasNextPage}
              hrefBuilder={(p) => p <= 1 ? '/manga/doujinshi' : '/manga/doujinshi/page/' + p + '/'}
            />
          )}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <Sidebar data={sidebarData} />
        </aside>

      </div>
    </div>
  );
}
