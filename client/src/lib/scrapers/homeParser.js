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
 * Parse card plain "bs" — digunakan di section Baru ditambahkan & Rekomendasi
 * HTML: article.bs > .bsx > a.tip[href]
 *   > .limit > .typez | .bt > .epx | .sb
 *   > img[src | data-src]
 *   > .tt > (text node = series title) + h2 = episode title
 */
function parseStyleTwo($, el) {
  const $el  = $(el);
  const $tip = $el.find('a.tip').first();
  const url    = toAbsoluteURL($tip.attr('href') || null);
  const postId = $tip.attr('rel') || null;

  const $tt = $el.find('.tt');
  const title =
    cleanText($tt.clone().children().remove().end().text()) ||
    cleanText($tt.find('h2').text()) ||
    null;

  const lastEpisode = cleanText($el.find('.epx').text()) || null;
  const thumbnail =
    $el.find('img').first().attr('src') ||
    $el.find('img').first().attr('data-src') ||
    null;

  const typeEl = $el.find('[class*="typez"]');
  let type = cleanText(typeEl.text()) || null;
  if (!type) {
    const typeCls = typeEl.attr('class') || '';
    const match = typeCls.match(/typez\s+(\S+)/);
    type = match ? match[1] : null;
  }

  const status = cleanText($el.find('.sb').text()) || null;
  return { title, thumbnail, url, postId, lastEpisode, type, status };
}

/**
 * Parse card "stylefor" — digunakan di section Hentai
 * HTML: article.stylefor > .bsx > a.tip[href]
 *   > .limit > img | .anime-views | .tt > h2 + span (status <i>epNum</i>)
 */
function parseStyleFor($, el) {
  const $el  = $(el);
  const $tip = $el.find('a.tip').first();
  const url    = toAbsoluteURL($tip.attr('href') || null);
  const postId = $tip.attr('rel') || null;
  const fullTitle = cleanText($el.find('.tt h2').text()) || null;

  const $span = $el.find('.tt span');
  const epNum = cleanText($span.find('i').text()) || null;
  const status = cleanText($span.clone().find('i').remove().end().text()) || null;

  let title = fullTitle;
  if (epNum && title) {
    title = title.replace(new RegExp(`\\s+(?:Episode|Ep)\\s+${epNum}$`, 'i'), '').trim() || title;
  }

  const thumbnail =
    $el.find('img').first().attr('src') ||
    $el.find('img').first().attr('data-src') ||
    null;

  const views = cleanText($el.find('.anime-views').text()) || null;

  return { title, thumbnail, url, postId, lastEpisode: epNum ? `Ep ${epNum}` : null, type: 'Hentai', status, views };
}

/**
 * Parse card "styleegg" — digunakan di section JAV
 * HTML: article.bs.styleegg > .bsx > a.tip[href]
 *   > .egghead > .eggtitle | .eggmeta > .eggtype | .eggepisode
 */
function parseStyleEgg($, el) {
  const $el  = $(el);
  const $tip = $el.find('a.tip').first();
  const url    = toAbsoluteURL($tip.attr('href') || null);
  const postId = $tip.attr('rel') || null;
  const title  = cleanText($el.find('.eggtitle').text()) || null;
  const lastEpisode = cleanText($el.find('.eggepisode').text()) || null;
  const thumbnail =
    $el.find('img').first().attr('src') ||
    $el.find('img').first().attr('data-src') ||
    null;

  const typeEl = $el.find('[class*="eggtype"]');
  let type = cleanText(typeEl.text()) || null;
  if (!type) {
    const typeCls = typeEl.attr('class') || '';
    const match = typeCls.match(/eggtype\s+(\S+)/);
    type = match ? match[1] : null;
  }

  const status = cleanText($el.find('.sb').text()) || null;
  return { title, thumbnail, url, postId, lastEpisode, type, status };
}

/**
 * Parse card komik dari section .hc-manga-sc (class khusus hentaicop.com)
 * HTML: div.hc-sc-card
 *   > div.limit > a.img-link[href] + img[src] + a.type[class="type manhwa"]
 *   > div.tt > h3 > a[title] + div > span (views) + span (score)
 *   > div.hc-sc-chaps > div.hc-sc-chap-item > a[href] + span.hc-sc-chap-date
 */
