import { ok, handleError } from '@/lib/api-helpers';
const { scrapeSeriesFilters } = require('@/lib/scrapers/seriesParser');

export async function GET() {
  try {
    const data = await scrapeSeriesFilters();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
