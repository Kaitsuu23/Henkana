import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-helpers';
const { scrapeSeries } = require('@/lib/scrapers/seriesParser');

export async function GET(req: NextRequest) {
  try {
    const sp = req.nextUrl.searchParams;

    const opts = {
      genre : sp.getAll('genre[]').length ? sp.getAll('genre[]') : (sp.get('genre') ? [sp.get('genre')] : []),
      season: sp.getAll('season[]').length ? sp.getAll('season[]') : (sp.get('season') ? [sp.get('season')] : []),
      studio: sp.getAll('studio[]').length ? sp.getAll('studio[]') : (sp.get('studio') ? [sp.get('studio')] : []),
      status: sp.get('status') || '',
      type  : sp.get('type') || '',
      sub   : sp.get('sub') || '',
      order : sp.get('order') || '',
      page  : parseInt(sp.get('page') || '1') || 1,
    };

    const data = await scrapeSeries(opts);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
