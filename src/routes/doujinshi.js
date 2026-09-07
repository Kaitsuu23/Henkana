const express = require('express');
const router  = express.Router();
const { scrapeDoujinshi } = require('../scrapers/doujinshiParser');
const { validatePage }    = require('../utils/validator');

/**
 * GET /api/doujinshi
 * GET /api/doujinshi?page=2
 *
 * Daftar manga & doujinshi dari /?manga_type_tax=manga,doujinshi
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

    const data = await scrapeDoujinshi(parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
