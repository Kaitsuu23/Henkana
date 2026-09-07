import { NextRequest } from 'next/server';
import { ok, err, handleError } from '@/lib/api-helpers';
const { scrapeTooltip } = require('@/lib/scrapers/tooltipParser');

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!id || !/^\d+$/.test(id))
      return err('BAD_REQUEST', 'ID harus berupa angka', 400);
    const data = await scrapeTooltip(id);
    return ok({ success: true, data });
  } catch (e) { return handleError(e); }
}
