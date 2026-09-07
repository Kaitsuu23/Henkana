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
 * Ambil nilai field dari .spe span
 * Format HTML: <span><b>Label:</b> value</span>
 * Label yang ada: Status, Studio, Dirilis, Durasi, Tipe, Censor, Director, dll.
 *
 * @param {CheerioAPI} $
 * @param {string} label - case-insensitive, tanpa titik dua
 */
function getSpeField($, label) {
  let result = null;
  $('.spe span').each((_, el) => {
    const $span = $(el);
    const labelText = cleanText($span.find('b').text())
      ?.replace(':', '')
      .toLowerCase();
    if (labelText === label.toLowerCase()) {
      const value = cleanText(
        $span.text().replace($span.find('b').text(), '').replace(/^:?\s*/, '')
      );
      if (value) {
        result = value;
        return false; // break each
      }
    }
  });
  return result;
}

/**
 * Ambil list link dari field .spe (studio, producers, dll.)
 * @param {CheerioAPI} $
 * @param {string} label
 */
function getSpeLinks($, label) {
  const results = [];
  $('.spe span').each((_, el) => {
    const $span = $(el);
    const labelText = cleanText($span.find('b').text())
      ?.replace(':', '')
      .toLowerCase();
    if (labelText === label.toLowerCase()) {
      $span.find('a').each((__, a) => {
        const name = cleanText($(a).text());
        const href = toAbsoluteURL($(a).attr('href'));
        if (name) results.push({ name, url: href });
      });
      return false; // break each
    }
  });
  return results;
}

/**
 * Scrape halaman detail anime dari hentaicop.com
 *
 * Selector yang digunakan:
 *   - title         : .entry-title  /  .infox h1
 *   - thumbnail     : .thumb img[src | data-src]
 *   - description   : .synp p  /  .entry-content p
 *   - alt title     : .infox .alter
 *   - genres        : .genxed a
 *   - info fields   : .spe span → <b>Label:</b> value
 *   - rating        : .rating-prc meta[itemprop="ratingValue"][content]
 *   - episode list  : .eplister li → .epl-num | .epl-title | .epl-date | a[href]
 *   - related       : .bixbox mengandung "rekomendasi" di heading > article.bs
 *
 * @param {string} url - URL halaman detail
 */
async function scrapeDetail(url) {
  const html = await fetchHTML(url);
  const $ = cheerio.load(html);

  // ── Title ──────────────────────────────────────────────────
  const title =
    cleanText($('.entry-title').text()) ||
    cleanText($('.infox h1').text()) ||
    cleanText($('h1').first().text()) ||
    null;

  // ── Thumbnail ──────────────────────────────────────────────
  const thumbnail =
    $('.thumb img').attr('src') ||
    $('.thumb img').attr('data-src') ||
    $('meta[property="og:image"]').attr('content') ||
    null;

  // ── Description ───────────────────────────────────────────
  // Strip suffix "- Sinopsis <title> <url>" yang ditambahkan tema WordPress
  function stripDescriptionSuffix(text) {
    if (!text) return null;
    return text
      .replace(/\s*[-–]\s*Sinopsis\b.*$/is, '')
      .replace(/\s*https?:\/\/\S+\s*$/g, '')
      .trim() || null;
  }

  const rawDescription =
    cleanText($('.synp p').first().text()) ||
    cleanText($('.entry-content p').first().text()) ||
    cleanText($('[itemprop="description"]').text()) ||
    null;

  const description = stripDescriptionSuffix(rawDescription);

  // ── Alternative Titles (.alter) ───────────────────────────
  const alternativeTitles = [];
  const altRaw = cleanText($('.infox .alter').text());
  if (altRaw) {
    altRaw.split(/[;,]/).forEach((t) => {
      const trimmed = t.trim();
      if (trimmed) alternativeTitles.push(trimmed);
    });
  }

  // ── Genres (.genxed a) ─────────────────────────────────────
  const genres = [];
  $('.genxed a').each((_, a) => {
    const name = cleanText($(a).text());
    const href = toAbsoluteURL($(a).attr('href'));
    if (name) genres.push({ name, url: href });
  });

  // ── Info fields dari .spe ──────────────────────────────────
  // Label asli di hentaicop.com: bahasa Inggris
  const status   = getSpeField($, 'Status')   || null;
  const type     = getSpeField($, 'Type')     || null;
  const released = getSpeField($, 'Released') || null;
  const censor   = getSpeField($, 'Censor')   || null;

  const studios  = getSpeLinks($, 'Studio');
  const director = getSpeLinks($, 'Director');
  const casts    = getSpeLinks($, 'Casts');

  // ── Episode List (.eplister li) ────────────────────────────
  const episodeList = [];
  $('.eplister li').each((_, li) => {
    const $li    = $(li);
    const num    = cleanText($li.find('.epl-num').text())   || null;
    const epTitle= cleanText($li.find('.epl-title').text()) || null;
    const epUrl  = toAbsoluteURL($li.find('a').attr('href') || null);
    const date   = cleanText($li.find('.epl-date').text())  || null;
    const sub    = cleanText($li.find('.epl-sub .status').text()) || null;

    if (epUrl) {
      episodeList.push({ number: num, title: epTitle, url: epUrl, date, sub });
    }
  });

  // ── Related Anime ──────────────────────────────────────────
  // Cari section .bixbox yang heading-nya mengandung "rekomendasi"
  const related = [];
  $('.bixbox').each((_, section) => {
    const $sec = $(section);
    const heading = cleanText($sec.find('h2, h3').first().text()) || '';
    if (!heading.toLowerCase().includes('rekomendasi')) return;

    $sec.find('article.bs').each((_, el) => {
      const $el  = $(el);
      const cls  = $el.attr('class') || '';
      const isEgg = cls.includes('styleegg');

      const relTitle = isEgg
        ? cleanText($el.find('.eggtitle').text())
        : cleanText($el.find('.tt').clone().children().remove().end().text()) ||
          cleanText($el.find('h2').text());

      const relUrl   = toAbsoluteURL($el.find('a.tip, a').first().attr('href') || null);
      const postId   = $el.find('a.tip').first().attr('rel') || null;
      const relThumb =
        $el.find('img').attr('src') || $el.find('img').attr('data-src') || null;

      const typeEl  = isEgg
        ? $el.find('[class*="eggtype"]')
        : $el.find('[class*="typez"]');
      const typeCls = typeEl.attr('class') || '';
      const relType =
        cleanText(typeEl.text()) ||
        (typeCls.match(/(?:eggtype|typez)\s+(\S+)/)?.[1] ?? null);

      const relStatus = cleanText($el.find('.epx').text()) || null;

      if (relTitle && relUrl) {
        related.push({
          title    : relTitle,
          thumbnail: relThumb,
          url      : relUrl,
          postId,
          type     : relType,
          status   : relStatus,
        });
      }
    });
  });

  if (!title) {
    const err = new Error('Data detail anime tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    title,
    thumbnail,
    description,
    alternativeTitles,
    genres,
    status,
    type,
    censor,
    studios,
    director,
    casts,
    released,
    episodes: {
      total: episodeList.length,
      list: episodeList,
    },
    related,
  };
}

module.exports = { scrapeDetail };
