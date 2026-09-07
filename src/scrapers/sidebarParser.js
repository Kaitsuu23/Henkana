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
 * Scrape sidebar "Paling Banyak Di Tonton" dari hentaicop.com
 *
 * HTML structure:
 *   .ts-wpop-series-gen
 *     ul.hc-wpop-nav-tabs > li > span.hc-wpop-tab[data-target="anime|manga|semua"]
 *
 *   .serieslist.pop.hc-wpop-anime   → Video Mingguan
 *   .serieslist.pop.hc-wpop-manga   → Komik Mingguan
 *   .serieslist.pop.hc-wpop-semua   → Semua
 *
 *   Tiap li:
 *     .ctr                         → rank
 *     .imgseries a.series[href]    → url
 *     img[src]                     → thumbnail
 *     .leftseries h4 a             → title
 *     .leftseries a[rel="tag"]     → genres
 *     .numscore                    → rating (jika ada)
 *
 * @param {string|null} sourceUrl - URL halaman yang ingin diambil sidebarnya (opsional)
 */
async function scrapeSidebar(sourceUrl) {
  const url  = sourceUrl || BASE_URL;
  const html = await fetchHTML(url);
  const $    = cheerio.load(html);

  // Map class CSS → label tab dari data-target di nav
  const tabMap = {
    'hc-wpop-anime' : 'Video Mingguan',
    'hc-wpop-manga' : 'Komik Mingguan',
    'hc-wpop-semua' : 'Semua',
  };

  // Ambil label dinamis dari tab jika ada (lebih akurat)
  $('.hc-wpop-tab[data-target]').each((_, el) => {
    const target = $(el).attr('data-target');
    const label  = cleanText($(el).text());
    if (target && label) tabMap[`hc-wpop-${target}`] = label;
  });

  const popular = [];

  Object.entries(tabMap).forEach(([cls, label]) => {
    const $list = $(`.serieslist.pop.${cls}`);
    if (!$list.length) return;

    const items = [];
    $list.find('li').each((_, li) => {
      const $li = $(li);

      const rank      = cleanText($li.find('.ctr').text())              || null;
      const itemUrl   = toAbsoluteURL($li.find('a.series').first().attr('href') || null);
      const thumbnail = $li.find('img').attr('src') || $li.find('img').attr('data-src') || null;
      const title     = cleanText($li.find('.leftseries h4 a').text())  || null;
      const rating    = cleanText($li.find('.numscore').text())          || null;

      const genres = [];

      // Anime/Semua: genre pakai a[rel="tag"]
      $li.find('.leftseries a[rel="tag"]').each((_, a) => {
        const g = cleanText($(a).text());
        if (g) genres.push(g);
      });

      // Manga: genre pakai plain text di div (tidak ada a[rel="tag"])
      if (genres.length === 0) {
        $li.find('.leftseries div').each((_, div) => {
          const text = cleanText($(div).text()) || '';
          if (text.toLowerCase().startsWith('genres:')) {
            text.replace(/^genres:\s*/i, '').split(',').forEach(g => {
              const trimmed = g.trim();
              if (trimmed) genres.push(trimmed);
            });
          }
        });
      }

      if (title && itemUrl) {
        items.push({ rank, title, url: itemUrl, thumbnail, genres, rating });
      }
    });

    if (items.length > 0) {
      popular.push({ tab: label, total: items.length, items });
    }
  });

  if (popular.length === 0) {
    const err = new Error('Data sidebar tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { popular };
}

module.exports = { scrapeSidebar };
