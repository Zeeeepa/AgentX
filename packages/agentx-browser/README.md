# @deepractice-ai/agentx-browser

AgentX SDK for Browser - WebSocket client for Claude Agent.

## Features

- ✅ **Same API as agentx-node**: Unified `Agent` interface
- ✅ **WebSocket Client**: Connects to agentx-node WebSocket server
- ✅ **Type Safe**: Full TypeScript support
- ✅ **Zero Node.js Dependencies**: Pure browser environment
- ✅ **Auto-Reconnect**: Handles connection drops gracefully
- ✅ **Event-Driven**: All responses via events

## Installation

```bash
npm install @deepractice-ai/agentx-browser
# or
pnpm add @deepractice-ai/agentx-browser
```

## Quick Start

### 1. Start WebSocket Server (Node.js)

```typescript
// server.ts
import { createAgent, createWebSocketServer } from '@deepractice-ai/agentx-node'

const agent = createAgent({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

const wsServer = createWebSocketServer({
  agent,
  port: 5200,
})

console.log('WebSocket server:', wsServer.getUrl())
```

### 2. Connect from Browser

```typescript
// browser.ts
import { createAgent } from '@deepractice-ai/agentx-browser'

const agent = createAgent({
  wsUrl: 'ws://localhost:5200/ws',
  sessionId: 'my-session',
})

// Listen for events
agent.on('assistant', (event) => {
  console.log('Assistant:', event.message)
})

agent.on('stream_event', (event) => {
  if (event.delta?.type === 'text_delta') {
    document.getElementById('output')!.textContent += event.delta.text
  }
})

agent.on('result', (event) => {
  if (event.subtype === 'success') {
    console.log('Done! Cost:', event.totalCostUsd)
  }
})

// Send message
await agent.send('Hello!')
```

## API Reference

### `createAgent(config)`

Creates an Agent instance that connects to WebSocket server.

```typescript
interface BrowserAgentConfig {
  wsUrl: string                   // WebSocket server URL (required)
  sessionId: string               // Session ID (required)

  // Optional
  reconnect?: boolean             // Auto-reconnect (default: true)
  reconnectDelay?: number         // Delay in ms (default: 1000)
  maxReconnectAttempts?: number   // Max attempts (default: 5)

  // AgentConfig fields
  systemPrompt?: string
  model?: string
  // ... (server already has these)
}
```

### Agent Methods

Same as `agentx-node`:

```typescript
interface Agent {
  readonly id: string
  readonly sessionId: string
  readonly messages: ReadonlyArray<Message>

  send(message: string): Promise<void>
  on<T>(event: EventType, handler: (payload: EventPayload<T>) => void): () => void
  off<T>(event: EventType, handler: (payload: EventPayload<T>) => void): void
  clear(): void
  destroy(): void
}
```

### Events

All events from `agentx-api`:

- `user` - User message added
- `assistant` - Assistant response (complete)
- `stream_event` - Stream delta (incremental)
- `result` - Final result (success/error)
- `system` - System initialization

## Examples

### React Integration

```tsx
import { createAgent } from '@deepractice-ai/agentx-browser'
import { useState, useEffect } from 'react'

function ChatApp() {
  const [agent] = useState(() => createAgent({
    wsUrl: 'ws://localhost:5200/ws',
    sessionId: 'react-session',
  }))

  const [messages, setMessages] = useState<string[]>([])
  const [streaming, setStreaming] = useState('')

  useEffect(() => {
    // Listen for streaming text
    const unsubStream = agent.on('stream_event', (event) => {
      if (event.delta?.type === 'text_delta') {
        setStreaming(prev => prev + event.delta.text)
      }
    })

    // Listen for complete messages
    const unsubAssistant = agent.on('assistant', (event) => {
      setMessages(prev => [...prev, streaming])
      setStreaming('')
    })

    return () => {
      unsubStream()
      unsubAssistant()
      agent.destroy()
    }
  }, [agent])

  const sendMessage = async (text: string) => {
    setMessages(prev => [...prev, text])
    await agent.send(text)
  }

  return (
    <div>
      {messages.map((msg, i) => <div key={i}>{msg}</div>)}
      {streaming && <div className="streaming">{streaming}</div>}
      <input onKeyPress={e => {
        if (e.key === 'Enter') {
          sendMessage(e.currentTarget.value)
          e.currentTarget.value = ''
        }
      }} />
    </div>
  )
}
```

### Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
  <script type="module">
    import { createAgent } from 'https://cdn.jsdelivr.net/npm/@deepractice-ai/agentx-browser/+esm'

    const agent = createAgent({
      wsUrl: 'ws://localhost:5200/ws',
      sessionId: 'vanilla-session',
    })

    const output = document.getElementById('output')
    const input = document.getElementById('input')

    agent.on('stream_event', (event) => {
      if (event.delta?.type === 'text_delta') {
        output.textContent += event.delta.text
      }
    })

    agent.on('result', (event) => {
      if (event.subtype === 'success') {
        console.log('Cost:', event.totalCostUsd)
      }
    })

    input.addEventListener('keypress', async (e) => {
      if (e.key === 'Enter') {
        await agent.send(input.value)
        input.value = ''
      }
    })
  </script>
</head>
<body>
  <div id="output"></div>
  <input id="input" type="text" placeholder="Type message..." />
</body>
</html>
```

### Connection Status

```typescript
import { createAgent } from '@deepractice-ai/agentx-browser'

const agent = createAgent({
  wsUrl: 'ws://localhost:5200/ws',
  sessionId: 'status-session',
})

// Monitor connection
const provider = agent.provider as BrowserProvider

provider.on('connected', () => {
  console.log('✅ Connected')
})

provider.on('disconnected', () => {
  console.log('❌ Disconnected')
})

provider.on('reconnecting', ({ attempt, delay }) => {
  console.log(`🔄 Reconnecting (${attempt})...`)
})

provider.on('reconnect-failed', () => {
  console.log('❌ Failed to reconnect')
})
```

## Architecture

```
┌─────────────────────────────────────────────┐
│         Browser (React/Vue/Vanilla)         │
│  ┌─────────────────────────────────────┐   │
│  │  agentx-browser                      │   │
│  │  ┌────────────┐  ┌────────────────┐ │   │
│  │  │   Agent    │←─│BrowserProvider │ │   │
│  │  └────────────┘  └───────┬────────┘ │   │
│  │                          │           │   │
│  │                  WebSocket (native)  │   │
│  └──────────────────────────┼───────────┘   │
└─────────────────────────────┼───────────────┘
                              │
                              │ ws://host:port/ws
                              │
┌─────────────────────────────┼───────────────┐
│                             ▼               │
│  ┌─────────────────────────────────────┐   │
│  │  agentx-node WebSocket Server       │   │
│  └─────────────────┬───────────────────┘   │
│                    │                        │
│  ┌─────────────────▼───────────────────┐   │
│  │  Agent (ClaudeProvider)             │   │
│  │  ↓                                  │   │
│  │  Anthropic Claude API               │   │
│  └─────────────────────────────────────┘   │
│                                             │
│          Node.js Server                     │
└─────────────────────────────────────────────┘
```

## Comparison with agentx-node

| Feature | agentx-node | agentx-browser |
|---------|-------------|----------------|
| Environment | Node.js | Browser |
| Provider | ClaudeProvider | BrowserProvider |
| Connection | Direct to Claude API | WebSocket to server |
| API Key | Required | Optional (server has it) |
| Agent API | ✅ Same | ✅ Same |
| Events | ✅ Same | ✅ Same |

## See Also

- [agentx-node](../agentx-node/README.md) - Node.js SDK with WebSocket server
- [agentx-api](../agentx-api/README.md) - Agent interface definitions
- [agentx-types](../agentx-types/README.md) - Type definitions
