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
 * Scrape semua filter options dari form di /series/
 * Mengembalikan: genres, seasons, studios, statuses, types, orders, subs
 */
async function scrapeSeriesFilters() {
  const html = await fetchHTML(`${BASE_URL}/series/`);
  const $    = cheerio.load(html);

  // Checkbox groups (genre, season, studio)
  function getCheckboxOptions(name) {
    const opts = [];
    $(`input[type="checkbox"][name="${name}"]`).each((_, el) => {
      const val   = $(el).attr('value') || '';
      const label = cleanText($(`label[for="${$(el).attr('id')}"]`).text()) || val;
      if (val) opts.push({ value: val, label });
    });
    return opts;
  }

  // Radio groups (status, type, sub, order)
  function getRadioOptions(name) {
    const opts = [];
    $(`input[type="radio"][name="${name}"]`).each((_, el) => {
      const val   = $(el).attr('value') ?? '';
      const label = cleanText($(`label[for="${$(el).attr('id')}"]`).text()) || 'Semua';
      opts.push({ value: val, label });
    });
    return opts;
  }

  return {
    genres  : getCheckboxOptions('genre[]'),
    seasons : getCheckboxOptions('season[]'),
    studios : getCheckboxOptions('studio[]'),
    statuses: getRadioOptions('status'),
    types   : getRadioOptions('type'),
    subs    : getRadioOptions('sub'),
    orders  : getRadioOptions('order'),
  };
}


/**
 * Filter params (semua opsional):
 *   genre[]  {string[]} - bisa multiple: genre[]=action&genre[]=romance
 *   status   {string}   - '' | 'ongoing' | 'completed'
 *   type     {string}   - '' | 'manga' | 'manhwa' | 'manhua'
 *   order    {string}   - '' (Newest) | 'update' (Latest Update) | 'popular'
 *   page     {number}   - nomor halaman via ?page=N (default: 1)
 *
 * @param {Object} opts - filter options
 * @param {string[]} [opts.genre]  - array genre slug
 * @param {string}   [opts.status] - status filter
 * @param {string}   [opts.type]   - type filter
 * @param {string}   [opts.order]  - order filter
 * @param {number}   [opts.page]   - nomor halaman
 */
async function scrapeSeries(opts = {}) {
  const {
    genre  = [],
    season = [],
    studio = [],
    status = '',
    type   = '',
    sub    = '',
    order  = '',
    page   = 1,
  } = opts;

  const pageNum = parseInt(page) || 1;

  const params = new URLSearchParams();

  // Multi-value params
  (Array.isArray(genre)  ? genre  : genre  ? [genre]  : []).forEach(g => params.append('genre[]',  g));
  (Array.isArray(season) ? season : season ? [season] : []).forEach(g => params.append('season[]', g));
  (Array.isArray(studio) ? studio : studio ? [studio] : []).forEach(g => params.append('studio[]', g));

  if (status)     params.set('status', status);
  if (type)       params.set('type',   type);
  if (sub)        params.set('sub',    sub);
  if (order)      params.set('order',  order);
  if (pageNum > 1) params.set('page',  pageNum);

  const qs  = params.toString();
  const url = `${BASE_URL}/series/${qs ? '?' + qs : ''}`;

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
    const cardType = cleanText(typeEl.text()) || typeCls.match(/typez\s+(\S+)/)?.[1] || null;

    const cardStatus = cleanText($c.find('.sb').text()) || null;

    if (title && cardUrl) {
      items.push({ title, thumbnail, url: cardUrl, postId, lastEpisode, type: cardType, status: cardStatus });
    }
  });

  if (items.length === 0 && pageNum === 1) {
    // Kembalikan empty result, bukan error — kombinasi filter bisa memang tidak ada hasilnya
    return {
      page       : pageNum,
      hasNextPage: false,
      hasPrevPage: false,
      nextPage   : null,
      prevPage   : null,
      filters    : { genre, season, studio, status, type, sub, order },
      total      : 0,
      data       : [],
    };
  }

  // Pagination: tidak ada di HTML, estimasi dari jumlah hasil
  // Kalau hasil < 30 berarti sudah halaman terakhir
  const hasNextPage = items.length === 30;

  // Build URL helper untuk next/prev
  const buildUrl = (p) => {
    const np = new URLSearchParams(params);
    if (p > 1) np.set('page', p); else np.delete('page');
    const q = np.toString();
    return `${BASE_URL}/series/${q ? '?' + q : ''}`;
  };

  return {
    page       : pageNum,
    hasNextPage,
    hasPrevPage: pageNum > 1,
    nextPage   : hasNextPage ? buildUrl(pageNum + 1) : null,
    prevPage   : pageNum > 1 ? buildUrl(pageNum - 1) : null,
    filters    : {
      genre : Array.isArray(genre) ? genre : genre ? [genre] : [],
      status : status || null,
      type   : type   || null,
      order  : order  || null,
    },
    total : items.length,
    data  : items,
  };
}

module.exports = { scrapeSeries, scrapeSeriesFilters };
