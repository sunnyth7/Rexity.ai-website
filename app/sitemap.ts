import type { MetadataRoute } from "next"
import { SERVICES } from "@/lib/services"

const BASE = "https://rexity.ai"

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const staticRoutes = ["", "/services", "/about", "/contact", "/privacy"].map((path) => ({
    url: `${BASE}${path}`,
    lastModified: now,
  }))
  const serviceRoutes = SERVICES.map((s) => ({
    url: `${BASE}/services/${s.slug}`,
    lastModified: now,
  }))
  return [...staticRoutes, ...serviceRoutes]
}
