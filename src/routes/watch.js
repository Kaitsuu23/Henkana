const express = require('express');
const router  = express.Router();
const { scrapeWatch }              = require('../scrapers/watchParser');
const { extractStreamFromEmbed }   = require('../scrapers/playerParser');
const { validateTargetURL }        = require('../utils/validator');

/**
 * GET /api/watch?url=https://hentaicop.com/kanojo-saimin-episode-1/
 *
 * Mengambil data halaman episode + semua stream quality sekaligus.
 * Tidak ada mode — selalu return HLS untuk semua quality yang tersedia.
 *
 * Flow:
 *   1. Scrape halaman episode → dapat servers[] (semua embed URL per quality)
 *   2. Extract HLS dari semua embed paralel
 *   3. Return data lengkap + streams[]
 */
router.get('/', async (req, res, next) => {
  try {
    const { url } = req.query;

    const validation = validateTargetURL(url);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: validation.message },
      });
    }

    // Step 1: Scrape halaman episode
    const watchData = await scrapeWatch(url);

    // Step 2: Extract HLS dari semua server paralel
    const streamResults = await Promise.allSettled(
      watchData.servers.map(async (server) => {
        const result = await extractStreamFromEmbed(server.embedUrl);
        // Parse quality dari nama server: "LocalStream_720p" → "720p"
        const qualityMatch = server.name.match(/(\d+p)/i);
        const quality = qualityMatch ? qualityMatch[1] : server.name;
        return {
          quality,
          serverName: server.name,
          hlsUrl    : result.hlsUrl,
          sources   : result.sources,
        };
      })
    );

    // Filter yang berhasil dan punya HLS URL
    const streams = streamResults
      .filter(r => r.status === 'fulfilled' && r.value?.hlsUrl)
      .map(r => r.value);

    return res.status(200).json({
      success: true,
      data   : {
        ...watchData,
        streams, // array semua quality yang berhasil di-extract
      },
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
