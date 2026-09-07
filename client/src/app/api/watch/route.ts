import { NextRequest } from 'next/server';
import { ok, err, handleError } from '@/lib/api-helpers';
const { scrapeWatch } = require('@/lib/scrapers/watchParser');
const { extractStreamFromEmbed } = require('@/lib/scrapers/playerParser');

export async function GET(req: NextRequest) {
  try {
    const url = req.nextUrl.searchParams.get('url');
    if (!url) return err('MISSING_PARAM', 'Parameter "url" wajib diisi', 400);

    const data = await scrapeWatch(url);

    // Extract stream dari semua server secara paralel
    const streamResults = await Promise.allSettled(
      (data.servers as { name: string; embedUrl: string }[]).map(async (server) => {
        const stream = await extractStreamFromEmbed(server.embedUrl);
        return { server: server.name, embedUrl: server.embedUrl, ...stream };
      })
    );

    const streams = streamResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<any>).value);

    return ok({ success: true, ...data, streams });
  } catch (e) { return handleError(e); }
}
