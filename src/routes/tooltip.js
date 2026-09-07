const express = require('express');
const router  = express.Router();
const { scrapeTooltip } = require('../scrapers/tooltipParser');

/**
 * GET /api/tooltip/:id
 *
 * Fetch tooltip data untuk card anime dari WP admin-ajax.
 * :id adalah nilai dari attribute rel="..." pada a.tip di HTML hentaicop.com
 *
 * Contoh: GET /api/tooltip/17167
 */
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id || !/^\d+$/.test(id)) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'ID harus berupa angka' },
      });
    }

    const data = await scrapeTooltip(id);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
