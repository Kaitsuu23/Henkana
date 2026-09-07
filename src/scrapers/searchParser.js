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
 * Scrape hasil pencarian berdasarkan keyword
 *
 * Selector yang digunakan:
 *   - container  : .listupd
 *   - card       : article.bs  (styletwo di halaman search)
 *   - url        : a.tip[href]
 *   - title      : .tt (text node, bukan h2)
 *   - status     : .epx  ← berisi status ("Completed"/"Ongoing") di halaman search
 *   - type       : .typez[class]  → class="typez TV"
 *   - subDub     : .sb
 *   - thumbnail  : img[src | data-src]
 *   - pagination : .pagination a[href]
 *
 * @param {string} query  - keyword pencarian
 * @param {number} page   - nomor halaman (default: 1)
 */
async function scrapeSearch(query, page = 1) {
  const pageNum = parseInt(page) || 1;

  // URL format pencarian WordPress: /?s=keyword atau /page/N/?s=keyword
  const searchURL =
    pageNum > 1
      ? `${BASE_URL}/page/${pageNum}/?s=${encodeURIComponent(query)}`
      : `${BASE_URL}/?s=${encodeURIComponent(query)}`;

  const html = await fetchHTML(searchURL);
  const $ = cheerio.load(html);

  const results = [];

  $('article.bs').each((_, card) => {
    const $c = $(card);
    const cls = $c.attr('class') || '';
    const isEgg = cls.includes('styleegg');

    const url    = toAbsoluteURL(
      $c.find('a.tip').attr('href') || $c.find('a').first().attr('href') || null
    );
    const postId = $c.find('a.tip').attr('rel') || null;

    // Title: text node di .tt (bukan h2 yang include episode)
    const title = isEgg
      ? cleanText($c.find('.eggtitle').text())
      : cleanText($c.find('.tt').clone().children().remove().end().text()) ||
        cleanText($c.find('h2').text());

    // Di halaman search .epx berisi status bukan nomor episode
    const status = cleanText($c.find('.epx').text()) || null;

    // Episode: untuk styleegg di .eggepisode
    const episode = isEgg ? cleanText($c.find('.eggepisode').text()) || null : null;

    // Type dari nama class
    const typeEl = isEgg
      ? $c.find('[class*="eggtype"]')
      : $c.find('[class*="typez"]');
    const typeCls = typeEl.attr('class') || '';
    const type =
      cleanText(typeEl.text()) ||
      (typeCls.match(/(?:eggtype|typez)\s+(\S+)/)?.[1] ?? null);

    const thumbnail =
      $c.find('img').attr('src') || $c.find('img').attr('data-src') || null;

    // Deteksi content type dari URL jika .typez kosong (biasanya manga)
    const isMangaUrl = (url || '').includes('/manga/');
    const resolvedType = type || (isMangaUrl ? 'Manga' : null);

    if (title && url) {
      results.push({ title, thumbnail, url, postId, type: resolvedType, status, episode });
    }
  });

  // Pagination dari .pagination a[href]
  let totalPages = pageNum;
  $('.pagination a').each((_, a) => {
    const match = $(a).attr('href')?.match(/\/page\/(\d+)\//);
    if (match) {
      const n = parseInt(match[1]);
      if (n > totalPages) totalPages = n;
    }
  });

  if (results.length === 0 && pageNum === 1) {
    const err = new Error(`Tidak ada hasil pencarian untuk "${query}"`);
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    query,
    page: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    total: results.length,
    data: results,
  };
}

module.exports = { scrapeSearch };
