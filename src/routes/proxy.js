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
      const text    = Buffer.from(r.data).toString('utf8');
      const baseUrl = url.substring(0, url.lastIndexOf('/') + 1);

      // Rewrite setiap baris yang bukan komentar dan bukan absolute URL
      const rewritten = text
        .split('\n')
        .map(line => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith('#')) return line;
          // Absolute URL — wrap ke proxy
          const absUrl = trimmed.startsWith('http') ? trimmed : baseUrl + trimmed;
          return `/api/proxy/hls?url=${encodeURIComponent(absUrl)}`;
        })
        .join('\n');

      res.set('Content-Type', 'application/vnd.apple.mpegurl');
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
