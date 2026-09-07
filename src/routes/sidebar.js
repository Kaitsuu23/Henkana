const express = require('express');
const router  = express.Router();
const { scrapeSidebar }  = require('../scrapers/sidebarParser');
const { validateTargetURL } = require('../utils/validator');

/**
 * GET /api/sidebar
 * Mengambil data sidebar "Paling Banyak Di Tonton"
 * Berisi tiga tab: Video Mingguan, Komik Mingguan, Semua
 *
 * Query param opsional:
 *   ?url=https://hentaicop.com/series/...
 * Berguna jika ingin ambil sidebar dari konteks halaman tertentu.
 */
router.get('/', async (req, res, next) => {
  try {
    const { url } = req.query;

    if (url) {
      const validation = validateTargetURL(url);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code   : 'BAD_REQUEST',
            message: validation.message,
          },
        });
      }
    }

    const data = await scrapeSidebar(url || null);
    return res.status(200).json({
      success: true,
      ...data,
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
