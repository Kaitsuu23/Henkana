import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-helpers';
const { scrapeProducerAnime } = require('@/lib/scrapers/producerParser');

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1') || 1;
    const data = await scrapeProducerAnime(slug, page);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
