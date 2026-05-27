import { notFound } from "next/navigation"
import { SERVICES, getService } from "@/lib/services"
import { ServiceDetail } from "./service-detail"

export function generateStaticParams() {
  return SERVICES.map((s) => ({ slug: s.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const s = getService(slug)
  if (!s) return {}
  return { title: s.title.en, description: s.summary.en }
}

export default async function ServicePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getService(slug)) notFound()
  return <ServiceDetail slug={slug} />
}
