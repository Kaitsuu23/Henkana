const express = require('express');
const router  = express.Router();
const { scrapeManhwa } = require('../scrapers/manhwaParser');
const { validatePage } = require('../utils/validator');

/**
 * GET /api/manhwa
 * GET /api/manhwa?page=2
 *
 * Daftar manhwa dari /manga-type/manhwa/
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

    const data = await scrapeManhwa(parseInt(page));
    return res.status(200).json({ success: true, ...data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
