import { NextRequest } from 'next/server';
import { ok, err, handleError } from '@/lib/api-helpers';
const { scrapeMangaDetail } = require('@/lib/scrapers/mangaDetailParser');

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return err('MISSING_PARAM', 'Parameter "url" wajib diisi', 400);
    const data = await scrapeMangaDetail(url);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
