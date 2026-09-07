/**
 * Centralized error handler middleware
 * Tangkap semua error yang di-next() dari route handlers
 */
function errorHandler(err, req, res, next) {
  // Log error ke console untuk debugging
  console.error(`[ERROR] ${req.method} ${req.originalUrl} -> ${err.message}`);
  if (process.env.NODE_ENV === 'development' && err.stack) {
    console.error(err.stack);
  }

  const statusCode = err.statusCode || 500;

  // Map status code ke error code default
  const codeMap = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_SERVER_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };

  const code = err.code || codeMap[statusCode] || 'UNKNOWN_ERROR';

  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message: err.message || 'Terjadi kesalahan pada server',
    },
  });
}

/**
 * Handler untuk route yang tidak ditemukan (404)
 */
function notFoundHandler(req, res) {
  return res.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route ${req.method} ${req.originalUrl} tidak ditemukan`,
    },
  });
}

module.exports = { errorHandler, notFoundHandler };
