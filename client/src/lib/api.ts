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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrap(data: any): any {
  if (data && typeof data === 'object' && 'success' in data) return data;
  return { success: true, ...data };
}

// ── Lazy scraper imports ──────────────────────────────────────
/* eslint-disable @typescript-eslint/no-require-imports */
const s = {
  home       : () => require('./scrapers/homeParser'),
  search     : () => require('./scrapers/searchParser'),
  detail     : () => require('./scrapers/detailParser'),
  sidebar    : () => require('./scrapers/sidebarParser'),
  tooltip    : () => require('./scrapers/tooltipParser'),
  manga      : () => require('./scrapers/mangaParser'),
  manhwa     : () => require('./scrapers/manhwaParser'),
  doujinshi  : () => require('./scrapers/doujinshiParser'),
  listing    : () => require('./scrapers/listingParser'),
  watch      : () => require('./scrapers/watchParser'),
  series     : () => require('./scrapers/seriesParser'),
  genre      : () => require('./scrapers/genreParser'),
  studio     : () => require('./scrapers/studioParser'),
  producer   : () => require('./scrapers/producerParser'),
  listMode   : () => require('./scrapers/listModeParser'),
  mangaDetail: () => require('./scrapers/mangaDetailParser'),
  mangaGenre : () => require('./scrapers/mangaGenreParser'),
  mangaRead  : () => require('./scrapers/mangaReadParser'),
};
/* eslint-enable @typescript-eslint/no-require-imports */

// ── Public API ────────────────────────────────────────────────

export async function getHome() {
  return wrap(await s.home().scrapeHome());
}

export async function getSearch(query: string, page = 1) {
  return wrap(await s.search().scrapeSearch(query, page));
}

export async function getDetail(url: string) {
  return wrap(await s.detail().scrapeDetail(url));
}

export async function getSidebar() {
  return wrap(await s.sidebar().scrapeSidebar());
}

// Basic watch info only — stream extraction happens client-side via /api/watch.
export async function getWatch(url: string) {
  return wrap(await s.watch().scrapeWatch(url));
}

export async function getHentai(page = 1) {
  return wrap(await s.listing().scrapeListing('hentai', page));
}

export async function get2D(page = 1) {
  return wrap(await s.listing().scrapeListing('2d', page));
}

export async function getJav(page = 1) {
  return wrap(await s.listing().scrapeListing('jav', page));
}

export async function getUncensored(page = 1) {
  return wrap(await s.listing().scrapeListing('uncensored', page));
}

export async function getManga(page = 1) {
  return wrap(await s.manga().scrapeManga(page));
}

export async function getManhwa(page = 1) {
  return wrap(await s.manhwa().scrapeManhwa(page));
}

export async function getDoujinshi(page = 1) {
  return wrap(await s.doujinshi().scrapeDoujinshi(page));
}

export async function getSeries(params: Record<string, string | number | string[]>) {
  return wrap(await s.series().scrapeSeries(params));
}

export async function getSeriesFilters() {
  return wrap(await s.series().scrapeSeriesFilters());
}

export async function getListMode(title = '') {
  return wrap(await s.listMode().scrapeListMode(title));
}

export async function getGenres() {
  return wrap(await s.genre().scrapeGenreList());
}

export async function getGenreSlug(slug: string, page = 1) {
  return wrap(await s.genre().scrapeGenreAnime(slug, page));
}

export async function getStudios() {
  return wrap(await s.studio().scrapeStudioList());
}

export async function getStudioSlug(slug: string, page = 1) {
  return wrap(await s.studio().scrapeStudioAnime(slug, page));
}

export async function getProducers() {
  return wrap(await s.producer().scrapeProducerList());
}

export async function getProducerSlug(slug: string, page = 1) {
  return wrap(await s.producer().scrapeProducerAnime(slug, page));
}

export async function getMangaDetail(url: string) {
  return wrap(await s.mangaDetail().scrapeMangaDetail(url));
}

export async function getMangaGenreSlug(slug: string, page = 1) {
  return wrap(await s.mangaGenre().scrapeMangaGenre(slug, page));
}

export async function getMangaRead(url: string) {
  return wrap(await s.mangaRead().scrapeMangaRead(url));
}
