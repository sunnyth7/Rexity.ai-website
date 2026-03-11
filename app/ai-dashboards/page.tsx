import AIPoweredDashboardsClient from "./AIPoweredDashboardsClient"

export const dynamic = "force-static"

export const metadata = {
  title: "AI Powered Dashboards | REXITY.AI - Real-time SAP Analytics & Intelligence",
  description:
    "Access comprehensive AI-powered dashboards for asset management, project tracking, sales analytics, and CRM intelligence. Real-time insights with predictive analytics for SAP enterprises.",
  keywords: [
    "AI Dashboards",
    "SAP Analytics",
    "Asset Management Dashboard",
    "Project Management Analytics",
    "Sales Analytics",
    "CRM Intelligence",
    "Real-time Analytics",
    "Predictive Analytics",
  ],
}

export default function AIPoweredDashboardsPage() {
  return <AIPoweredDashboardsClient />
}
