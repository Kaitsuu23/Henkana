const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const url = `${API_BASE}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      // Selalu ambil data fresh dari API — tanpa cache.
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error?.message || 'Unknown API error');
    }

    return data;
  } catch (error) {
    console.error(`Fetch API Error [${endpoint}]:`, error);
    throw error;
  }
}

export async function getHome() {
  return fetchAPI('/home');
}

export async function getSearch(query: string, page = 1) {
  return fetchAPI(`/search?q=${encodeURIComponent(query)}&page=${page}`);
}

export async function getDetail(url: string) {
  return fetchAPI(`/detail?url=${encodeURIComponent(url)}`);
}

export async function getWatch(url: string) {
  return fetchAPI(`/watch?url=${encodeURIComponent(url)}`);
}

export async function getManga(page = 1) {
  return fetchAPI(`/manga?page=${page}`);
}

export async function getSidebar() {
  return fetchAPI('/sidebar');
}

export async function getHentai(page = 1) {
  return fetchAPI(`/hentai?page=${page}`);
}

export async function getTerbaru(page = 1) {
  return fetchAPI(`/daftar-series?order=update&page=${page}`);
}

export async function getSeries(params: Record<string, string | number | string[]>) {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach(v => p.append(key, v));
    } else if (value !== '' && value !== undefined && value !== null) {
      if (key === 'page' && Number(value) <= 1) return;
      p.append(key, String(value));
    }
  });
  return fetchAPI(`/daftar-series?${p.toString()}`);
}

export async function getSeriesFilters() {
  return fetchAPI('/daftar-series/filters');
}

export async function getListMode(title = '') {
  const qs = title ? `?title=${encodeURIComponent(title)}` : '';
  return fetchAPI(`/list-mode${qs}`);
}

export async function getGenres() {
  return fetchAPI('/genre');
}

export async function getGenreSlug(slug: string, page = 1) {
  return fetchAPI(`/genre/${encodeURIComponent(slug)}?page=${page}`);
}

export async function get2D(page = 1) {
  return fetchAPI(`/2d?page=${page}`);
}

export async function getJav(page = 1) {
  return fetchAPI(`/jav?page=${page}`);
}

export async function getUncensored(page = 1) {
  return fetchAPI(`/uncensored?page=${page}`);
}

export async function getStudios() {
  return fetchAPI('/studio');
}

export async function getStudioSlug(slug: string, page = 1) {
  return fetchAPI(`/studio/${encodeURIComponent(slug)}?page=${page}`);
}

export async function getProducers() {
  return fetchAPI('/producer');
}

export async function getProducerSlug(slug: string, page = 1) {
  return fetchAPI(`/producer/${encodeURIComponent(slug)}?page=${page}`);
}

export async function getDoujinshi(page = 1) {
  return fetchAPI(`/doujinshi?page=${page}`);
}

export async function getManhwa(page = 1) {
  return fetchAPI(`/manhwa?page=${page}`);
}

export async function getMangaDetail(url: string) {
  return fetchAPI(`/manga-detail?url=${encodeURIComponent(url)}`);
}

export async function getMangaGenreSlug(slug: string, page = 1) {
  return fetchAPI(`/manga-genre/${encodeURIComponent(slug)}?page=${page}`);
}

export async function getMangaRead(url: string) {
  return fetchAPI(`/manga-read?url=${encodeURIComponent(url)}`);
}
