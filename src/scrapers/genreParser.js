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
 * Scrape daftar semua genre dari /genre/
 *
 * Selector yang digunakan:
 *   - container : .postbody ul.taxindex  (atau .postbody .tagindex)
 *   - item      : li > a[href]
 *   - name      : a span.name  (atau teks langsung)
 *   - count     : a span.count
 *   - slug      : dari href → /genres/:slug/
 *
 * @returns {Promise<Object>}
 */
async function scrapeGenreList() {
  const url  = `${BASE_URL}/genre/`;
  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const genres = [];

  // Coba selector utama: ul.taxindex li
  const $items = $('.postbody ul.taxindex li, .postbody .tagindex li, .genreindex li');

  $items.each((_, li) => {
    const $a   = $(li).find('a').first();
    const href = $a.attr('href') || '';

    const name =
      cleanText($a.find('span.name').text()) ||
      cleanText($a.clone().children().remove().end().text()) ||
      cleanText($a.text());

    const countRaw = cleanText($a.find('span.count').text());
    const count    = countRaw ? parseInt(countRaw) || countRaw : null;

    // Slug dari URL: /genres/milf/ → "milf"
    const slugMatch = href.match(/\/genres?\/([\w%-]+)\/?/);
    const slug      = slugMatch ? decodeURIComponent(slugMatch[1]) : null;

    const absUrl = toAbsoluteURL(href);

    if (name && slug) {
      genres.push({ name, slug, url: absUrl, count });
    }
  });

  // Fallback: link genre yang langsung ada di halaman
  if (genres.length === 0) {
    $('a[href*="/genres/"]').each((_, a) => {
      const $a   = $(a);
      const href = $a.attr('href') || '';
      const name = cleanText($a.text());

      const slugMatch = href.match(/\/genres?\/([\w%-]+)\/?/);
      const slug      = slugMatch ? decodeURIComponent(slugMatch[1]) : null;

      if (name && slug && !genres.find((g) => g.slug === slug)) {
        genres.push({ name, slug, url: toAbsoluteURL(href), count: null });
      }
    });
  }

  if (genres.length === 0) {
    const err = new Error('Daftar genre tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    total: genres.length,
    data: genres,
  };
}

/**
 * Scrape daftar anime berdasarkan genre + halaman
 *
 * URL format: https://hentaicop.com/genres/:slug/
 *             https://hentaicop.com/genres/:slug/page/2/
 *
 * Selector yang digunakan:
 *   - cards      : article.bs  (styletwo di halaman genre)
 *   - url        : a.tip[href]
 *   - title      : .tt (text node)
 *   - episode    : .epx  (bisa berisi nomor ep atau status)
 *   - type       : .typez[class]  → class="typez OVA"
 *   - thumbnail  : img[src | data-src]
 *   - pagination : .pagination a[href]
 *
 * @param {string} slug  - genre slug, contoh: "milf"
 * @param {number} page  - nomor halaman (default: 1)
 */
async function scrapeGenreAnime(slug, page = 1) {
  const pageNum = parseInt(page) || 1;
  const url =
    pageNum > 1
      ? `${BASE_URL}/genres/${slug}/page/${pageNum}/`
      : `${BASE_URL}/genres/${slug}/`;

  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  const items = [];

  $('article.bs').each((_, card) => {
    const $c   = $(card);
    const cls  = $c.attr('class') || '';
    const isEgg = cls.includes('styleegg');

    const cardUrl = toAbsoluteURL(
      $c.find('a.tip').attr('href') || $c.find('a').first().attr('href') || null
    );
    const postId = $c.find('a.tip').attr('rel') || null;

    const title = isEgg
      ? cleanText($c.find('.eggtitle').text())
      : cleanText($c.find('.tt').clone().children().remove().end().text()) ||
        cleanText($c.find('h2').text());

    // .epx bisa berisi status ("Completed"/"Ongoing") atau nomor episode
    const episode =
      cleanText($c.find('.epx').text()) ||
      cleanText($c.find('.eggepisode').text()) ||
      null;

    const typeEl  = isEgg ? $c.find('[class*="eggtype"]') : $c.find('[class*="typez"]');
    const typeCls = typeEl.attr('class') || '';
    const type    =
      cleanText(typeEl.text()) ||
      (typeCls.match(/(?:eggtype|typez)\s+(\S+)/)?.[1] ?? null);

    const status    = cleanText($c.find('.sb').text()) || null;
    const thumbnail =
      $c.find('img').attr('src') || $c.find('img').attr('data-src') || null;

    if (title && cardUrl) {
      items.push({ title, thumbnail, url: cardUrl, postId, type, lastEpisode: episode, status });
    }
  });

  if (items.length === 0 && pageNum === 1) {
    const err = new Error(`Tidak ada anime ditemukan untuk genre "${slug}"`);
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // ── Pagination ─────────────────────────────────────────────
  let totalPages = pageNum;
  $('.pagination a').each((_, a) => {
    const m = $(a).attr('href')?.match(/\/page\/(\d+)\//);
    if (m) {
      const n = parseInt(m[1]);
      if (n > totalPages) totalPages = n;
    }
  });

  const pagination = {
    currentPage: pageNum,
    totalPages,
    hasNextPage: pageNum < totalPages,
    hasPrevPage: pageNum > 1,
    nextPage:
      pageNum < totalPages
        ? `${BASE_URL}/genres/${slug}/page/${pageNum + 1}/`
        : null,
    prevPage:
      pageNum > 1
        ? pageNum - 1 === 1
          ? `${BASE_URL}/genres/${slug}/`
          : `${BASE_URL}/genres/${slug}/page/${pageNum - 1}/`
        : null,
  };

  return {
    genre: slug,
    page: pageNum,
    total: items.length,
    pagination,
    data: items,
  };
}

module.exports = { scrapeGenreList, scrapeGenreAnime };
