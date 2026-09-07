const express = require('express');
const router  = express.Router();
const { scrapeListing } = require('../scrapers/listingParser');
const { validatePage }  = require('../utils/validator');

/**
 * GET /api/2d
 * GET /api/2d?page=2
 *
 * Mengambil daftar konten 2D dari https://hentaicop.com/2d/
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

    const data = await scrapeListing('2d', parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
