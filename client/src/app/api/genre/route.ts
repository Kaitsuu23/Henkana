import { ok, handleError } from '@/lib/api-helpers';
const { scrapeGenreList } = require('@/lib/scrapers/genreParser');

export async function GET() {
  try {
    const data = await scrapeGenreList();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
