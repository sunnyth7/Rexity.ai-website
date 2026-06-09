/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Sprint O — O3-T7..T11 — security headers.
  // CSP is intentionally permissive for the Omi page because it embeds an
  // iframe (with sticky scroll-proxy), loads GSAP from gsap.com, fonts from
  // Google Fonts, and Tailwind from CDN. Tighten further once O3-T1/T3
  // self-hosts the externals.
  async headers() {
    const baseSecurity = [
      { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
    ]
    return [
      // Everything except the Omi page: tight CSP.
      {
        source: "/((?!rexity-omi).*)",
        headers: [
          ...baseSecurity,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "connect-src 'self' https://va.vercel-scripts.com",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      // Omi page (Webflow export with embedded GSAP iframe + inlined Tailwind).
      // O3-T1: Google Fonts external loads removed; CSS now uses Inter (self-hosted) + system fallbacks.
      // O3-T3: GSAP is inlined in the export, not CDN-fetched. CSP can be tight.
      {
        source: "/rexity-omi/:path*",
        headers: [
          ...baseSecurity,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data: blob:",
              "media-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-src 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

export default nextConfig
