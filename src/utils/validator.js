const BASE_URL = process.env.BASE_URL || 'https://hentaicop.com';

/**
 * Validasi URL agar hanya URL dari domain target yang diizinkan
 * @param {string} url
 * @returns {{ valid: boolean, message?: string }}
 */
function validateTargetURL(url) {
  if (!url || typeof url !== 'string') {
    return { valid: false, message: 'Parameter url tidak boleh kosong' };
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return { valid: false, message: 'Format URL tidak valid' };
  }

  const allowedHost = new URL(BASE_URL).hostname;
  if (parsed.hostname !== allowedHost) {
    return {
      valid: false,
      message: `URL harus berasal dari domain ${allowedHost}`,
    };
  }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { valid: false, message: 'Protokol URL harus http atau https' };
  }

  return { valid: true };
}

/**
 * Validasi query search tidak kosong dan cukup panjang
 * @param {string} q
 * @returns {{ valid: boolean, message?: string }}
 */
function validateSearchQuery(q) {
  if (!q || typeof q !== 'string' || q.trim().length === 0) {
    return { valid: false, message: 'Parameter q (query) tidak boleh kosong' };
  }
  if (q.trim().length < 2) {
    return { valid: false, message: 'Query minimal 2 karakter' };
  }
  if (q.trim().length > 100) {
    return { valid: false, message: 'Query maksimal 100 karakter' };
  }
  return { valid: true };
}

/**
 * Validasi genre slug: hanya huruf, angka, dan tanda hubung
 * @param {string} slug
 * @returns {{ valid: boolean, message?: string }}
 */
function validateSlug(slug) {
  if (!slug || typeof slug !== 'string' || slug.trim().length === 0) {
    return { valid: false, message: 'Slug genre tidak boleh kosong' };
  }
  if (!/^[\w-]+$/.test(slug)) {
    return { valid: false, message: 'Slug genre hanya boleh mengandung huruf, angka, dan tanda hubung' };
  }
  return { valid: true };
}

/**
 * Validasi nomor halaman (page) harus bilangan bulat positif
 * @param {number|string} page
 * @returns {{ valid: boolean, message?: string }}
 */
function validatePage(page) {
  const num = parseInt(page);
  if (isNaN(num) || num < 1) {
    return { valid: false, message: 'Nomor halaman harus berupa bilangan bulat positif' };
  }
  return { valid: true };
}

module.exports = { validateTargetURL, validateSearchQuery, validateSlug, validatePage };
