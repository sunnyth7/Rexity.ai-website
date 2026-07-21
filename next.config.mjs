/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },

  // Clean URLs for the static legal pages copied into public/ from the
  // main (static) branch. /impressum → /impressum.html, etc. so the footer
  // links resolve on this Next.js app too.
  async rewrites() {
    const legal = ["impressum", "datenschutz", "agb", "aeb", "barrierefreiheit", "privacy"]
    return legal.map((name) => ({ source: `/${name}`, destination: `/${name}.html` }))
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
      // Everything except the Omi page and the static legal HTML pages: tight CSP.
      {
        source: "/((?!rexity-omi|impressum|datenschutz|agb|aeb|barrierefreiheit|privacy).*)",
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
      // Static legal pages (Tailwind CDN + Google Fonts).
      {
        source: "/:page(impressum|datenschutz|agb|aeb|barrierefreiheit|privacy):ext(\\.html)?",
        headers: [
          ...baseSecurity,
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com data:",
              "img-src 'self' data: blob:",
              "connect-src 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
      // Omi page (Webflow + Workspace-IT export).
      // The iframe page legitimately depends on external WSIT WordPress CSS,
      // Google Fonts, and other 3rd-party styling. Adding a strict CSP here
      // breaks layout (visitor sees unstyled HTML). Until we self-host those
      // externals (deferred to a later sprint), the Omi page gets only the
      // non-style security headers — no CSP. The other Next routes still get
      // the tight default CSP defined above.
      {
        source: "/rexity-omi/:path*",
        headers: baseSecurity,
      },
    ]
  },
}

export default nextConfig
