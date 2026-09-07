import { NextRequest } from 'next/server';
import { ok, handleError } from '@/lib/api-helpers';
const { scrapeListMode } = require('@/lib/scrapers/listModeParser');

export async function GET(req: NextRequest) {
  try {
    const title = req.nextUrl.searchParams.get('title') || '';
    const data = await scrapeListMode(title);
    return ok({ success: true, ...data });
  } catch (e) { return handleError(e); }
}
