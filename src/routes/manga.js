const express = require('express');
const router  = express.Router();
const { scrapeManga } = require('../scrapers/mangaParser');
const { validatePage } = require('../utils/validator');

/**
 * GET /api/manga
 * GET /api/manga?page=2
 *
 * Mengambil daftar manga/manhwa dari https://hentaicop.com/manga/
 * Response berisi beberapa section: Paling Populer, Latest Update,
 * Doujinshi & Manga, Manhwa — dengan pagination.
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

    const data = await scrapeManga(parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
