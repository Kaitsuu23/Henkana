const express = require('express');
const router  = express.Router();
const { scrapeUncensored } = require('../scrapers/uncensoredParser');
const { validatePage }     = require('../utils/validator');

/**
 * GET /api/uncensored
 * GET /api/uncensored?page=2
 *
 * Mengambil daftar hentai uncensored dari https://hentaicop.com/uncensored/
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

    const data = await scrapeUncensored(parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
