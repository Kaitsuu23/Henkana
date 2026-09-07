require('dotenv').config();

const express = require('express');
const cors = require('cors');

const homeRoute       = require('./routes/home');
const searchRoute     = require('./routes/search');
const detailRoute     = require('./routes/detail');
const genreRoute      = require('./routes/genre');
const sidebarRoute    = require('./routes/sidebar');
const watchRoute      = require('./routes/watch');
const hentaiRoute     = require('./routes/hentai');
const mangaRoute      = require('./routes/manga');
const uncensoredRoute = require('./routes/uncensored');
const twodRoute       = require('./routes/twod');
const javRoute        = require('./routes/jav');
const studioRoute     = require('./routes/studio');
const producerRoute   = require('./routes/producer');
const seriesRoute     = require('./routes/series');
const listModeRoute   = require('./routes/listMode');
const tooltipRoute    = require('./routes/tooltip');
const proxyRoute      = require('./routes/proxy');
const doujinshiRoute   = require('./routes/doujinshi');
const manhwaRoute      = require('./routes/manhwa');
const mangaDetailRoute = require('./routes/mangaDetail');
const mangaGenreRoute  = require('./routes/mangaGenre');
const mangaReadRoute   = require('./routes/mangaRead');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';

// ── CORS ─────────────────────────────────────────────────────
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? '*' : CORS_ORIGIN.split(',').map((o) => o.trim()),
    methods: ['GET'],
    allowedHeaders: ['Content-Type', 'Accept'],
  })
);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json());

// ── Request logger ────────────────────────────────────────────
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// ── Routes ────────────────────────────────────────────────────
app.use('/api/home',        homeRoute);
app.use('/api/search',      searchRoute);
app.use('/api/detail',      detailRoute);
app.use('/api/genre',       genreRoute);
app.use('/api/sidebar',     sidebarRoute);
app.use('/api/watch',       watchRoute);
app.use('/api/hentai',      hentaiRoute);
app.use('/api/manga',       mangaRoute);
app.use('/api/uncensored',  uncensoredRoute);
app.use('/api/2d',          twodRoute);
app.use('/api/jav',         javRoute);
app.use('/api/studio',      studioRoute);
app.use('/api/producer',    producerRoute);
app.use('/api/daftar-series', seriesRoute);
app.use('/api/tooltip',      tooltipRoute);
app.use('/api/proxy',        proxyRoute);
app.use('/api/list-mode',    listModeRoute);
app.use('/api/doujinshi',     doujinshiRoute);
app.use('/api/manhwa',        manhwaRoute);
app.use('/api/manga-detail',  mangaDetailRoute);
app.use('/api/manga-genre',   mangaGenreRoute);
app.use('/api/manga-read',    mangaReadRoute);
app.use('/api/watch',        watchRoute);

// ── Health check ──────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    baseUrl: process.env.BASE_URL || 'https://hentaicop.com',
  });
});

// ── Root info ─────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    name: 'hentaicop-api',
    version: '1.0.0',
    baseUrl: process.env.BASE_URL || 'https://hentaicop.com',
    endpoints: {
      home       : 'GET /api/home',
      search     : 'GET /api/search?q=keyword&page=1',
      detail     : 'GET /api/detail?url=https://hentaicop.com/series/...',
      watch      : 'GET /api/watch?url=... (mode=basic|stream, quality=720p|480p|360p)',
      sidebar    : 'GET /api/sidebar',
      genreList  : 'GET /api/genre',
      genreAnime : 'GET /api/genre/:slug?page=1',
      health     : 'GET /health',
    },
  });
});

// ── Error handlers ────────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`hentaicop-api berjalan di http://localhost:${PORT}`);
  console.log(`Base URL target : ${process.env.BASE_URL || 'https://hentaicop.com'}`);
  console.log(`CORS Origin     : ${CORS_ORIGIN}`);
  console.log(`\nEndpoints tersedia:`);
  console.log(`  GET /api/home`);
  console.log(`  GET /api/search?q=keyword`);
  console.log(`  GET /api/detail?url=https://hentaicop.com/series/...`);
  console.log(`  GET /api/genre`);
  console.log(`  GET /api/genre/:slug?page=1`);
  console.log(`  GET /health\n`);
});

module.exports = app;
