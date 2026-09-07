const axios   = require('axios');
const cheerio = require('cheerio');

const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

// ─────────────────────────────────────────────────────────────
// Decode helpers
// ─────────────────────────────────────────────────────────────

/**
 * Decode var p dari play.php.
 * Algoritma (visible di source play.php):
 *   d1 = p.split("").reverse().join("")
 *   d2 = atob(d1)
 *   d3 = decodeURIComponent(d2)
 */
function decodeVarP(p) {
  const d1 = p.split('').reverse().join('');
  const d2 = Buffer.from(d1, 'base64').toString('utf8');
  return decodeURIComponent(d2);
}

/**
 * Parse jwplayer sources dari decoded JS (var kodeRHS).
 * Mencari pattern "file":"https:\/\/...m3u8..." dengan escaped slashes.
 */
function parseSourcesFromJs(jsCode) {
  const sources = [];
  let hlsUrl = null;

  // Regex "file":"..." dengan escaped slashes
  const fileRe = /"file"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m;
  while ((m = fileRe.exec(jsCode)) !== null) {
    const file = m[1].replace(/\\\//g, '/');
    if (!file || /jwpltx|ping\.gif/i.test(file)) continue;
    const type = /\.m3u8/i.test(file) ? 'hls' : /\.mp4/i.test(file) ? 'mp4' : null;
    if (!type) continue;
    if (!hlsUrl && type === 'hls') hlsUrl = file;
    if (!sources.find(s => s.file === file)) sources.push({ type, file });
  }

  // Fallback: eval config object jika regex tidak cukup
  if (!hlsUrl) {
    const configMatch = jsCode.match(/var\s+config\s*=\s*(\{[\s\S]*?\n\s*\})\s*;/);
    if (configMatch) {
      try {
        // eslint-disable-next-line no-new-func
        const config = Function('"use strict"; return (' + configMatch[1].replace(/\\\//g, '/') + ')')();
        for (const s of (config.sources || [])) {
          if (!s.file) continue;
          const type = /\.m3u8/i.test(s.file) ? 'hls' : /\.mp4/i.test(s.file) ? 'mp4' : null;
          if (!type) continue;
          if (!hlsUrl && type === 'hls') hlsUrl = s.file;
          if (!sources.find(x => x.file === s.file)) sources.push({ type, label: s.label || null, file: s.file });
        }
      } catch { /* ignore */ }
    }
  }

  return { hlsUrl, sources };
}

// ─────────────────────────────────────────────────────────────
// Ambil embed URL dari halaman episode
// ─────────────────────────────────────────────────────────────

async function getEmbedUrl(episodeUrl, quality) {
  const r = await axios.get(episodeUrl, {
    timeout: 15000,
    headers: { 'User-Agent': UA, Referer: BASE_URL },
    maxRedirects: 5,
  });
  const $ = cheerio.load(r.data);

  let targetUrl = null;

  $('.mirror option').each((_, opt) => {
    const val   = ($(opt).attr('value') || '').trim();
    const label = ($(opt).text() || '').trim();
    if (!val) return;
    try {
      const decoded = Buffer.from(val, 'base64').toString('utf8');
      const match   = decoded.match(/src=["']([^"']+)["']/);
      if (!match) return;
      const full = match[1].startsWith('http') ? match[1] : `${BASE_URL}${match[1]}`;
      if (!targetUrl) targetUrl = full;
      if (quality && quality !== '720p' && label.includes(quality)) targetUrl = full;
    } catch {}
  });

  // Fallback ke iframe aktif
  if (!targetUrl) {
    const src = $('iframe[src]').first().attr('src');
    targetUrl = src ? (src.startsWith('http') ? src : `${BASE_URL}${src}`) : null;
  }

  return targetUrl;
}

// ─────────────────────────────────────────────────────────────
// Main: extract stream via HTTP
// ─────────────────────────────────────────────────────────────

/**
 * Ekstrak HLS dari embed URL (play.php) secara langsung.
 * Bisa di-call dengan embed URL yang sudah diketahui.
 */
async function extractStreamFromEmbed(embedUrl) {
  if (!embedUrl) {
    const err = new Error('Embed URL tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const r = await axios.get(embedUrl, {
    timeout: 15000,
    headers: { 'User-Agent': UA, Referer: BASE_URL },
    maxRedirects: 5,
  });

  const pMatch = r.data.match(/var\s+p\s*=\s*"([^"]+)"/);
  if (!pMatch) {
    const err = new Error('Format player tidak dikenali (var p tidak ditemukan)');
    err.statusCode = 502;
    err.code = 'PARSE_ERROR';
    throw err;
  }
  const playerHtml = decodeVarP(pMatch[1]);

  const kodeMatch = playerHtml.match(/var\s+kodeRHS\s*=\s*"([^"]+)"/);
  if (!kodeMatch) {
    const err = new Error('Format player tidak dikenali (var kodeRHS tidak ditemukan)');
    err.statusCode = 502;
    err.code = 'PARSE_ERROR';
    throw err;
  }
  const jsCode = Buffer.from(kodeMatch[1], 'base64').toString('utf8');
  return parseSourcesFromJs(jsCode);
}

/**
 * Ekstrak HLS stream dari halaman episode (dengan quality selector).
 */
async function extractStreamUrl(episodeUrl, quality = '720p') {
  const embedUrl = await getEmbedUrl(episodeUrl, quality);
  const result   = await extractStreamFromEmbed(embedUrl);

  if (!result.hlsUrl) {
    const err = new Error('HLS URL tidak ditemukan di player config');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    method : 'http',
    quality,
    hlsUrl : result.hlsUrl,
    sources: result.sources,
    note   : 'URL HLS bersifat signed dan akan expired dalam beberapa jam',
  };
}

module.exports = { extractStreamUrl, extractStreamFromEmbed };
