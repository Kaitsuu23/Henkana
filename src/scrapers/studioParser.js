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
 * Scrape daftar semua studio dari /studio/
 *
 * Selector:
 *   .postbody ul li > a[href]
 *     > span.name  → nama studio
 *     > span.count → jumlah anime
 *   slug dari href: /studio/:slug/
 *
 * @returns {Promise<Object>}
 */
async function scrapeStudioList() {
  const html = await fetchHTML(`${BASE_URL}/studio/`);
  const $    = cheerio.load(html);

  const studios = [];

  $('.postbody li').each((_, li) => {
    const $a    = $(li).find('a').first();
    const href  = $a.attr('href') || '';
    const name  = cleanText($a.find('span.name').text()) || cleanText($a.text()) || null;
    const countRaw = cleanText($a.find('span.count').text());
    const count = countRaw ? parseInt(countRaw) || countRaw : null;

    const slugMatch = href.match(/\/studio\/([\w-]+)\/?/);
    const slug      = slugMatch ? slugMatch[1] : null;

    if (name && slug) {
      studios.push({ name, slug, url: toAbsoluteURL(href), count });
    }
  });

  // Fallback: cari semua link /studio/:slug/
  if (studios.length === 0) {
    $('a[href*="/studio/"]').each((_, a) => {
      const href = $(a).attr('href') || '';
      const slugMatch = href.match(/\/studio\/([\w-]+)\/?/);
      if (!slugMatch) return;
      const slug = slugMatch[1];
      const name = cleanText($(a).find('span.name').text()) || cleanText($(a).text()) || null;
      if (name && slug && !studios.find(s => s.slug === slug)) {
        studios.push({ name, slug, url: toAbsoluteURL(href), count: null });
      }
    });
  }

  if (studios.length === 0) {
    const err = new Error('Daftar studio tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { total: studios.length, data: studios };
}

/**
 * Scrape daftar anime berdasarkan studio dengan pagination.
 *
 * URL: /studio/:slug/
 *      /studio/:slug/page/:n/
 *
 * Selector identik dengan genre/hentai (article.bs):
 *   url         : a.tip[href]
 *   title       : .tt (text node)
 *   lastEpisode : .epx
 *   type        : .typez[class]
 *   status      : .sb
 *   thumbnail   : img[src | data-src]
 *
 * @param {string} slug - studio slug, contoh: 't-rex', 'mary-jane'
 * @param {number} page - nomor halaman (default: 1)
 */
async function scrapeStudioAnime(slug, page = 1) {
  const pageNum = parseInt(page) || 1;
  const url = pageNum > 1
    ? `${BASE_URL}/studio/${slug}/page/${pageNum}/`
    : `${BASE_URL}/studio/${slug}/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const studioName = cleanText($('h1').first().text()) || slug;
  const items = [];

  $('article.bs').each((_, card) => {
    const $c = $(card);

    const cardUrl     = toAbsoluteURL($c.find('a.tip').attr('href') || $c.find('a').first().attr('href') || null);
    const postId      = $c.find('a.tip').attr('rel') || null;
    const title       = cleanText($c.find('.tt').clone().children().remove().end().text()) ||
                        cleanText($c.find('h2').text()) || null;
    const lastEpisode = cleanText($c.find('.epx').text()) || null;
    const thumbnail   = $c.find('img').first().attr('src') || $c.find('img').first().attr('data-src') || null;

    const typeEl  = $c.find('[class*="typez"]');
    const typeCls = typeEl.attr('class') || '';
    const type    = cleanText(typeEl.text()) || typeCls.match(/typez\s+(\S+)/)?.[1] || null;

    const status = cleanText($c.find('.sb').text()) || null;

    if (title && cardUrl) {
      items.push({ title, thumbnail, url: cardUrl, postId, lastEpisode, type, status });
    }
  });

  if (items.length === 0 && pageNum === 1) {
    const err = new Error(`Tidak ada anime ditemukan untuk studio "${slug}"`);
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // ── Pagination ─────────────────────────────────────────────
  let totalPages = pageNum;
  $('.pagination a.page-numbers').each((_, a) => {
    const m = $(a).attr('href')?.match(/\/page\/(\d+)\//);
    if (m) {
      const n = parseInt(m[1]);
      if (n > totalPages) totalPages = n;
    }
  });

  const baseUrl = `${BASE_URL}/studio/${slug}`;

  return {
    studio     : studioName,
    slug,
    page       : pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage   : pageNum < totalPages ? `${baseUrl}/page/${pageNum + 1}/` : null,
    prevPage   : pageNum > 1 ? (pageNum - 1 === 1 ? `${baseUrl}/` : `${baseUrl}/page/${pageNum - 1}/`) : null,
    total      : items.length,
    data       : items,
  };
}

module.exports = { scrapeStudioList, scrapeStudioAnime };
