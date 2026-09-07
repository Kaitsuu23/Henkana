const cheerio = require('cheerio');
const { fetchHTML } = require('../utils/fetcher');

const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';

function cleanText(text) {
  return text ? text.replace(/\s+/g, ' ').trim() : null;
}

function toAbsoluteURL(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Decode base64 value dari .mirror <option> lalu ekstrak iframe src
 * Format decoded: "ServerName <iframe ... src="URL" ...></iframe>"
 *
 * Di hentaicop.com embed URL bisa berupa path relatif (/play.php?id=...)
 * sehingga perlu di-convert ke absolute.
 *
 * @param {string} label - nama server dari teks option
 * @param {string} b64   - base64 string dari attribute value
 * @returns {{ name: string, embedUrl: string } | null}
 */
function decodeServerOption(label, b64) {
  try {
    const decoded  = Buffer.from(b64, 'base64').toString('utf8');
    const match    = decoded.match(/src=["']([^"']+)["']/);
    if (!match) return null;

    const embedUrl = toAbsoluteURL(match[1]);
    return {
      name    : cleanText(label) || 'Unknown',
      embedUrl,
    };
  } catch {
    return null;
  }
}

/**
 * Scrape halaman watch/episode hentaicop.com
 *
 * Selector yang digunakan:
 *   title         : .entry-title
 *   series title  : .single-info.bixbox .infox h2
 *   series url    : .naveps a[aria-label="Semua Episode"][href]
 *   series thumb  : .single-info.bixbox .thumb img[src]
 *   servers       : .mirror option[value!=""] → base64 decode → iframe src
 *   active embed  : .player-embed iframe[src]  (absolute dari BASE_URL)
 *   prev episode  : .naveps .nvs:first-child a[href]  (null jika .nolink)
 *   next episode  : .naveps a[aria-label="next"][href]
 *
 * @param {string} url - URL halaman episode
 */
async function scrapeWatch(url) {
  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  // ── Episode title ──────────────────────────────────────────
  const title = cleanText($('.entry-title').text()) || null;

  // ── Series info (.single-info.bixbox) ─────────────────────
  const $info       = $('.single-info.bixbox');
  const seriesTitle = cleanText($info.find('.infox h2').text()) || null;
  const seriesUrl   = toAbsoluteURL(
    $('.naveps a[aria-label="Semua Episode"]').attr('href') || null
  );
  const seriesThumb =
    $info.find('.thumb img').attr('src') ||
    $info.find('.thumb img').attr('data-src') ||
    null;

  // ── Server list dari .mirror select ───────────────────────
  const servers = [];
  $('.mirror option').each((_, opt) => {
    const val   = ($(opt).attr('value') || '').trim();
    const label = cleanText($(opt).text()) || '';

    // Skip placeholder kosong
    if (!val || val === '') return;

    const server = decodeServerOption(label, val);
    if (server) servers.push(server);
  });

  // ── Active/default embed ───────────────────────────────────
  // iframe yang sudah di-render di .player-embed — URL bisa relatif
  const rawEmbed =
    $('.player-embed iframe').attr('src') ||
    servers[0]?.embedUrl ||
    null;
  const activeEmbed = toAbsoluteURL(rawEmbed);

  // ── Navigasi prev / next ───────────────────────────────────
  const $nav = $('.naveps');

  // prev: .nvs:first-child — jika ada span.nolink berarti tidak ada prev
  const $prevNvs = $nav.find('.nvs').first();
  const prevUrl  = $prevNvs.find('span.nolink').length === 0
    ? toAbsoluteURL($prevNvs.find('a').attr('href') || null)
    : null;

  const nextUrl = toAbsoluteURL(
    $nav.find('a[aria-label="next"]').attr('href') || null
  );

  // ── Download table ─────────────────────────────────────────
  // Struktur: table > tbody > tr (skip header) > td[0]=server td[1]=quality td[2]=size td[3]=link
  // Quality cell menyisipkan span invisible "-Hentaicop-" di tengah teks (720 + span + p = "720p")
  const downloads = [];
  $('table tr').each((i, row) => {
    if (i === 0) return; // skip header

    const tds  = $(row).find('td');
    if (tds.length < 4) return;

    // Server: teks td[0] tanpa badge
    const serverName  = cleanText($(tds[0]).clone().find('span').remove().end().text()) || null;
    const serverBadge = cleanText($(tds[0]).find('span').text()) || null;

    // Quality: strip invisible span lalu gabungkan teks yang tersisa
    const $qualTd = $(tds[1]).clone();
    $qualTd.find('span[style*="display:inline-block"]').remove();
    const quality = cleanText($qualTd.text()) || null;

    const size    = cleanText($(tds[2]).text()) || null;
    const dlUrl   = $(tds[3]).find('a').attr('href') || null;

    if (serverName && dlUrl) {
      downloads.push({
        server : serverBadge ? `${serverName} (${serverBadge})` : serverName,
        quality,
        size,
        url    : dlUrl,
      });
    }
  });

  if (!title && servers.length === 0 && downloads.length === 0) {
    const err = new Error('Data halaman episode tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    title,
    series: {
      title    : seriesTitle,
      url      : seriesUrl,
      thumbnail: seriesThumb,
    },
    activeEmbed,
    servers,
    downloads,
    navigation: {
      prev: prevUrl,
      next: nextUrl,
    },
  };
}

module.exports = { scrapeWatch };
