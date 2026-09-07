import { ok, handleError } from '@/lib/api-helpers';
const { scrapeProducerList } = require('@/lib/scrapers/producerParser');

export async function GET() {
  try {
    const data = await scrapeProducerList();
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
