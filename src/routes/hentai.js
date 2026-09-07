const express = require('express');
const router  = express.Router();
const { scrapeHentai } = require('../scrapers/hentaiParser');
const { validatePage } = require('../utils/validator');

/**
 * GET /api/hentai
 * GET /api/hentai?page=2
 *
 * Mengambil daftar semua hentai dari https://hentaicop.com/hentai/
 * Support pagination.
 */
router.get('/', async (req, res, next) => {
  try {
    const { page = 1 } = req.query;

    const pageValidation = validatePage(page);
    if (!pageValidation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: pageValidation.message },
      });
    }

    const data = await scrapeHentai(parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
