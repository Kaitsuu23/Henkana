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
 * Scrape daftar semua producer dari /producer/
 *
 * Selector:
 *   .postbody ul li > a[href]
 *     > span.name  → nama producer
 *     > span.count → jumlah anime
 *   slug dari href: /producer/:slug/
 */
async function scrapeProducerList() {
  const html = await fetchHTML(`${BASE_URL}/producer/`);
  const $    = cheerio.load(html);

  const producers = [];

  $('.postbody li').each((_, li) => {
    const $a   = $(li).find('a').first();
    const href = $a.attr('href') || '';
    const name = cleanText($a.find('span.name').text()) || cleanText($a.text()) || null;
    const countRaw = cleanText($a.find('span.count').text());
    const count    = countRaw ? parseInt(countRaw) || countRaw : null;

    const slugMatch = href.match(/\/producer\/([\w-]+)\/?/);
    const slug      = slugMatch ? slugMatch[1] : null;

    if (name && slug) {
      producers.push({ name, slug, url: toAbsoluteURL(href), count });
    }
  });

  if (producers.length === 0) {
    const err = new Error('Daftar producer tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { total: producers.length, data: producers };
}

/**
 * Scrape daftar anime berdasarkan producer dengan pagination.
 *
 * URL: /producer/:slug/
 *      /producer/:slug/page/:n/
 *
 * @param {string} slug - producer slug, contoh: 'active', 'mary-jane'
 * @param {number} page - nomor halaman (default: 1)
 */
async function scrapeProducerAnime(slug, page = 1) {
  const pageNum = parseInt(page) || 1;
  const url = pageNum > 1
    ? `${BASE_URL}/producer/${slug}/page/${pageNum}/`
    : `${BASE_URL}/producer/${slug}/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const producerName = cleanText($('h1').first().text()) || slug;
  const items        = [];

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
    const err = new Error(`Tidak ada anime ditemukan untuk producer "${slug}"`);
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

  const baseUrl = `${BASE_URL}/producer/${slug}`;

  return {
    producer   : producerName,
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

module.exports = { scrapeProducerList, scrapeProducerAnime };
