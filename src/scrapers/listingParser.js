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
 * Generic scraper untuk halaman listing hentaicop.com yang strukturnya sama:
 * satu .bixbox, article.bs, pagination /{slug}/page/N/
 *
 * Dipakai oleh: /hentai/, /2d/, /jav/, /uncensored/
 *
 * @param {string} slug  - path segment, contoh: 'hentai', '2d', 'jav', 'uncensored'
 * @param {number} page  - nomor halaman (default: 1)
 */
async function scrapeListing(slug, page = 1) {
  const pageNum = parseInt(page) || 1;
  const url = pageNum > 1
    ? `${BASE_URL}/${slug}/page/${pageNum}/`
    : `${BASE_URL}/${slug}/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

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
    const err = new Error(`Data ${slug} tidak ditemukan`);
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

  const baseUrl = `${BASE_URL}/${slug}`;

  return {
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

module.exports = { scrapeListing };
