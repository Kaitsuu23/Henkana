const express = require('express');
const router = express.Router();
const { scrapeDetail } = require('../scrapers/detailParser');
const { validateTargetURL } = require('../utils/validator');

/**
 * GET /api/detail?url=https://hentaicop.com/series/...
 * Mengambil informasi detail dari halaman anime
 */
router.get('/', async (req, res, next) => {
  try {
    const { url } = req.query;

    // Validasi URL
    const validation = validateTargetURL(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: validation.message,
        },
      });
    }

    const data = await scrapeDetail(url);
    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
