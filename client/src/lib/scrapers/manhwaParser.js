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
 * Scrape /manga-type/manhwa/ dengan pagination.
 * URL: /manga-type/manhwa/
 *      /manga-type/manhwa/page/N/
 *
 * @param {number} page
 */
async function scrapeManhwa(page = 1) {
  const pageNum = parseInt(page) || 1;
  const url = pageNum > 1
    ? `${BASE_URL}/manga-type/manhwa/page/${pageNum}/`
    : `${BASE_URL}/manga-type/manhwa/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const items = [];

  $('article.bs').each((_, card) => {
    const $c     = $(card);
    const $a     = $c.find('a.tip').first();
    const cardUrl = toAbsoluteURL($a.attr('href') || null);
    const postId  = $a.attr('rel') || null;

    const title = cleanText($a.attr('title')) ||
                  cleanText($c.find('.tt').clone().children().remove().end().text()) ||
                  cleanText($c.find('h2').text()) || null;

    const thumbnail = $c.find('img').first().attr('src') ||
                      $c.find('img').first().attr('data-src') || null;

    let slug = null;
    try {
      const u = new URL(cardUrl || '');
      if (u.pathname.startsWith('/manga/')) slug = u.pathname.split('/')[2];
    } catch {}

    if (title && cardUrl) {
      items.push({ title, thumbnail, url: cardUrl, slug, postId });
    }
  });

  if (items.length === 0 && pageNum === 1) {
    const err = new Error('Data manhwa tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Pagination: /manga-type/manhwa/page/N/
  let totalPages = pageNum;
  $('.pagination a.page-numbers').each((_, a) => {
    const m = $(a).attr('href')?.match(/\/page\/(\d+)\//);
    if (m) {
      const n = parseInt(m[1]);
      if (n > totalPages) totalPages = n;
    }
  });

  const baseUrl = `${BASE_URL}/manga-type/manhwa`;

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

module.exports = { scrapeManhwa };
