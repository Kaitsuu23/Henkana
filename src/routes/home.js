const express = require('express');
const router = express.Router();
const { scrapeHome } = require('../scrapers/homeParser');

/**
 * GET /api/home
 * Mengambil data dari halaman utama hentaicop.com
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await scrapeHome();
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
