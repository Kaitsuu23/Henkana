export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Naikkan batas EventEmitter listener untuk menghindari
    // MaxListenersExceededWarning dari Gzip/HTTP streams saat
    // banyak concurrent fetch ke API server
    const { EventEmitter } = await import('events');
    EventEmitter.defaultMaxListeners = 50;
  }
}
