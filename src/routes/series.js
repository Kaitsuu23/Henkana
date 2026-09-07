const express = require('express');
const router  = express.Router();
const { scrapeSeries, scrapeSeriesFilters } = require('../scrapers/seriesParser');

/**
 * GET /api/daftar-series/filters
 * Ambil semua opsi filter (genre, season, studio, status, type, order)
 */
router.get('/filters', async (req, res, next) => {
  try {
    const data = await scrapeSeriesFilters();
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

const { validatePage } = require('../utils/validator');

const VALID_STATUS = ['', 'ongoing', 'completed'];
const VALID_ORDER  = ['', 'update', 'popular'];

/**
 * GET /api/series
 *
 * Mengambil daftar series dari https://hentaicop.com/series/
 * Mendukung filter dan pagination via query params.
 *
 * Query params (semua opsional):
 *   page     {number}   - nomor halaman (default: 1)
 *   status   {string}   - '' | 'ongoing' | 'completed'
 *   type     {string}   - '' | 'manga' | 'manhwa' | 'manhua'
 *   order    {string}   - '' (Newest) | 'update' (Latest Update) | 'popular'
 *   genre    {string}   - satu genre slug, contoh: genre=action
 *   genre[]  {string[]} - multiple genre, contoh: genre[]=action&genre[]=romance
 *
 * Contoh:
 *   GET /api/series
 *   GET /api/series?page=2
 *   GET /api/series?status=ongoing&order=update
 *   GET /api/series?genre[]=action&genre[]=romance&page=1
 */
router.get('/', async (req, res, next) => {
  try {
    const {
      page   = 1,
      status = '',
      type   = '',
      sub    = '',
      order  = '',
    } = req.query;

    // multi-value params
    const toArr = (v) => !v ? [] : Array.isArray(v) ? v : [v];
    const genreArr  = toArr(req.query['genre[]']  || req.query['genre']);
    const seasonArr = toArr(req.query['season[]'] || req.query['season']);
    const studioArr = toArr(req.query['studio[]'] || req.query['studio']);

    const pageValidation = validatePage(page);
    if (!pageValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: pageValidation.message },
      });
    }

    const data = await scrapeSeries({
      genre  : genreArr,
      season : seasonArr,
      studio : studioArr,
      status,
      type,
      sub,
      order,
      page   : parseInt(page),
    });

    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
