# AI Assistant Chat Component

A reusable, floating AI chat widget for Next.js applications with a beautiful dark theme and RGB glow effects.

## Features

- 🎨 Beautiful dark theme with glassmorphism effects
- ✨ RGB glow animation on collapsed state
- 📱 Responsive and mobile-friendly
- ⚡ Built with React hooks and TypeScript
- 🎯 Fully customizable via props
- ♿ Accessible with ARIA labels
- 🔄 Auto-scroll to latest messages
- 💬 Support for JSON and plain text responses

## Installation

1. Copy `AIAssistantChat.tsx` to your project's components directory
2. Set up the API route (see below)
3. Import and use the component

## Usage

### Basic Example

\`\`\`tsx
import AIAssistantChat from '@/components/AIAssistantChat'

export default function MyPage() {
  return (
    <div>
      <h1>My App</h1>
      <AIAssistantChat
        apiEndpoint="/api/chat"
        assistantName="My AI Assistant"
        welcomeMessage="Hi! How can I help you today?"
      />
    </div>
  )
}
\`\`\`

### Advanced Example with Custom Styling

\`\`\`tsx
<AIAssistantChat
  apiEndpoint="/api/maintenance-chat"
  assistantName="Maintenance Assistant"
  welcomeMessage="Hi there! I'm your Maintenance Assistant. How can I help you today?"
  placeholder="Ask me anything about maintenance..."
  helpText="I'll help you with maintenance notifications via your n8n flow."
  collapsedButtonText="Chat with Maintenance Assistant"
  startCollapsed={true}
  position={{ right: 20, bottom: 20 }}
  customStyles={{
    primaryColor: "#1a1a1a",
    backgroundColor: "rgba(0,0,0,0.3)",
    textColor: "#ffffff"
  }}
/>
\`\`\`

## API Route Setup

Create an API route to handle chat messages. Here's an example using Next.js App Router:

### app/api/chat/route.ts

\`\`\`typescript
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

// Your webhook URL (e.g., n8n, Make.com, or custom AI endpoint)
const CHAT_WEBHOOK = process.env.CHAT_WEBHOOK_URL

export async function POST(req: Request) {
  if (!CHAT_WEBHOOK) {
    return NextResponse.json(
      { error: "CHAT_WEBHOOK_URL is not set" }, 
      { status: 500 }
    )
  }

  const body = await req.text()

  try {
    const upstream = await fetch(CHAT_WEBHOOK, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    })

    const raw = await upstream.text()

    // Parse JSON response and extract message
    let textOut = raw
    try {
      const json = JSON.parse(raw)
      // Try common response field names
      if (typeof json?.output === "string") textOut = json.output
      else if (typeof json?.message === "string") textOut = json.message
      else if (typeof json?.text === "string") textOut = json.text
      else if (typeof json?.reply === "string") textOut = json.reply
    } catch {
      // Keep raw text if not JSON
    }

    return new NextResponse(textOut, {
      status: upstream.status,
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to reach chat webhook" }, 
      { status: 502 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
\`\`\`

### Environment Variables

Add to your `.env.local`:

\`\`\`bash
CHAT_WEBHOOK_URL=https://your-webhook-url.com/webhook
\`\`\`

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `apiEndpoint` | `string` | **Required** | API endpoint to send messages to |
| `assistantName` | `string` | `"AI Assistant"` | Display name of the assistant |
| `welcomeMessage` | `string` | `"Hi there! How can I help you today?"` | Initial bot message |
| `placeholder` | `string` | `"Type your question…"` | Input placeholder text |
| `helpText` | `string` | `"I'm here to assist you with your questions."` | Help text below messages |
| `collapsedButtonText` | `string` | `"Chat with Assistant"` | Text on collapsed button |
| `startCollapsed` | `boolean` | `true` | Whether to start collapsed |
| `errorMessage` | `string` | Default error message | Custom error message |
| `position` | `object` | `{ right: 16, bottom: 16 }` | Widget position |
| `customStyles` | `object` | `{}` | Custom color overrides |

### Custom Styles Object

\`\`\`typescript
{
  primaryColor?: string      // Header background color
  backgroundColor?: string   // Chat box background
  textColor?: string        // Header text color
}
\`\`\`

## Integration Examples

### n8n Webhook

1. Create an n8n workflow with a Webhook node
2. Add your AI logic (OpenAI, Anthropic, etc.)
3. Return the response in one of these formats:

\`\`\`json
// Option 1: Simple text
"Your AI response here"

// Option 2: JSON with output field
{
  "output": "Your AI response here"
}

// Option 3: JSON with message field
{
  "message": "Your AI response here"
}
\`\`\`

### Make.com (Integromat)

Similar to n8n - create a webhook scenario and return text or JSON response.

### Custom API

Any API that accepts POST requests with this format:

\`\`\`json
{
  "message": "User's question"
}
\`\`\`

And returns text or JSON with the response.

## Styling

The component uses inline styles for portability. To customize further:

1. Modify the style objects in the component
2. Use the `customStyles` prop for colors
3. Override the `rgbGlow` animation in your global CSS

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

## License

MIT - Feel free to use in your projects!

## Credits

Built for Rexity.ai Mazda Maintenance Dashboard
