const express = require('express');
const router  = express.Router();
const { scrapeMangaGenre } = require('../scrapers/mangaGenreParser');
const { validateSlug, validatePage } = require('../utils/validator');

/**
 * GET /api/manga-genre/:slug
 * GET /api/manga-genre/:slug?page=2
 *
 * Daftar manga berdasarkan genre dari /manga-genre/:slug/
 * Contoh: GET /api/manga-genre/adult
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

    const data = await scrapeMangaGenre(slug, parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
