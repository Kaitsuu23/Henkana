const express = require('express');
const router  = express.Router();
const { scrapeListMode } = require('../scrapers/listModeParser');

/**
 * GET /api/list-mode
 * GET /api/list-mode?title=A
 * GET /api/list-mode?title=[
 *
 * Mengambil daftar semua series dalam mode teks (tanpa thumbnail),
 * dikelompokkan per huruf alfabet.
 *
 * Query params:
 *   title {string} - filter huruf awal: A-Z, [ (untuk simbol), atau kosong = semua
 */
router.get('/', async (req, res, next) => {
  try {
    const { title = '' } = req.query;

    // Validasi title: hanya satu karakter huruf/simbol
    if (title && title.length > 1) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Parameter title harus satu karakter' },
      });
    }

    const data = await scrapeListMode(title);
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
