import { ok, handleError } from '@/lib/api-helpers';
const { scrapeMangaGenreList } = require('@/lib/scrapers/mangaGenreParser');

export async function GET() {
  try {
    const data = await scrapeMangaGenreList();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
