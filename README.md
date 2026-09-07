# hentaicop-api

REST API scraper untuk [hentaicop.com](https://hentaicop.com) menggunakan Node.js, Express.js, Axios, dan Cheerio. Tanpa headless browser — pure HTTP request + HTML parsing.

## Teknologi

- **Node.js** >= 18
- **Express.js** — HTTP server & routing
- **Axios** — HTTP request ke target website
- **Cheerio** — parsing HTML
- **dotenv** — environment variable
- **CORS** — cross-origin resource sharing

## Instalasi

```bash
cd hentaicop-api
npm install
copy .env.example .env
npm start        # production
npm run dev      # development (nodemon)
```

## Konfigurasi `.env`

```env
PORT=3000
BASE_URL=https://hentaicop.com
CORS_ORIGIN=*
REQUEST_TIMEOUT=15000
MAX_RETRIES=3
```

| Variable | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server |
| `BASE_URL` | `https://hentaicop.com` | Base URL target |
| `CORS_ORIGIN` | `*` | Allowed origin, pisah koma untuk multiple |
| `REQUEST_TIMEOUT` | `15000` | Timeout request (ms) |
| `MAX_RETRIES` | `3` | Maksimal retry saat request gagal |

---

## Endpoints

### `GET /api/home`
Data halaman utama — berisi beberapa section (Baru Ditambahkan, Hentai, Komik Hentai, JAV, Rekomendasi).

```
GET /api/home
```

**Response:**
```json
{
  "success": true,
  "source": "https://hentaicop.com",
  "totalSections": 5,
  "sections": [
    {
      "section": "Baru ditambahkan!",
      "type": "anime",
      "data": [
        {
          "title": "Kanojo Saimin",
          "thumbnail": "https://...",
          "url": "https://hentaicop.com/kanojo-saimin-episode-2/",
          "lastEpisode": "Ep 2",
          "type": "Hentai",
          "status": "Sub"
        }
      ]
    },
    {
      "section": "Komik Hentai",
      "type": "manga",
      "data": [
        {
          "title": "My Girlfriend Was Already Fully Trained",
          "thumbnail": "https://...",
          "url": "https://hentaicop.com/manga/my-girlfriend-was-already-fully-trained/",
          "type": "🇰🇷 Manhwa",
          "typeUrl": "https://hentaicop.com/manga-type/manhwa/",
          "views": "3,114",
          "score": "7.9",
          "latestChapters": [
            { "chapter": "Chapter 39", "url": "...", "date": "20 hr" }
          ]
        }
      ]
    }
  ]
}
```

---

### `GET /api/search`
Cari anime/manga berdasarkan keyword.

```
GET /api/search?q=kanojo
GET /api/search?q=kanojo&page=2
```

| Parameter | Wajib | Keterangan |
|---|---|---|
| `q` | Ya | Keyword pencarian (min. 2 karakter) |
| `page` | Tidak | Nomor halaman (default: 1) |

**Response:**
```json
{
  "success": true,
  "query": "kanojo",
  "page": 1,
  "totalPages": 4,
  "hasNextPage": true,
  "hasPrevPage": false,
  "total": 10,
  "data": [
    {
      "title": "Kanojo Saimin",
      "thumbnail": "https://...",
      "url": "https://hentaicop.com/daftar-series/kanojo-saimin/",
      "type": "Hentai",
      "status": "Completed",
      "episode": null
    }
  ]
}
```

---

### `GET /api/detail`
Detail lengkap halaman daftar-series/anime.

```
GET /api/detail?url=https://hentaicop.com/daftar-series/kanojo-saimin/
```

| Parameter | Wajib | Keterangan |
|---|---|---|
| `url` | Ya | URL daftar-series (harus dari domain hentaicop.com) |

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Kanojo Saimin",
    "thumbnail": "https://...",
    "description": "Tenryuuji Koto...",
    "alternativeTitles": ["Hypnosis Girlfriend", "彼女催眠"],
    "genres": [{ "name": "Ahegao", "url": "https://hentaicop.com/genres/ahegao/" }],
    "status": "Completed",
    "type": "Hentai",
    "censor": "Censored",
    "released": "2026",
    "studios": [{ "name": "T-Rex", "url": "https://hentaicop.com/studio/t-rex/" }],
    "director": [{ "name": "Raika Ken", "url": "https://hentaicop.com/director/raika-ken/" }],
    "casts": [],
    "episodes": {
      "total": 2,
      "list": [
        {
          "number": "2",
          "title": "Kanojo Saimin Episode 2",
          "url": "https://hentaicop.com/kanojo-saimin-episode-2/",
          "date": "August 29, 2026",
          "sub": "Sub"
        }
      ]
    },
    "related": []
  }
}
```

---

### `GET /api/watch`
Data halaman episode — server stream, download links, navigasi prev/next.

**Mode Basic** (default, ~1-2 detik — scrape HTML biasa):
```
GET /api/watch?url=https://hentaicop.com/kanojo-saimin-episode-1/
GET /api/watch?url=...&mode=basic
```

**Mode Stream** (~1-3 detik — decode obfuscated player via HTTP, extract HLS m3u8 langsung):
```
GET /api/watch?url=...&mode=stream
GET /api/watch?url=...&mode=stream&quality=480p
```

Keduanya menggunakan **pure HTTP + Cheerio**, tidak ada headless browser.

| Parameter | Wajib | Keterangan |
|---|---|---|
| `url` | Ya | URL halaman episode |
| `mode` | Tidak | `basic` (default) atau `stream` |
| `quality` | Tidak | `720p` (default), `480p`, `360p` — hanya untuk mode stream |

**Response mode basic:**
```json
{
  "success": true,
  "mode": "basic",
  "data": {
    "title": "Kanojo Saimin Episode 1",
    "daftar-series": {
      "title": "Kanojo Saimin",
      "url": "https://hentaicop.com/daftar-series/kanojo-saimin/",
      "thumbnail": "https://..."
    },
    "activeEmbed": "https://hentaicop.com/play.php?id=...",
    "servers": [
      { "name": "LocalStream_720p", "embedUrl": "https://hentaicop.com/play.php?id=..." },
      { "name": "LocalStream_480p", "embedUrl": "https://hentaicop.com/play.php?id=..." }
    ],
    "downloads": [
      { "server": "HepiDrive (Cepat)", "quality": "720p", "size": "116.63 MB", "url": "https://hepidrive.com/download/..." }
    ],
    "navigation": {
      "prev": null,
      "next": "https://hentaicop.com/kanojo-saimin-episode-2/"
    }
  }
}
```

**Tambahan field untuk mode stream:**
```json
"stream": {
  "quality": "720p",
  "hlsUrl": "https://cdn.site/hls/...index-v1-a1.m3u8?md5=...&expires=...",
  "sources": [{ "type": "hls", "file": "https://..." }],
  "note": "URL HLS bersifat signed dan akan expired dalam beberapa jam"
}
```

> HLS URL bersifat **signed** (`md5` + `expires`) — valid beberapa jam saja, jangan di-cache terlalu lama. Decode dilakukan via HTTP tanpa browser.

---

### `GET /api/daftar-series`
Daftar semua daftar-series dengan filter dan pagination.

```
GET /api/daftar-series
GET /api/daftar-series?page=2
GET /api/daftar-series?status=ongoing&order=update
GET /api/daftar-series?genre[]=action&genre[]=romance&page=1
```

| Parameter | Keterangan |
|---|---|
| `page` | Nomor halaman (default: 1) |
| `status` | `ongoing` \| `completed` |
| `type` | `manga` \| `manhwa` \| `manhua` |
| `order` | `update` (Latest Update) \| `popular` |
| `genre[]` | Slug genre, bisa multiple: `genre[]=action&genre[]=romance` |

**Response:**
```json
{
  "success": true,
  "page": 1,
  "hasNextPage": true,
  "hasPrevPage": false,
  "nextPage": "https://hentaicop.com/daftar-series/?page=2",
  "prevPage": null,
  "filters": { "genre": [], "status": null, "type": null, "order": null },
  "total": 30,
  "data": [{ "title": "...", "thumbnail": "...", "url": "...", "lastEpisode": "...", "type": "...", "status": "..." }]
}
```

---

### `GET /api/hentai`
Daftar semua hentai dari `/hentai/` dengan pagination.

```
GET /api/hentai
GET /api/hentai?page=2
```

---

### `GET /api/uncensored`
Daftar hentai uncensored dari `/uncensored/` dengan pagination.

```
GET /api/uncensored
GET /api/uncensored?page=2
```

---

### `GET /api/jav`
Daftar JAV dari `/jav/` dengan pagination.

```
GET /api/jav
GET /api/jav?page=2
```

---

### `GET /api/2d`
Daftar konten 2D dari `/2d/` dengan pagination.

```
GET /api/2d
GET /api/2d?page=2
```

> Response `/api/hentai`, `/api/uncensored`, `/api/jav`, `/api/2d` menggunakan format yang sama:
> ```json
> {
>   "success": true,
>   "page": 1,
>   "totalPages": 124,
>   "hasNextPage": true,
>   "hasPrevPage": false,
>   "nextPage": "https://...",
>   "prevPage": null,
>   "total": 10,
>   "data": [{ "title": "...", "thumbnail": "...", "url": "...", "lastEpisode": "...", "type": "...", "status": "..." }]
> }
> ```

---

### `GET /api/manga`
Daftar manga/manhwa dari `/manga/` — berisi 4 section dengan pagination dan see more links.

```
GET /api/manga
GET /api/manga?page=2
```

`page` hanya berlaku untuk section **LATEST UPDATE**. Section lain punya `seeMore` link.

**Response:**
```json
{
  "success": true,
  "page": 1,
  "totalSections": 4,
  "sections": [
    {
      "section": "PALING POPULER",
      "total": 4,
      "pagination": null,
      "seeMore": null,
      "data": [...]
    },
    {
      "section": "LATEST UPDATE",
      "total": 12,
      "pagination": { "currentPage": 1, "totalPages": 35, "hasNextPage": true, "nextPage": "...", "prevPage": null },
      "seeMore": null,
      "data": [...]
    },
    {
      "section": "DOUJINSHI & MANGA",
      "total": 12,
      "pagination": null,
      "seeMore": "https://hentaicop.com/?manga_type_tax=manga,doujinshi",
      "data": [...]
    },
    {
      "section": "MANHWA",
      "total": 12,
      "pagination": null,
      "seeMore": "https://hentaicop.com/manga-type/manhwa/",
      "data": [...]
    }
  ]
}
```

Tiap item manga:
```json
{
  "title": "My Girlfriend Was Already Fully Trained",
  "thumbnail": "https://...",
  "url": "https://hentaicop.com/manga/my-girlfriend-was-already-fully-trained/",
  "type": "🇰🇷 Manhwa",
  "typeUrl": "https://hentaicop.com/manga-type/manhwa/",
  "latestChapters": [
    { "chapter": "Chapter 39", "badge": null, "url": "...?chapter=chapter-39", "date": "20 hr" },
    { "chapter": "Chapter 38", "badge": null, "url": "...?chapter=chapter-38", "date": "7 d" }
  ]
}
```

---

### `GET /api/genre`
Daftar semua genre.

```
GET /api/genre
```

**Response:**
```json
{
  "success": true,
  "total": 35,
  "data": [{ "name": "MILF", "slug": "milf", "url": "https://hentaicop.com/genres/milf/", "count": 42 }]
}
```

---

### `GET /api/genre/:slug`
Daftar anime berdasarkan genre dengan pagination.

```
GET /api/genre/milf
GET /api/genre/milf?page=2
```

---

### `GET /api/studio`
Daftar semua studio.

```
GET /api/studio
```

**Response:**
```json
{
  "success": true,
  "total": 153,
  "data": [{ "name": "T-Rex", "slug": "t-rex", "url": "https://hentaicop.com/studio/t-rex/", "count": 148 }]
}
```

---

### `GET /api/studio/:slug`
Daftar anime berdasarkan studio dengan pagination.

```
GET /api/studio/t-rex
GET /api/studio/t-rex?page=2
```

---

### `GET /api/producer`
Daftar semua producer.

```
GET /api/producer
```

**Response:**
```json
{
  "success": true,
  "total": 194,
  "data": [{ "name": "Mary Jane", "slug": "mary-jane", "url": "https://hentaicop.com/producer/mary-jane/", "count": 12 }]
}
```

---

### `GET /api/producer/:slug`
Daftar anime berdasarkan producer dengan pagination.

```
GET /api/producer/mary-jane
GET /api/producer/mary-jane?page=2
```

---

### `GET /api/sidebar`
Data sidebar "Paling Banyak Ditonton" — 3 tab: Video Mingguan, Komik Mingguan, Semua.

```
GET /api/sidebar
```

**Response:**
```json
{
  "success": true,
  "popular": [
    {
      "tab": "Video Mingguan",
      "total": 10,
      "items": [
        {
          "rank": "1",
          "title": "Kanojo Saimin",
          "url": "https://hentaicop.com/daftar-series/kanojo-saimin/",
          "thumbnail": "https://...",
          "genres": ["Ahegao", "Anal"],
          "rating": null
        }
      ]
    }
  ]
}
```

---

### `GET /health`
Health check.

```json
{
  "success": true,
  "status": "OK",
  "timestamp": "2026-09-02T10:00:00.000Z",
  "baseUrl": "https://hentaicop.com"
}
```

---

## Error Response

```json
{
  "success": false,
  "error": {
    "code": "NOT_FOUND",
    "message": "Data tidak ditemukan"
  }
}
```

| HTTP Status | Code | Keterangan |
|---|---|---|
| `400` | `BAD_REQUEST` | Parameter tidak valid |
| `404` | `NOT_FOUND` | Data tidak ditemukan |
| `404` | `ROUTE_NOT_FOUND` | Route tidak ada |
| `429` | `RATE_LIMITED` | Target website membatasi request |
| `500` | `INTERNAL_SERVER_ERROR` | Error server |
| `502` | `BAD_GATEWAY` | Gagal mengakses target website |
| `502` | `PARSE_ERROR` | Format player tidak dikenali |
| `502` | `TIMEOUT` | Request timeout |

---

## Ringkasan Endpoint

| Method | Endpoint | Keterangan |
|---|---|---|
| GET | `/api/home` | Halaman utama (multi-section) |
| GET | `/api/search?q=` | Pencarian anime/manga |
| GET | `/api/detail?url=` | Detail daftar-series |
| GET | `/api/watch?url=` | Halaman episode (stream + download) |
| GET | `/api/daftar-series` | Daftar semua daftar-series + filter |
| GET | `/api/hentai` | Daftar hentai (pagination) |
| GET | `/api/uncensored` | Daftar uncensored (pagination) |
| GET | `/api/jav` | Daftar JAV (pagination) |
| GET | `/api/2d` | Daftar 2D (pagination) |
| GET | `/api/manga` | Daftar manga/manhwa (multi-section) |
| GET | `/api/genre` | Daftar semua genre |
| GET | `/api/genre/:slug` | Anime per genre (pagination) |
| GET | `/api/studio` | Daftar semua studio |
| GET | `/api/studio/:slug` | Anime per studio (pagination) |
| GET | `/api/producer` | Daftar semua producer |
| GET | `/api/producer/:slug` | Anime per producer (pagination) |
| GET | `/api/sidebar` | Sidebar paling banyak ditonton |
| GET | `/health` | Health check |

---

## Struktur Project

```
hentaicop-api/
├── src/
│   ├── app.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── home.js
│   │   ├── search.js
│   │   ├── detail.js
│   │   ├── watch.js
│   │   ├── daftar-series.js
│   │   ├── hentai.js
│   │   ├── uncensored.js
│   │   ├── jav.js
│   │   ├── twod.js          # /api/2d
│   │   ├── manga.js
│   │   ├── genre.js
│   │   ├── studio.js
│   │   ├── producer.js
│   │   └── sidebar.js
│   ├── scrapers/
│   │   ├── homeParser.js
│   │   ├── searchParser.js
│   │   ├── detailParser.js
│   │   ├── watchParser.js
│   │   ├── playerParser.js
│   │   ├── daftar-seriesParser.js
│   │   ├── listingParser.js  # generic untuk hentai/jav/2d/uncensored
│   │   ├── hentaiParser.js
│   │   ├── uncensoredParser.js
│   │   ├── mangaParser.js
│   │   ├── genreParser.js
│   │   ├── studioParser.js
│   │   ├── producerParser.js
│   │   └── sidebarParser.js
│   └── utils/
│       ├── fetcher.js        # Axios HTTP client + retry + UA rotation
│       └── validator.js      # Input validation
├── .env
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Lisensi

MIT
