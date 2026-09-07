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
 * Scrape halaman detail manga dari hentaicop.com
 * URL format: /manga/:slug/
 *
 * HTML Structure (custom theme):
 *   .hc-manga-pro
 *     .hc-pro-left
 *       img.hc-pro-cover-img      → thumbnail
 *       h1.hc-pro-title           → title
 *       .hc-pro-alt-title         → alt title
 *       .hc-badge-type            → type (🇰🇷 Manhwa)
 *       .hc-badge-status          → status (OnGoing)
 *       a.hc-pro-btn-read[href]   → first chapter URL
 *     .hc-pro-right
 *       .hc-info-row              → info fields (Type, Status, Authors, dll)
 *       .hc-pro-genres a          → genres
 *       .hc-rating-num            → rating
 *       .hc-synopsis .content     → synopsis
 *       .hc-ms-card               → related manga
 *   .hc-chapter-section
 *     .hc-chapter-item            → chapter list
 */
async function scrapeMangaDetail(url) {
  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  // ── Title ──────────────────────────────────────────────────
  const title = cleanText($('h1.hc-pro-title').text()) ||
                cleanText($('h1').first().text()) || null;

  // ── Thumbnail ──────────────────────────────────────────────
  const thumbnail = $('img.hc-pro-cover-img').attr('src') ||
                    $('.hc-pro-cover-box img').first().attr('src') || null;

  // ── Alt title ─────────────────────────────────────────────
  const altTitleRaw = cleanText($('.hc-pro-alt-title').text());
  const altTitle = altTitleRaw && altTitleRaw !== 'No alternative title' ? altTitleRaw : null;

  // ── Badges ────────────────────────────────────────────────
  const type   = cleanText($('.hc-badge-type').text()) || null;
  const status = cleanText($('.hc-badge-status').clone().find('i').remove().end().text()) || null;

  // ── First chapter URL ─────────────────────────────────────
  const firstChapterUrl = toAbsoluteURL($('a.hc-pro-btn-read').attr('href') || null);

  // ── Info rows ─────────────────────────────────────────────
  const info = {};
  $('.hc-info-row').each((_, row) => {
    const label = cleanText($(row).find('.hc-info-label').text())?.toLowerCase() || '';
    const val   = cleanText($(row).find('.hc-info-val').clone().find('i').remove().end().text());
    if (label && val && val !== 'N/A') info[label] = val;
  });

  // ── Genres ────────────────────────────────────────────────
  const genres = [];
  $('.hc-pro-genres a').each((_, a) => {
    const name = cleanText($(a).text());
    const href = toAbsoluteURL($(a).attr('href') || null);
    if (name) genres.push({ name, url: href });
  });

  // ── Rating ────────────────────────────────────────────────
  const rating = cleanText($('.hc-rating-num').text()) || null;

  // ── Synopsis ──────────────────────────────────────────────
  const synopsis = cleanText($('.hc-synopsis .content').text()) ||
                   cleanText($('[class*="synopsis"]').first().text()) || null;

  // ── Chapter list ──────────────────────────────────────────
  const chapters = [];
  $('.hc-chapter-item').each((_, item) => {
    const $item  = $(item);
    const $link  = $item.find('a.hc-chap-title');
    const chUrl  = toAbsoluteURL($link.attr('href') || null);
    const chTitle = cleanText($link.text()) || null;
    const chNum  = cleanText($item.find('.hc-chap-num-box .num').text()) || null;
    const isNew  = $item.find('.hc-chap-new').length > 0;
    const meta   = $item.find('.hc-chap-meta span').map((_, s) => cleanText($(s).text())).get();
    const date   = meta.find(m => m && !/^\d+$/.test(m) && !m.includes('👁')) || null;
    const views  = cleanText($item.find('.hc-chap-meta .fa-eye').parent().text()) || null;

    if (chUrl) chapters.push({ number: chNum, title: chTitle, url: chUrl, date, views, isNew });
  });

  // ── Related manga ─────────────────────────────────────────
  const related = [];
  $('.hc-ms-card').each((_, card) => {
    const $c   = $(card);
    // .hc-ms-card IS the <a> tag itself
    const href = toAbsoluteURL($c.attr('href') || null);
    const img  = $c.find('img').first().attr('src') || null;
    const name = cleanText($c.find('.hc-ms-title').text()) || null;
    const badge = cleanText($c.find('.hc-ms-badge').clone().find('style').remove().end().text()) || null;

    let slug = null;
    try {
      const u = new URL(href || '');
      if (u.pathname.startsWith('/manga/')) slug = u.pathname.split('/')[2];
    } catch {}

    if (name && href) related.push({ title: name, thumbnail: img, url: href, slug, badge });
  });

  if (!title) {
    const err = new Error('Data manga tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    title,
    thumbnail,
    altTitle,
    type,
    status,
    firstChapterUrl,
    info,
    genres,
    rating,
    synopsis,
    chapters: {
      total: chapters.length,
      list : chapters,
    },
    related,
  };
}

module.exports = { scrapeMangaDetail };
