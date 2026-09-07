import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-helpers';
const { scrapeManga } = require('@/lib/scrapers/mangaParser');

export async function GET(req: NextRequest) {
  try {
    const page = parseInt(req.nextUrl.searchParams.get('page') || '1') || 1;
    const data = await scrapeManga(page);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
