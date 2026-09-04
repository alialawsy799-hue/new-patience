import type { NextConfig } from 'next';

/**
 * `frame-src` must allow Vimeo because lessons are rendered through the official
 * Vimeo embed. Everything else is locked down as tightly as the app allows.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob: https://*.vimeocdn.com https://*.vimeo.com https://*.spotlightr.com https://images.unsplash.com",
  "media-src 'self' blob: https://*.vimeocdn.com https://*.vimeo.com https://*.spotlightr.com",
  // Fonts are self-hosted by next/font, so no third-party font origin is needed.
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline' https://player.vimeo.com https://f.vimeocdn.com https://*.spotlightr.com",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://player.vimeo.com https://f.vimeocdn.com https://*.spotlightr.com",
  "connect-src 'self' https://player.vimeo.com https://*.vimeocdn.com https://vimeo.com https://*.vimeo.com https://*.spotlightr.com",
  'frame-src https://player.vimeo.com https://vimeo.com https://*.spotlightr.com',
  "worker-src 'self' blob: https://player.vimeo.com https://f.vimeocdn.com https://*.spotlightr.com",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=(), fullscreen=(self)',
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  serverExternalPackages: ['@electric-sql/pglite', 'exceljs', 'pdfkit'],
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'i.vimeocdn.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      { source: '/:path*', headers: securityHeaders },
      // Never let admin surfaces or authorised media payloads sit in a shared cache.
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, max-age=0' }],
      },
      {
        source: '/admin/:path*',
        headers: [
          { key: 'Cache-Control', value: 'no-store, max-age=0' },
          { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
        ],
      },
    ];
  },
};

export default nextConfig;
