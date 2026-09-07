const express = require('express');
const router  = express.Router();
const { scrapeMangaDetail } = require('../scrapers/mangaDetailParser');

/**
 * GET /api/manga-detail?url=https://hentaicop.com/manga/living-with-my-teacher/
 *
 * Mengambil detail halaman manga (Manhwa/Doujinshi).
 */
router.get('/', async (req, res, next) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Parameter url wajib diisi' },
      });
    }

    let parsed;
    try { parsed = new URL(url); } catch {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Format URL tidak valid' },
      });
    }

    const allowed = new URL(process.env.BASE_URL || 'https://hentaicop.com').hostname;
    if (parsed.hostname !== allowed) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `URL harus dari domain ${allowed}` },
      });
    }

    const data = await scrapeMangaDetail(url);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
