const axios = require('axios');

// On Vercel (serverless), keep retries low so we stay within the 10s limit.
// LOCAL / non-Vercel: allow more retries via env vars.
const IS_VERCEL = !!process.env.VERCEL;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES) || (IS_VERCEL ? 1 : 3);
const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT) || (IS_VERCEL ? 7000 : 15000);

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0',
];

/**
 * Ambil random User-Agent dari daftar
 */
function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * Delay helper untuk jeda antar retry
 * @param {number} ms - milidetik
 */
function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch HTML dari URL dengan retry otomatis dan exponential backoff
 * @param {string} url  - URL yang akan di-fetch
 * @param {number} retries - jumlah retry tersisa
 * @returns {Promise<string>} HTML string
 */
async function fetchHTML(url, retries = MAX_RETRIES) {
  try {
    const response = await axios.get(url, {
      timeout: REQUEST_TIMEOUT,
      headers: {
        'User-Agent': getRandomUserAgent(),
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9,id;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        Connection: 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Cache-Control': 'max-age=0',
        Referer: process.env.BASE_URL || 'https://hentaicop.com',
      },
      maxRedirects: 5,
    });

    return response.data;
  } catch (error) {
    const status = error.response?.status;

    // Jangan retry untuk 404 / 403 — tidak akan berubah
    if (status === 404) {
      const err = new Error('Halaman tidak ditemukan di target website');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (status === 403) {
      const err = new Error('Akses ditolak oleh target website');
      err.statusCode = 502;
      err.code = 'ACCESS_DENIED';
      throw err;
    }

    // Rate limited
    if (status === 429) {
      const err = new Error('Target website membatasi request (rate limit)');
      err.statusCode = 429;
      err.code = 'RATE_LIMITED';
      throw err;
    }

    // Timeout
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      if (retries > 0) {
        const backoff = (MAX_RETRIES - retries + 1) * 1500;
        await delay(backoff);
        return fetchHTML(url, retries - 1);
      }
      const err = new Error('Request timeout ke target website');
      err.statusCode = 502;
      err.code = 'TIMEOUT';
      throw err;
    }

    // Retry untuk error lain (5xx, network error, dll)
    if (retries > 0) {
      const backoff = (MAX_RETRIES - retries + 1) * 1000;
      await delay(backoff);
      return fetchHTML(url, retries - 1);
    }

    // Habis retry
    const err = new Error('Gagal mengakses target website setelah beberapa percobaan');
    err.statusCode = 502;
    err.code = 'TARGET_UNREACHABLE';
    throw err;
  }
}

module.exports = { fetchHTML };
