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
 * Parse satu card manga dari article.bs
 * HTML: article.bs > .bsx > .limit
 *   > a.img-link[href][title] + img[src]
 *   > a.type[href][class]  → "🇰🇷 Manhwa" / "Manga"
 *   > .tt > h4 > a[title]
 *   > .hc-arc-chaps > .hc-arc-chap-item > a[href] + span.hc-arc-chap-date
 */
function parseMangaCard($, el) {
  const $c = $(el);

  const url       = toAbsoluteURL($c.find('a.img-link').attr('href') || $c.find('a').first().attr('href') || null);
  const thumbnail = $c.find('img').first().attr('src') || $c.find('img').first().attr('data-src') || null;
  const title     = cleanText($c.find('.tt h4 a').first().attr('title') || $c.find('.tt h4 a').first().text()) || null;

  // type: "🇰🇷 Manhwa", "Manga", dll dari a.type
  const $typeEl = $c.find('a.type').first();
  const type    = cleanText($typeEl.text()) || null;
  const typeUrl = toAbsoluteURL($typeEl.attr('href') || null);

  // chapter list terbaru
  const chapters = [];
  $c.find('.hc-arc-chap-item').each((_, item) => {
    const $item  = $(item);
    const chUrl  = toAbsoluteURL($item.find('a').attr('href') || null);
    // Teks chapter — strip badge END jika ada
    const chText = cleanText($item.find('a').clone().find('span').remove().end().text()) || null;
    const badge  = cleanText($item.find('a span').text()) || null;
    const date   = cleanText($item.find('.hc-arc-chap-date').text()) || null;
    if (chText && chUrl) chapters.push({ chapter: chText, badge, url: chUrl, date });
  });

  return { title, thumbnail, url, type, typeUrl, latestChapters: chapters };
}

/**
 * Scrape halaman /manga/ dengan semua section + pagination.
 * URL: https://hentaicop.com/manga/
 *      https://hentaicop.com/manga/page/2/
 *
 * Section yang ada:
 *   - PALING POPULER      → tidak ada pagination / see more
 *   - LATEST UPDATE       → pagination hentaicop.com/manga/page/N/
 *   - DOUJINSHI & MANGA   → see more ke /?manga_type_tax=manga,doujinshi
 *   - MANHWA              → see more ke /manga-type/manhwa/
 *
 * @param {number} page - nomor halaman untuk LATEST UPDATE (default: 1)
 */
async function scrapeManga(page = 1) {
  const pageNum = parseInt(page) || 1;
  const url = pageNum > 1
    ? `${BASE_URL}/manga/page/${pageNum}/`
    : `${BASE_URL}/manga/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const sections = [];

  // Tiap .bixbox adalah satu section
  $('.bixbox').each((_, sectionEl) => {
    const $sec    = $(sectionEl);
    const heading = cleanText($sec.find('h1, h2, h3').first().text()) || null;

    const cards = [];
    $sec.find('article.bs').each((_, card) => {
      const parsed = parseMangaCard($, card);
      if (parsed.url) cards.push(parsed);
    });

    if (cards.length === 0) return;

    // ── Tentukan tipe pagination section ini ──────────────────
    const $pag      = $sec.find('.pagination');
    const $seeMore  = $pag.find('a.btn-see-more');
    const $pageNums = $pag.find('a.page-numbers');

    let pagination = null;
    let seeMore    = null;

    if ($seeMore.length > 0) {
      // Section dengan "SEE MORE" button
      seeMore = toAbsoluteURL($seeMore.attr('href'));
    } else if ($pageNums.length > 0) {
      // Section dengan pagination numerik (LATEST UPDATE)
      let totalPages = pageNum;
      $pageNums.each((_, a) => {
        const m = $(a).attr('href')?.match(/\/page\/(\d+)\//);
        if (m) {
          const n = parseInt(m[1]);
          if (n > totalPages) totalPages = n;
        }
      });
      pagination = {
        currentPage: pageNum,
        totalPages,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1,
        nextPage   : pageNum < totalPages ? `${BASE_URL}/manga/page/${pageNum + 1}/` : null,
        prevPage   : pageNum > 1 ? (pageNum - 1 === 1 ? `${BASE_URL}/manga/` : `${BASE_URL}/manga/page/${pageNum - 1}/`) : null,
      };
    }

    sections.push({
      section   : heading,
      total     : cards.length,
      pagination: pagination || null,
      seeMore   : seeMore || null,
      data      : cards,
    });
  });

  if (sections.length === 0 && pageNum === 1) {
    const err = new Error('Data manga tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    page         : pageNum,
    totalSections: sections.length,
    sections,
  };
}

module.exports = { scrapeManga };
