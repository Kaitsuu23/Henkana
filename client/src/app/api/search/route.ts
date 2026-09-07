import { NextRequest } from 'next/server';
import { ok, err, handleError } from '@/lib/api-helpers';
const { scrapeSearch } = require('@/lib/scrapers/searchParser');

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q    = searchParams.get('q') || '';
    const page = parseInt(searchParams.get('page') || '1') || 1;

    if (!q || q.trim().length < 2)
      return err('BAD_REQUEST', 'Parameter q minimal 2 karakter', 400);

    const data = await scrapeSearch(q.trim(), page);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
