// ─────────────────────────────────────────────────────────────
//  api.ts — universal data-fetching layer
//
//  Server Components / API routes → call scrapers DIRECTLY
//    (no HTTP hop, works on Vercel, faster, no VERCEL_URL needed)
//
//  Client Components (browser) → fetch /api/* via HTTP
//    (can't import Node.js scrapers in the browser)
// ─────────────────────────────────────────────────────────────

// ── HTTP fallback used only in the browser ────────────────────
const CLIENT_API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' ? '/api' : '');

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${CLIENT_API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      next: { revalidate: 60, ...options?.next },
    });
    if (!res.ok) throw new Error(`API error: ${res.status} ${res.statusText}`);
    const data = await res.json();
    if (!data.success) throw new Error(data.error?.message || 'Unknown API error');
    return data;
  } catch (error) {
    console.error(`Fetch API Error [${endpoint}]:`, error);
    throw error;
  }
}

// ── Helpers ───────────────────────────────────────────────────
// Wrap scraper result to match the { success: true, ...fields } shape
// that pages expect (same as what API routes return via ok()).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap(data: any): any {
  if (data && typeof data === 'object' && 'success' in data) return data;
  // Spread the object so callers access fields at top level: result.data, result.total, etc.
  return { success: true, ...data };
}

// ── Server-side direct imports (lazy, so bundler only pulls them in
//    when this module runs on Node — not in the browser bundle) ──

/* eslint-disable @typescript-eslint/no-require-imports */
const lazyScrapers = {
  home           : () => require('./scrapers/homeParser'),
  search         : () => require('./scrapers/searchParser'),
  detail         : () => require('./scrapers/detailParser'),
  sidebar        : () => require('./scrapers/sidebarParser'),
  tooltip        : () => require('./scrapers/tooltipParser'),
  manga          : () => require('./scrapers/mangaParser'),
  manhwa         : () => require('./scrapers/manhwaParser'),
  doujinshi      : () => require('./scrapers/doujinshiParser'),
  listing        : () => require('./scrapers/listingParser'),
  watch          : () => require('./scrapers/watchParser'),
  player         : () => require('./scrapers/playerParser'),
  series         : () => require('./scrapers/seriesParser'),
  genre          : () => require('./scrapers/genreParser'),
  studio         : () => require('./scrapers/studioParser'),
  producer       : () => require('./scrapers/producerParser'),
  listMode       : () => require('./scrapers/listModeParser'),
  mangaDetail    : () => require('./scrapers/mangaDetailParser'),
  mangaGenre     : () => require('./scrapers/mangaGenreParser'),
  mangaRead      : () => require('./scrapers/mangaReadParser'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// ── Public API ────────────────────────────────────────────────

export async function getHome() {
  const { scrapeHome } = lazyScrapers.home();
  return wrap(await scrapeHome());
}

export async function getSearch(query: string, page = 1) {
  const { scrapeSearch } = lazyScrapers.search();
  return wrap(await scrapeSearch(query, page));
}

export async function getDetail(url: string) {
  const { scrapeDetail } = lazyScrapers.detail();
  return wrap(await scrapeDetail(url));
}

export async function getSidebar() {
  const { scrapeSidebar } = lazyScrapers.sidebar();
  return wrap(await scrapeSidebar());
}

export async function getWatch(url: string) {
  const { scrapeWatch }            = lazyScrapers.watch();
  const { extractStreamFromEmbed } = lazyScrapers.player();

  const data = await scrapeWatch(url);

  const streamResults = await Promise.allSettled(
    (data.servers as { name: string; embedUrl: string }[]).map(async (s) => {
      const stream = await extractStreamFromEmbed(s.embedUrl);
      return { server: s.name, embedUrl: s.embedUrl, ...stream };
    })
  );

  const streams = streamResults
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<unknown>).value);

  return wrap({ ...data, streams });
}

export async function getHentai(page = 1) {
  const { scrapeListing } = lazyScrapers.listing();
  return wrap(await scrapeListing('hentai', page));
}

export async function get2D(page = 1) {
  const { scrapeListing } = lazyScrapers.listing();
  return wrap(await scrapeListing('2d', page));
}

export async function getJav(page = 1) {
  const { scrapeListing } = lazyScrapers.listing();
  return wrap(await scrapeListing('jav', page));
}

export async function getUncensored(page = 1) {
  const { scrapeListing } = lazyScrapers.listing();
  return wrap(await scrapeListing('uncensored', page));
}

export async function getManga(page = 1) {
  const { scrapeManga } = lazyScrapers.manga();
  return wrap(await scrapeManga(page));
}

export async function getManhwa(page = 1) {
  const { scrapeManhwa } = lazyScrapers.manhwa();
  return wrap(await scrapeManhwa(page));
}

export async function getDoujinshi(page = 1) {
  const { scrapeDoujinshi } = lazyScrapers.doujinshi();
  return wrap(await scrapeDoujinshi(page));
}

export async function getSeries(params: Record<string, string | number | string[]>) {
  const { scrapeSeries } = lazyScrapers.series();
  const p = params as Parameters<typeof scrapeSeries>[0];
  return wrap(await scrapeSeries(p));
}

export async function getSeriesFilters() {
  const { scrapeSeriesFilters } = lazyScrapers.series();
  return wrap(await scrapeSeriesFilters());
}

export async function getListMode(title = '') {
  const { scrapeListMode } = lazyScrapers.listMode();
  return wrap(await scrapeListMode(title));
}

export async function getGenres() {
  const { scrapeGenreList } = lazyScrapers.genre();
  return wrap(await scrapeGenreList());
}

export async function getGenreSlug(slug: string, page = 1) {
  const { scrapeGenreAnime } = lazyScrapers.genre();
  return wrap(await scrapeGenreAnime(slug, page));
}

export async function getStudios() {
  const { scrapeStudioList } = lazyScrapers.studio();
  return wrap(await scrapeStudioList());
}

export async function getStudioSlug(slug: string, page = 1) {
  const { scrapeStudioAnime } = lazyScrapers.studio();
  return wrap(await scrapeStudioAnime(slug, page));
}

export async function getProducers() {
  const { scrapeProducerList } = lazyScrapers.producer();
  return wrap(await scrapeProducerList());
}

export async function getProducerSlug(slug: string, page = 1) {
  const { scrapeProducerAnime } = lazyScrapers.producer();
  return wrap(await scrapeProducerAnime(slug, page));
}

export async function getMangaDetail(url: string) {
  const { scrapeMangaDetail } = lazyScrapers.mangaDetail();
  return wrap(await scrapeMangaDetail(url));
}

export async function getMangaGenreSlug(slug: string, page = 1) {
  const { scrapeMangaGenre } = lazyScrapers.mangaGenre();
  return wrap(await scrapeMangaGenre(slug, page));
}

export async function getMangaRead(url: string) {
  const { scrapeMangaRead } = lazyScrapers.mangaRead();
  return wrap(await scrapeMangaRead(url));
}
