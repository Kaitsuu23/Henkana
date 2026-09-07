import type { Metadata } from 'next';
import { getManga, getSidebar } from '@/lib/api';

export const metadata: Metadata = { title: 'Manga & Manhwa' };
import { MangaCard } from '@/components/MangaCard';
import { Sidebar } from '@/components/Sidebar';
import Link from 'next/link';

export const revalidate = 300;

export default async function MangaPageN({
  params,
}: {
  params: Promise<{ page: string }>;
}) {
  const { page: pageStr } = await params;
  const page = Number(pageStr) || 1;

  const [mangaData, sidebarData] = await Promise.all([
    getManga(page).catch(() => null),
    getSidebar().catch(() => null),
  ]);

  if (!mangaData || !mangaData.success) {
    return (
      <div className="py-20 text-center">
        <h2 className="text-xl font-bold text-destructive">Error Loading Manga</h2>
      </div>
    );
  }

  const { sections } = mangaData;

  return (
    <div className="container mx-auto px-4 py-8 max-w-screen-xl">
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8">

        {/* Main content */}
        <div className="space-y-10">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold">Manga & Doujinshi</h1>
            <p className="text-sm text-muted-foreground">Komik, manhwa, dan doujinshi terbaru</p>
          </div>

          {sections?.map((section: any, idx: number) => (
            <section key={idx} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <span className="w-1.5 h-6 bg-primary" />
                  {section.section}
                </h2>
                {section.seeMore && (
                  <Link
                    href={
                      section.seeMore.includes('manga_type_tax=manga')
                        ? '/manga/doujinshi'
                        : section.seeMore.includes('manhwa')
                        ? '/manga/manhwa'
                        : section.seeMore
                    }
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    Lihat Semua →
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-stretch">
                {section.data.map((item: any, i: number) => (
                  <MangaCard key={i} {...item} />
                ))}
              </div>

              {section.pagination && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  {section.pagination.hasPrevPage ? (
                    <Link
                      href={
                        section.pagination.currentPage - 1 === 1
                          ? '/manga'
                          : `/manga/page/${section.pagination.currentPage - 1}/`
                      }
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors border border-border/50"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-muted/30 text-muted-foreground/50 border border-border/30 cursor-not-allowed">
                      ← Previous
                    </span>
                  )}

                  <span className="text-sm text-muted-foreground px-2">
                    {section.pagination.currentPage} / {section.pagination.totalPages}
                  </span>

                  {section.pagination.hasNextPage ? (
                    <Link
                      href={`/manga/page/${section.pagination.currentPage + 1}/`}
                      className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-muted hover:bg-primary hover:text-primary-foreground transition-colors border border-border/50"
                    >
                      Next →
                    </Link>
                  ) : (
                    <span className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-muted/30 text-muted-foreground/50 border border-border/30 cursor-not-allowed">
                      Next →
                    </span>
                  )}
                </div>
              )}
            </section>
          ))}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <Sidebar data={sidebarData} />
        </aside>

      </div>
    </div>
  );
}
