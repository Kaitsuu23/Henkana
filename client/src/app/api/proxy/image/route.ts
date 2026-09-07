import { NextRequest } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const ALLOWED_HOSTS = [
  'img.hentaicop.net',
  'i.hentaicop.net',
  'cdn.hentaicop.com',
  'hentaicop.com',
  'i0.wp.com',
  'i1.wp.com',
  'i2.wp.com',
  'i3.wp.com',
];

/**
 * Image proxy — fetches an image from an allowed host and forwards it with
 * appropriate cache headers, bypassing hotlink-protection on source site.
 *
 * Usage:
 *   /api/proxy/image?url=https%3A%2F%2Fimg.hentaicop.net%2Fcover.jpg
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('url');
  if (!raw) {
    return new Response(JSON.stringify({ error: 'Missing url param' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let targetUrl: URL;
  try {
    targetUrl = new URL(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid url' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Only proxy from allowed hosts (SSRF protection)
  const host = targetUrl.hostname.toLowerCase();
  const allowed = ALLOWED_HOSTS.some(
    (h) => host === h || host.endsWith('.' + h)
  );
  if (!allowed) {
    return new Response(JSON.stringify({ error: 'Host not allowed' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(raw, {
      headers: {
        'User-Agent': UA,
        Referer     : 'https://hentaicop.com/',
        Accept      : 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
    });

    if (!upstream.ok) {
      return new Response(`Upstream error ${upstream.status}`, { status: upstream.status });
    }

    const body        = await upstream.arrayBuffer();
    const contentType = upstream.headers.get('content-type') || 'image/jpeg';

    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type'               : contentType,
        'Cache-Control'              : 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
        'X-Proxy-Host'               : host,
      },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
