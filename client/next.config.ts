import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'flagcdn.com' },
      // Allow Next.js <Image> to load directly from source CDNs if needed.
      // The /api/proxy/image route handles hotlink-protected images.
      { protocol: 'https', hostname: 'img.hentaicop.net' },
      { protocol: 'https', hostname: 'i.hentaicop.net' },
      { protocol: 'https', hostname: 'cdn.hentaicop.com' },
      { protocol: 'https', hostname: '*.wp.com' },
    ],
  },
  // Expose BASE_URL to API route server code (scrapers read process.env.BASE_URL)
  env: {
    BASE_URL: process.env.BASE_URL || 'https://hentaicop.com',
  },
};

export default nextConfig;
