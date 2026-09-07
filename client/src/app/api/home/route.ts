import { ok, handleError } from '@/lib/api-helpers';
const { scrapeHome } = require('@/lib/scrapers/homeParser');

export async function GET() {
  try {
    const data = await scrapeHome();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
