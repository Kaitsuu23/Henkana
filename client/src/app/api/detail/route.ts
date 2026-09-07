import { NextRequest } from 'next/server';
import { ok, err, handleError } from '@/lib/api-helpers';
const { scrapeDetail } = require('@/lib/scrapers/detailParser');

const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url') || '';
    if (!url) return err('BAD_REQUEST', 'Parameter url wajib diisi', 400);
    try {
      const u = new URL(url);
      if (u.hostname !== new URL(BASE_URL).hostname)
        return err('BAD_REQUEST', `URL harus dari domain ${new URL(BASE_URL).hostname}`, 400);
    } catch { return err('BAD_REQUEST', 'Format URL tidak valid', 400); }

    const data = await scrapeDetail(url);
    return ok({ success: true, data });
  } catch (e) { return handleError(e); }
}
