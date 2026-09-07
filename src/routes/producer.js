const express = require('express');
const router  = express.Router();
const { scrapeProducerList, scrapeProducerAnime } = require('../scrapers/producerParser');
const { validateSlug, validatePage } = require('../utils/validator');

/**
 * GET /api/producer
 * Mengambil daftar semua producer.
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await scrapeProducerList();
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/producer/:slug
 * GET /api/producer/:slug?page=2
 *
 * Mengambil daftar anime berdasarkan producer dengan pagination.
 * Contoh: GET /api/producer/mary-jane
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

    const data = await scrapeProducerAnime(slug, parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
