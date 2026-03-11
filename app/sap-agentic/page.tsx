export const dynamic = "force-static"

export const metadata = {
  title: "SAP Agentic AI Workflows | REXITY.AI - Intelligent SAP Automation",
  description:
    "Discover REXITY's SAP Agentic AI Workflows - intelligent autonomous agents for sales orders, asset maintenance, project management, and plant operations. Transform your SAP ecosystem with AI-powered automation.",
  keywords: [
    "SAP Agentic AI",
    "SAP Workflows",
    "SAP Automation",
    "Asset Maintenance AI",
    "SAP Sales Order Automation",
    "SAP Project Management",
    "Plant Maintenance AI",
    "SAP AI Agents",
  ],
  openGraph: {
    title: "SAP Agentic AI Workflows | REXITY.AI",
    description:
      "Intelligent autonomous agents for SAP - automate sales orders, asset maintenance, project management, and more with AI-powered workflows.",
    url: "https://rexity.ai/sap-agentic",
    type: "website",
  },
}

import SAPAgenticAIClientPage from "./SAPAgenticAIClientPage"

export default function SAPAgenticAIPage() {
  return <SAPAgenticAIClientPage />
}
