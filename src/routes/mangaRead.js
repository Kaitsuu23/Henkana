const express = require('express');
const router  = express.Router();
const { scrapeMangaRead } = require('../scrapers/mangaReadParser');

const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';

/**
 * GET /api/manga-read?url=https://hentaicop.com/manga/living-with-my-teacher/?chapter=chapter-1
 *
 * Mengambil semua halaman gambar dari satu chapter manga.
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

    const allowed = new URL(BASE_URL).hostname;
    if (parsed.hostname !== allowed) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: `URL harus dari domain ${allowed}` },
      });
    }

    // Harus ada query param chapter
    if (!parsed.searchParams.get('chapter')) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'URL harus mengandung parameter ?chapter=chapter-N' },
      });
    }

    const data = await scrapeMangaRead(url);
    return res.status(200).json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
