import { getHome, getSidebar } from '@/lib/api';
import { AnimeCard } from '@/components/AnimeCard';
import { MangaCard } from '@/components/MangaCard';
import { Sidebar } from '@/components/Sidebar';
import { HomeHero } from '@/components/HomeHero';
import { RecommendationSection } from '@/components/RecommendationSection';

export const revalidate = 300; // revalidate every 5 minutes

export default async function Home() {
  const [homeData, sidebarData] = await Promise.all([
    getHome().catch(() => null),
    getSidebar().catch(() => null),
  ]);

  if (!homeData || !homeData.success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-bold text-destructive">Failed to load content</h2>
        <p className="text-muted-foreground mt-2">Could not connect to the API server.</p>
      </div>
    );
  }

  const sections = homeData.sections || [];
  const heroItems = sections.length > 0 ? sections[0].data.slice(0, 6) : [];

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden -mt-[57px]">
      {heroItems.length > 0 && <HomeHero items={heroItems} />}

      <div className="container mx-auto px-4 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 py-12">
        {/* Main Content Area */}
        <div className="space-y-12">
          {sections.map((section: any, idx: number) => {
            // Section Komik Hentai — pakai MangaCard, 4 kolom
            if (section.type === 'manga') {
              return (
                <section key={idx} className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full" />
                    <h2 className="text-xl font-bold">{section.section}</h2>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                    {(section.data || []).map((item: any, i: number) => (
                      <MangaCard key={i} {...item} titleLines={1} />
                    ))}
                  </div>
                </section>
              );
            }

            // Section Rekomendasi — punya tabs
            if (section.type === 'anime-tabs') {
              return (
                <RecommendationSection
                  key={idx}
                  title={section.section}
                  tabs={section.tabs}
                />
              );
            }

            // Section biasa
            const count = section.data?.length || 0;
            const gridCols =
              count <= 2 ? 'grid-cols-2' :
              count === 3 ? 'grid-cols-3' :
              count === 4 ? 'grid-cols-2 sm:grid-cols-4' :
              'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5';

            return (
              <section key={idx} className="space-y-4 relative group/section">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <span className="w-1.5 h-6 bg-primary rounded-full"></span>
                    {section.section}
                  </h2>
                </div>
                <div className={`grid ${gridCols} gap-4`}>
                  {(section.data || []).map((item: any, i: number) => (
                    <AnimeCard key={i} {...item} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {/* Sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <Sidebar data={sidebarData} />
          </div>
        </aside>
      </div>
    </div>
  );
}
