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
 * Scrape daftar semua manga genre dari halaman /manga-genre/ (jika ada)
 * atau return static list dari link yang diketahui.
 */
async function scrapeMangaGenreList() {
  // Coba fetch halaman manga utama untuk dapat semua genre link
  const html = await fetchHTML(`${BASE_URL}/manga/`);
  const $    = cheerio.load(html);

  const genres = [];
  const seen   = new Set();

  // Genre links dari card type badges dan pagination
  $('a[href*="/manga-genre/"]').each((_, a) => {
    const href = $(a).attr('href') || '';
    const m = href.match(/\/manga-genre\/([\w-]+)\/?/);
    if (!m) return;
    const slug = m[1];
    if (seen.has(slug)) return;
    seen.add(slug);
    const name = cleanText($(a).text()) || slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
    genres.push({ name, slug, url: toAbsoluteURL(href) });
  });

  if (genres.length === 0) {
    const err = new Error('Daftar genre manga tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { total: genres.length, data: genres };
}

/**
 * Scrape daftar manga berdasarkan genre dari /manga-genre/:slug/
 * URL: /manga-genre/:slug/
 *      /manga-genre/:slug/page/N/
 *
 * @param {string} slug - genre slug, contoh: 'adult', 'romance'
 * @param {number} page - nomor halaman (default: 1)
 */
async function scrapeMangaGenre(slug, page = 1) {
  const pageNum = parseInt(page) || 1;
  const url = pageNum > 1
    ? `${BASE_URL}/manga-genre/${slug}/page/${pageNum}/`
    : `${BASE_URL}/manga-genre/${slug}/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const genreName = cleanText($('h1').first().text()) || slug;
  const items     = [];

  $('article.bs').each((_, card) => {
    const $c      = $(card);
    const $a      = $c.find('a.tip').first();
    const cardUrl = toAbsoluteURL($a.attr('href') || null);
    const postId  = $a.attr('rel') || null;
    const title   = cleanText($a.attr('title')) ||
                    cleanText($c.find('.tt').clone().children().remove().end().text()) ||
                    cleanText($c.find('h2').text()) || null;
    const thumbnail = $c.find('img').first().attr('src') ||
                      $c.find('img').first().attr('data-src') || null;

    // Derive manga slug
    let slug = null;
    try {
      const u = new URL(cardUrl || '');
      if (u.pathname.startsWith('/manga/')) slug = u.pathname.split('/')[2];
    } catch {}

    if (title && cardUrl) items.push({ title, thumbnail, url: cardUrl, slug, postId });
  });

  if (items.length === 0 && pageNum === 1) {
    const err = new Error(`Tidak ada manga ditemukan untuk genre "${slug}"`);
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Pagination
  let totalPages = pageNum;
  $('.pagination a.page-numbers').each((_, a) => {
    const m = $(a).attr('href')?.match(/\/page\/(\d+)\//);
    if (m) {
      const n = parseInt(m[1]);
      if (n > totalPages) totalPages = n;
    }
  });

  const baseUrl = `${BASE_URL}/manga-genre/${slug}`;

  return {
    genre      : genreName,
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

module.exports = { scrapeMangaGenre };
