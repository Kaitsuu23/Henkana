const express = require('express');
const router = express.Router();
const { scrapeSearch } = require('../scrapers/searchParser');
const { validateSearchQuery, validatePage } = require('../utils/validator');

/**
 * GET /api/search?q=keyword&page=1
 * Mencari anime berdasarkan keyword
 */
router.get('/', async (req, res, next) => {
  try {
    const { q, page = 1 } = req.query;

    // Validasi query
    const queryValidation = validateSearchQuery(q);
    if (!queryValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: queryValidation.message,
        },
      });
    }

    // Validasi page
    const pageValidation = validatePage(page);
    if (!pageValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: pageValidation.message,
        },
      });
    }

    const data = await scrapeSearch(q.trim(), parseInt(page));
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
