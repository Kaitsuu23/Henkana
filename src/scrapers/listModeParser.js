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
 * Scrape halaman /series/list-mode/ — daftar semua series dalam mode teks.
 *
 * Website mengembalikan SEMUA data sekaligus (filter per huruf dilakukan client-side JS).
 * Kita scrape semua, lalu filter manual jika title/huruf diberikan.
 *
 * Struktur HTML:
 *   .soralist
 *     .blix
 *       span > a[name="["]   → letter header
 *       ul > li > a.series.tip[rel][href]  → series item
 *
 * @param {string} [title] - filter huruf: 'A'-'Z', '[' untuk simbol, atau kosong = semua
 */
async function scrapeListMode(title = '') {
  const html = await fetchHTML(`${BASE_URL}/series/list-mode/`);
  const $    = cheerio.load(html);

  const allGroups = [];

  $('.soralist .blix').each((_, blix) => {
    const $blix  = $(blix);
    const letter = cleanText($blix.find('span a[name]').first().text()) || '?';

    const items = [];
    $blix.find('ul li').each((_, li) => {
      const $a     = $(li).find('a').first();
      const href   = toAbsoluteURL($a.attr('href') || null);
      const name   = cleanText($a.text()) || null;
      const postId = $a.attr('rel') || null;

      let slug = null;
      try {
        const u = new URL(href || '');
        if (u.pathname.startsWith('/series/')) slug = u.pathname.split('/')[2];
      } catch {}

      if (name && href) items.push({ title: name, url: href, slug, postId });
    });

    if (items.length > 0) allGroups.push({ letter, total: items.length, items });
  });

  if (allGroups.length === 0) {
    const err = new Error('Data list mode tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Filter per huruf jika title diberikan
  const groups = title
    ? allGroups.filter(g => g.letter.toLowerCase() === title.toLowerCase())
    : allGroups;

  const totalAll = allGroups.reduce((s, g) => s + g.total, 0);
  const total    = groups.reduce((s, g)    => s + g.total, 0);

  return { filter: title || null, total, totalAll, groups };
}

module.exports = { scrapeListMode };
