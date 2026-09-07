import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface SidebarProps {
  data: any;
}

export function Sidebar({ data }: SidebarProps) {
  if (!data?.popular || data.popular.length === 0) return null;

  return (
    <div className="w-full">
      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
        <span className="w-1 h-5 bg-primary rounded-full"></span>
        Trending Now
      </h3>
      
      <Tabs defaultValue={data.popular[0].tab} className="w-full">
        <TabsList className="w-full grid" style={{ gridTemplateColumns: `repeat(${data.popular.length}, 1fr)` }}>
          {data.popular.map((section: any) => (
            <TabsTrigger key={section.tab} value={section.tab} className="text-xs">
              {section.tab}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {data.popular.map((section: any) => (
          <TabsContent key={section.tab} value={section.tab}>
            <div className="flex flex-col gap-4 mt-4">
                {section.items.map((item: any, i: number) => {
                  const urlObj = new URL(item.url, 'https://hentaicop.com');
                  let internalLink = '/';
                  if (urlObj.pathname.startsWith('/series/')) {
                    internalLink = `/series/${urlObj.pathname.split('/')[2]}`;
                  } else if (urlObj.pathname.startsWith('/manga/')) {
                    internalLink = `/manga/${urlObj.pathname.split('/')[2]}`;
                  } else {
                    const path = urlObj.pathname.replace(/^\/|\/$/g, '');
                    internalLink = `/watch/${path}`;
                  }

                  return (
                    <div key={i} className="flex gap-3 group">
                      <Link href={internalLink} className="relative w-20 h-24 shrink-0 overflow-hidden block">
                        <img src={item.thumbnail} alt={item.title} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
                        <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-[10px] font-bold px-1.5 py-0.5">
                          #{item.rank}
                        </div>
                      </Link>
                      <div className="flex flex-col py-1">
                        <Link href={internalLink}>
                          <h4 className="text-sm font-medium line-clamp-2 leading-tight hover:text-primary transition-colors">
                            {item.title}
                          </h4>
                        </Link>
                        {item.genres && item.genres.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.genres.slice(0, 6).map((genre: string) => (
                              <Link
                                key={genre}
                                href={`/genre/${genre.toLowerCase().replace(/\s+/g, '-')}`}
                                className="text-[11px] font-medium px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground hover:text-primary-foreground hover:bg-primary transition-colors border border-border/50"
                              >
                                {genre}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
