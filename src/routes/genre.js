const express = require('express');
const router = express.Router();
const { scrapeGenreList, scrapeGenreAnime } = require('../scrapers/genreParser');
const { validateSlug, validatePage } = require('../utils/validator');

/**
 * GET /api/genre
 * Mengambil daftar semua genre yang tersedia
 */
router.get('/', async (req, res, next) => {
  try {
    const data = await scrapeGenreList();
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/genre/:slug?page=1
 * Mengambil daftar anime berdasarkan genre dengan pagination
 *
 * Contoh: GET /api/genre/milf?page=2
 */
router.get('/:slug', async (req, res, next) => {
  try {
    const { slug } = req.params;
    const { page = 1 } = req.query;

    // Validasi slug
    const slugValidation = validateSlug(slug);
    if (!slugValidation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: slugValidation.message,
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

    const data = await scrapeGenreAnime(slug, parseInt(page));
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