function parseHcMangaCard($, el) {
  const $el = $(el);

  const url       = $el.find('a.img-link').attr('href') || $el.find('a').first().attr('href') || null;
  const thumbnail =
    $el.find('img').first().attr('src') ||
    $el.find('img').first().attr('data-src') ||
    null;
  const title = cleanText($el.find('.tt h3 a').first().attr('title') || $el.find('.tt h3').text()) || null;

  // type dari class: "type manhwa" / "type manga"
  const $typeEl = $el.find('a.type').first();
  const type    = cleanText($typeEl.text()) || null;
  const typeUrl = toAbsoluteURL($typeEl.attr('href') || null);

  // views dan score ada di span di dalam .tt
  let views = null;
  let score = null;
  $el.find('.tt div span').each((_, span) => {
    const text = cleanText($(span).text()) || '';
    if (/views?/i.test(text)) views = text.replace(/views?/i, '').trim();
    if (/score/i.test(text)) score = text.replace(/score:/i, '').trim();
  });

  // chapter list terbaru
  const chapters = [];
  $el.find('.hc-sc-chap-item').each((_, item) => {
    const $item  = $(item);
    const chUrl  = toAbsoluteURL($item.find('a').attr('href') || null);
    const chText = cleanText($item.find('a').text()) || null;
    const chDate = cleanText($item.find('.hc-sc-chap-date').text()) || null;
    if (chText && chUrl) chapters.push({ chapter: chText, url: chUrl, date: chDate });
  });

  return { title, thumbnail, url, type, typeUrl, views, score, latestChapters: chapters };
}

/**
 * Parse cards dari satu tab pane
 */
function parseCards($, containerEl) {
  const cards = [];
  $(containerEl).find('article.bs, article.stylefor').each((_, card) => {
    const cls = $(card).attr('class') || '';
    let parsed;
    if (cls.includes('stylefor')) {
      parsed = parseStyleFor($, card);
    } else if (cls.includes('styleegg')) {
      parsed = parseStyleEgg($, card);
    } else {
      parsed = parseStyleTwo($, card);
    }
    if (parsed.url) cards.push(parsed);
  });
  return cards;
}

/**
 * Parse semua card di dalam sebuah section .bixbox
 * Mencakup: article.bs (plain & styleegg), article.stylefor
 * Jika section punya .nav-tabs → return tabs array, bukan flat data
 */
function parseSection($, sectionEl) {
  const $sec    = $(sectionEl);
  const heading = cleanText($sec.find('h2, h3').first().text()) || null;

  // Cek apakah ada tab structure (.nav-tabs + .tab-pane)
  const $navTabs = $sec.find('.nav-tabs');
  if ($navTabs.length > 0) {
    const tabs = [];
    $navTabs.find('li a').each((_, a) => {
      const tabLabel = cleanText($(a).text());
      const paneId   = ($(a).attr('href') || '').replace('#', '');
      const $pane    = $sec.find(`#${paneId}`);
      const cards    = $pane.length ? parseCards($, $pane) : [];
      if (tabLabel) tabs.push({ tab: tabLabel, data: cards });
    });
    return { heading, tabs, data: null };
  }

  // Section biasa tanpa tab
  const cards = parseCards($, sectionEl);
  return { heading, tabs: null, data: cards };
}

/**
 * Scrape halaman utama hentaicop.com
 * Mengambil semua section: .bixbox (anime/JAV) + .hc-manga-sc (komik)
 * @returns {Promise<Object>}
 */
async function scrapeHome() {
  const html = await fetchHTML(BASE_URL);
  const $    = cheerio.load(html);

  const sectionMap = new Map(); // key = DOM index, value = section data

  // ── .bixbox : Baru ditambahkan, Hentai, JAV, Rekomendasi ──
  $('.postbody').children().each((domIdx, el) => {
    const cls = $(el).attr('class') || '';

    if (cls.includes('bixbox')) {
      const $sec    = $(el);
      const hasCard = $sec.find('article.bs, article.stylefor').length > 0;
      if (!hasCard) return;

      const { heading, tabs, data } = parseSection($, el);

      if (tabs) {
        // Section dengan tab (Rekomendasi)
        const hasData = tabs.some(t => t.data.length > 0);
        if (hasData) {
          sectionMap.set(domIdx, { section: heading, type: 'anime-tabs', tabs });
        }
      } else if (data && data.length > 0) {
        sectionMap.set(domIdx, { section: heading, type: 'anime', data });
      }
    } else if (cls.includes('hc-manga-sc')) {
      // ── .hc-manga-sc : Komik Hentai ──
      const $sec   = $(el);
      const heading = cleanText($sec.find('.hc-manga-sc-title').text()) || 'Komik Hentai';
      const cards  = [];

      $sec.find('.hc-sc-card').each((_, card) => {
        const parsed = parseHcMangaCard($, card);
        if (parsed.url) cards.push(parsed);
      });

      if (cards.length > 0) {
        sectionMap.set(domIdx, { section: heading, type: 'manga', data: cards });
      }
    }
  });

  const sections = [...sectionMap.values()];

  if (sections.length === 0) {
    const err = new Error('Tidak ada data ditemukan di halaman utama');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    source: BASE_URL,
    totalSections: sections.length,
    sections,
  };
}

module.exports = { scrapeHome };
