import { NextRequest } from 'next/server';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * HLS proxy — fetches an m3u8 (or TS segment) and rewrites every relative
 * segment / sub-playlist URL so it also goes through this proxy.
 *
 * Usage:
 *   /api/proxy/hls?url=https%3A%2F%2Fcdn.example.com%2Fstream.m3u8
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

  // Block SSRF to local/private ranges
  const host = targetUrl.hostname.toLowerCase();
  const blocked = ['localhost', '127.0.0.1', '0.0.0.0', '::1'];
  if (blocked.includes(host) || host.startsWith('192.168.') || host.startsWith('10.')) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const upstream = await fetch(raw, {
      headers: {
        'User-Agent': UA,
        Referer: `${targetUrl.protocol}//${targetUrl.host}/`,
        Origin : `${targetUrl.protocol}//${targetUrl.host}`,
      },
      cache: 'no-store',
    });

    if (!upstream.ok) {
      return new Response(`Upstream error ${upstream.status}`, { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';

    // ── TS segment / non-text — stream directly ──────────────
    if (!contentType.includes('application/vnd.apple.mpegurl') &&
        !contentType.includes('application/x-mpegurl') &&
        !contentType.includes('text/plain') &&
        !raw.endsWith('.m3u8') &&
        !raw.endsWith('.m3u')) {

      const body = await upstream.arrayBuffer();
      return new Response(body, {
        status: 200,
        headers: {
          'Content-Type'  : contentType || 'video/MP2T',
          'Cache-Control' : 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // ── m3u8 — rewrite URLs ───────────────────────────────────
    const text  = await upstream.text();
    const base  = new URL(raw); // origin URL for resolving relative paths
    const proxyBase = req.nextUrl.origin + '/api/proxy/hls?url=';

    const rewritten = text
      .split('\n')
      .map((line) => {
        const trimmed = line.trim();

        // Comment / tag lines — only rewrite URI= attributes
        if (trimmed.startsWith('#')) {
          return line.replace(/URI="([^"]+)"/g, (_m, uri) => {
            const abs = resolveUrl(uri, base);
            return `URI="${proxyBase}${encodeURIComponent(abs)}"`;
          });
        }

        // Blank lines
        if (!trimmed) return line;

        // Segment / sub-playlist lines
        const abs = resolveUrl(trimmed, base);
        return `${proxyBase}${encodeURIComponent(abs)}`;
      })
      .join('\n');

    return new Response(rewritten, {
      status: 200,
      headers: {
        'Content-Type'  : 'application/vnd.apple.mpegurl',
        'Cache-Control' : 'no-cache, no-store, must-revalidate',
        'Access-Control-Allow-Origin': '*',
      },
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || 'Proxy error' }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/** Resolve a potentially-relative URL against a base URL */
function resolveUrl(href: string, base: URL): string {
  if (href.startsWith('http://') || href.startsWith('https://')) return href;
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}
