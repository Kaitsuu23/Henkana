import { ok, handleError } from '@/lib/api-helpers';
const { scrapeStudioList } = require('@/lib/scrapers/studioParser');

export async function GET() {
  try {
    const data = await scrapeStudioList();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
