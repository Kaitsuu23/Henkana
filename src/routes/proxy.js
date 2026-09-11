const express = require('express');
const axios   = require('axios');
const router  = express.Router();

const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

/**
 * GET /api/proxy/hls?url=https://cdn.../index.m3u8
 *
 * Proxy HLS manifest dan segments untuk menghindari CORS.
 * Rewrite URL segment relatif dalam manifest menjadi absolute proxy URL.
 */
router.get('/hls', async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Parameter url wajib diisi' } });
    }

    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'URL tidak valid' } });
    }

    const r = await axios.get(url, {
      timeout    : 15000,
      responseType: 'arraybuffer',
      headers    : {
        'User-Agent'  : UA,
        'Referer'     : BASE_URL,
        'Origin'      : BASE_URL,
      },
      maxRedirects: 5,
    });

    const contentType = r.headers['content-type'] || '';
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Headers', 'Range');

    // Kalau manifest (.m3u8) — rewrite URL segment
    if (
      contentType.includes('mpegurl') ||
      contentType.includes('x-mpegurl') ||
      url.includes('.m3u8')
    ) {
      let text    = Buffer.from(r.data).toString('utf8');
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);
      const proto = String(req.get('x-forwarded-proto') || req.protocol || 'https')
        .split(',')[0].trim();
      const host = String(req.get('x-forwarded-host') || req.get('host') || '')
        .split(',')[0].trim();
      const origin = host ? `${proto}://${host}` : '';

      const toProxy = (abs) => {
        const path = `/api/proxy/hls?url=${encodeURIComponent(abs)}`;
        return origin ? `${origin}${path}` : path;
      };
      const resolve = (uri) => {
        if (/^https?:\/\//i.test(uri)) return uri;
        try { return new URL(uri, url).href; } catch { return baseUrl + uri; }
      };

      // Master playlist: keep only the highest RESOLUTION / BANDWIDTH variant
      // so ExoPlayer tidak stuck di rendition 240p/360p lewat proxy lambat.
      if (/#EXT-X-STREAM-INF/i.test(text)) {
        const lines = text.split(/\r?\n/);
        const variants = [];
        for (let i = 0; i < lines.length; i++) {
          const t = lines[i].trim();
          if (!t.startsWith('#EXT-X-STREAM-INF')) continue;
          const bw = parseInt((t.match(/BANDWIDTH=(\d+)/i) || [])[1] || '0', 10);
          const resM = t.match(/RESOLUTION=(\d+)x(\d+)/i);
          const pixels = resM ? Number(resM[1]) * Number(resM[2]) : 0;
          let uri = '';
          for (let j = i + 1; j < lines.length; j++) {
            const n = lines[j].trim();
            if (!n || n.startsWith('#')) continue;
            uri = n;
            break;
          }
          if (uri) variants.push({ bw, pixels, uri, inf: lines[i] });
        }
        if (variants.length > 1) {
          variants.sort((a, b) => (b.pixels - a.pixels) || (b.bw - a.bw));
          const best = variants[0];
          const kept = [];
          for (const line of lines) {
            const t = line.trim();
            if (
              t.startsWith('#EXTM3U') ||
              t.startsWith('#EXT-X-VERSION') ||
              t.startsWith('#EXT-X-INDEPENDENT-SEGMENTS') ||
              t.startsWith('#EXT-X-MEDIA:')
            ) {
              kept.push(line.replace(/URI="([^"]+)"/g, (_, u) => `URI="${toProxy(resolve(u))}"`));
            }
          }
          if (!kept.some((l) => l.trim().startsWith('#EXTM3U'))) kept.unshift('#EXTM3U');
          kept.push(best.inf);
          kept.push(toProxy(resolve(best.uri)));
          text = kept.join('\n') + '\n';
        }
      }

      const rewritten = text
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed) return line;
          if (trimmed.startsWith('#')) {
            return line.replace(/URI="([^"]+)"/g, (_, u) => {
              if (String(u).includes('/api/proxy/hls')) return `URI="${u}"`;
              return `URI="${toProxy(resolve(u))}"`;
            });
          }
          if (trimmed.includes('/api/proxy/hls')) return line;
          const absUrl = resolve(trimmed);
          return toProxy(absUrl);
        })
        .join('\n');

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
      res.set('Cache-Control', 'no-store');
      return res.send(rewritten);
    }

    // Segment (.ts) atau lainnya — stream langsung
    res.set('Content-Type', contentType || 'video/MP2T');
    return res.send(r.data);

  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Resource tidak ditemukan' } });
    }
    next(err);
  }
});

/**
 * GET /api/proxy/image?url=https://img.hentaicop.net/...
 *
 * Proxy gambar manga untuk bypass hotlink protection.
 */
router.get('/image', async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'Parameter url wajib diisi' } });
    }

    let targetUrl;
    try {
      targetUrl = new URL(url);
    } catch {
      return res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'URL tidak valid' } });
    }

    // Hanya izinkan domain yang terkait hentaicop
    const allowed = ['img.hentaicop.net', 'hentaicop.com', 'cdn.hentaicop.net'];
    if (!allowed.some(d => targetUrl.hostname.endsWith(d))) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Domain tidak diizinkan' } });
    }

    const r = await axios.get(url, {
      timeout     : 15000,
      responseType: 'arraybuffer',
      headers     : {
        'User-Agent': UA,
        'Referer'   : BASE_URL,
        'Accept'    : 'image/webp,image/avif,image/*,*/*;q=0.8',
      },
      maxRedirects: 5,
    });

    const contentType = r.headers['content-type'] || 'image/jpeg';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'public, max-age=86400'); // cache 24 jam
    res.set('Access-Control-Allow-Origin', '*');
    return res.send(r.data);

  } catch (err) {
    if (err.response?.status === 404) {
      return res.status(404).end();
    }
    next(err);
  }
});

module.exports = router;
