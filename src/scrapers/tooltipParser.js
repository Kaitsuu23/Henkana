const axios   = require('axios');
const cheerio = require('cheerio');

const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

function cleanText(text) {
  return text ? text.replace(/\s+/g, ' ').trim() : null;
}

function toAbsoluteURL(url) {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

/**
 * Fetch tooltip data dari WP admin-ajax.php
 * Sama persis dengan yang dilakukan jQuery qTip2 di web aslinya.
 *
 * POST https://hentaicop.com/wp-admin/admin-ajax.php
 * Body: id={postId}&action=tooltip_action
 *
 * Response HTML structure:
 *   .ingfo
 *     .iftitle          → title
 *     .minginfo span.r  → type (class="r Hentai")
 *     .ingdesc .contexcerpt → description
 *     .linginfo span    → info fields (Status, Genres, Studio, dll)
 *
 * @param {string|number} postId - rel attribute dari a.tip
 */
async function scrapeTooltip(postId) {
  const r = await axios.post(
    `${BASE_URL}/wp-admin/admin-ajax.php`,
    `id=${postId}&action=tooltip_action`,
    {
      timeout: 10000,
      headers: {
        'User-Agent'  : UA,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Referer'     : BASE_URL,
        'X-Requested-With': 'XMLHttpRequest',
      },
    }
  );

  if (!r.data) {
    const err = new Error('Tooltip data kosong');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  const $ = cheerio.load(r.data);

  // ── Title ──────────────────────────────────────────────────
  const title = cleanText($('.iftitle').text()) || null;

  // ── Type ───────────────────────────────────────────────────
  const type = cleanText($('.minginfo .r').first().text()) || null;

  // ── Score + Duration ───────────────────────────────────────
  // .minginfo bisa berisi: score, durasi
  let score    = null;
  let duration = null;
  $('.minginfo').find('span, div').each((_, el) => {
    const txt = cleanText($(el).text()) || '';
    if (/^\d+(\.\d+)?$/.test(txt)) score = txt;
    if (/min/i.test(txt)) duration = txt;
  });

  // ── Description ────────────────────────────────────────────
  const description = cleanText($('.contexcerpt').text()) || null;

  // ── Info fields dari .linginfo span ────────────────────────
  let status  = null;
  const genres  = [];
  const studios = [];

  $('.linginfo span').each((_, span) => {
    const $span = $(span);
    const label = cleanText($span.find('b').text())?.replace(':', '').toLowerCase() || '';
    const value = cleanText($span.clone().find('b').remove().end().text().replace(/^:?\s*/, ''));

    if (label === 'status') {
      status = value || null;
    } else if (label === 'genres') {
      $span.find('a').each((__, a) => {
        const g = cleanText($(a).text());
        if (g) genres.push(g);
      });
    } else if (label === 'studio') {
      $span.find('a').each((__, a) => {
        const s = cleanText($(a).text());
        if (s) studios.push(s);
      });
    }
  });

  if (!title) {
    const err = new Error('Data tooltip tidak ditemukan');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  return { title, type, score, duration, description, status, genres, studios };
}

module.exports = { scrapeTooltip };
