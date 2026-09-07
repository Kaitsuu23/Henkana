import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-helpers';
const { scrapeDoujinshi } = require('@/lib/scrapers/doujinshiParser');

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1') || 1;
    const data = await scrapeDoujinshi(page);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
