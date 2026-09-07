const express = require('express');
const router  = express.Router();
const { scrapeStudioList, scrapeStudioAnime } = require('../scrapers/studioParser');
const { validateSlug, validatePage } = require('../utils/validator');

/**
 * GET /api/studio
 * Mengambil daftar semua studio.
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await scrapeStudioList();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/studio/:slug
 * GET /api/studio/:slug?page=2
 *
 * Mengambil daftar anime berdasarkan studio dengan pagination.
 * Contoh: GET /api/studio/t-rex?page=1
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1 } = req.query;

    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: slugValidation.message },
      });
    }

    const pageValidation = validatePage(page);
    if (!pageValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: pageValidation.message },
      });
    }

    const data = await scrapeStudioAnime(slug, parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
