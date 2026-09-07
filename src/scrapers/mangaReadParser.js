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
 * Scrape halaman baca chapter manga dari hentaicop.com
 *
 * URL format: /manga/:slug/?chapter=chapter-N
 *
 * HTML Structure:
 *   #hc-img-container img[src]    → halaman gambar
 *   .hc-top-nav                   → breadcrumb (series title + chapter)
 *   .hc-top-nav a[href*="/manga/"]→ series URL
 *   .hc-bnav-btn:not(.disabled)   → prev/next chapter buttons
 *   .hc-bnav-list-btn             → current chapter label
 *
 * @param {string} mangaUrl - URL lengkap: /manga/:slug/?chapter=chapter-N
 */
async function scrapeMangaRead(mangaUrl) {
  const html = await fetchHTML(mangaUrl);
  const $    = cheerio.load(html);

  // ── Pages ────────────────────────────────────────────────
  const pages = [];
  $('#hc-img-container img').each((_, img) => {
    const src = $(img).attr('src') || $(img).attr('data-src') || null;
    if (src && !src.includes('/wp-content/') && src.includes('hentaicop')) {
      pages.push(src);
    }
  });

  // Fallback: semua img di reader wrap
  if (pages.length === 0) {
    $('.hc-reader-images img, #hc-reader-area img').each((_, img) => {
      const src = $(img).attr('src') || $(img).attr('data-src') || null;
      if (src && src.match(/\.(jpg|jpeg|png|webp)/i)) pages.push(src);
    });
  }

  // ── Series info dari breadcrumb ──────────────────────────
  const $topNav  = $('.hc-top-nav');
  const seriesUrl = toAbsoluteURL($topNav.find('a[href*="/manga/"]').first().attr('href') || null);
  const seriesTitle = cleanText($topNav.find('a[href*="/manga/"]').first().text()) || null;

  // Extract series slug dari URL
  let seriesSlug = null;
  try {
    const u = new URL(seriesUrl || '');
    if (u.pathname.startsWith('/manga/')) seriesSlug = u.pathname.split('/')[2];
  } catch {}

  // ── Current chapter label ─────────────────────────────────
  const chapterLabel = cleanText($('.hc-bnav-list-btn').first().text()) || null;

  // ── Prev / Next chapter ───────────────────────────────────
  // .hc-bnav-btn.disabled = tidak ada navigasi di arah itu
  // .hc-bnav-btn:not(.disabled) = ada navigasi
  let prevUrl = null;
  let nextUrl = null;

  $('.hc-bnav-btn').each((_, btn) => {
    const $btn = $(btn);
    const cls  = $btn.attr('class') || '';
    const href = $btn.attr('href') || '';
    const text = cleanText($btn.text()) || '';

    if (cls.includes('disabled') || !href) return;

    if (text.toLowerCase().includes('prev')) {
      prevUrl = toAbsoluteURL(href);
    } else if (text.toLowerCase().includes('next')) {
      nextUrl = toAbsoluteURL(href);
    }
  });

  // Fallback: ambil dari navigation links
  if (!nextUrl) {
    $('a[href*="chapter"]').each((_, a) => {
      const text = cleanText($(a).text()) || '';
      const href = $(a).attr('href') || '';
      if (!href || href.includes('login')) return;
      if (!nextUrl && text.toLowerCase().includes('next')) nextUrl = toAbsoluteURL(href);
      if (!prevUrl && text.toLowerCase().includes('prev')) prevUrl = toAbsoluteURL(href);
    });
  }

  // ── Page title dari HTML <title> ──────────────────────────
  const htmlTitle = cleanText($('title').text())?.split('-')[0]?.trim() || null;

  if (pages.length === 0) {
    const err = new Error('Halaman manga tidak ditemukan — mungkin perlu login atau chapter tidak tersedia');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return {
    title       : htmlTitle,
    chapterLabel,
    seriesTitle,
    seriesUrl,
    seriesSlug,
    totalPages  : pages.length,
    pages,
    navigation  : { prev: prevUrl, next: nextUrl },
  };
}

module.exports = { scrapeMangaRead };
